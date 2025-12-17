import { unionBy } from 'lodash'
import { join } from 'path'
import fs from 'fs-extra'
import { launchPuppeteerCluster } from '../cluster'
import type { Golighthouse } from '../golighthouse'
import { lighthouseJobExecutor } from './job'
import { type Route } from '../route'
import type {
  GolighthouseJob,
  GolighthouseJobReturn,
  GolighthousePuppetterCluster,
  GolighthouseReport,
} from '../types'
import { useLogger } from '../logging'
import { ReportArtifacts } from '../constants'
import { hashPath } from '../toolkits/hash'
import { createProgressBox, type ProgressBox, type ProgressData } from '../toolkits/terms'
import { SchedulerMonitor } from './monitor'

export class GolighthouseScheduler {
  #glh: Golighthouse
  #jobs = new Map<string, GolighthouseJob>()
  #reports = new Map<string, GolighthouseReport>()
  #cluster?: GolighthousePuppetterCluster
  #retriedRoutes = new Map<string, number>()
  #pb: ProgressBox
  #monitor: SchedulerMonitor
  #currentJob: string = ''
  #starTime?: number

  constructor(glh: Golighthouse) {
    this.#glh = glh
    this.#pb = createProgressBox()
    this.#monitor = new SchedulerMonitor(this)
  }

  get cluster() {
    if (!this.#cluster) {
      throw new Error('Cluster is not initialized')
    }
    return this.#cluster
  }

  get jobs() {
    return this.#jobs
  }

  clearProgress() {
    this.#pb.clear()
  }

  async close() {
    await this.cluster?.close()
  }

  async start(routes: Route[]) {
    this.#starTime = Date.now()
    this.#cluster = await launchPuppeteerCluster(this.#glh.context)

    this.queueRoutes(routes)
  }

  queueRoute(route: Route) {
    const { context  } = this.#glh
    const job: GolighthouseJob = {
      id: hashPath(route.path),
      context,
      route,
      status: 'pending',
      createdAt: Date.now(),
    }
    this.doQueue(job)
    this.#glh.hooks.callHook('job-added', job)
    this.updateProgress()
  }

  queueRoutes(routes: Route[]) {
    routes = unionBy(routes, 'url')
    routes.forEach(route => this.queueRoute(route))
  }

  private doQueue(job: GolighthouseJob) {
    const log = useLogger()
    if (!this.#cluster) {
      throw new Error('Cluster is not initialized')
    }
    if (this.#jobs.has(job.id)) return

    this.#cluster.execute(
      job, (arg) => {
        const { data: { route } } = arg
        this.#currentJob = `Lighthouse Job - ${new URL(route.siteUrl).host} - ${route.path}`
        this.updateProgress()
        this.#glh.hooks.callHook('job-started', job)
        return lighthouseJobExecutor(arg)
      })
      .then((ret) => {
        const { job: { status, route } } = ret

        switch (status) {
          case 'failed-retry': {
            const currentRetries = this.#retriedRoutes.get(job.id) || 0
            log.debug(`Job failed ${route.url}, retry attempt ${currentRetries + 1}/3`)

            if (currentRetries < 3) {
              this.#retriedRoutes.set(job.id, currentRetries + 1)
            }
            this.doRequeue(ret)
            break
          }
          case 'completed': {
            this.#glh.hooks.callHook('job-completed', ret)
            this.updateProgress()
            break
          }
          default:
            return
        }
      })
  }

  private doRequeue(ret: GolighthouseJobReturn) {
    const log = useLogger()
    const { id, route } = ret.job
    const { artifactPath } = ret.report
    const currentRetries = this.#retriedRoutes.get(id) || 0
    log.info(`Submitting ${route.url} for a re-queue (attempt ${currentRetries}/3).`)
    // clean up artifacts
    Object.values(ReportArtifacts).forEach((artifact) => {
      fs.rmSync(join(artifactPath, artifact), { force: true, recursive: true })
    })
    this.#jobs.delete(id)
    setTimeout(() => {
      this.doQueue(ret.job)
    }, 3500)
  }

  private updateProgress() {
    if (!process.stdin.isTTY) return

    const stats = this.#monitor.stats()
    const completedJobs = this.jobs.size > 0
      ? [...this.jobs.values()].filter(r =>
          Object.values(r.status).every(status => status === 'completed' || status === 'failed'),
        )
      : []

    // Calculate average score from completed reports
    const scoresFromReports = completedJobs
      .map(job => this.#reports.get(job.id)?.data?.score)
      .filter((score): score is number => typeof score === 'number')

    const averageScore = scoresFromReports.length > 0
      ? scoresFromReports.reduce((sum, score) => sum + score, 0) / scoresFromReports.length
      : undefined

    const progressData: ProgressData = {
      currentJob: this.#currentJob,
      completedJobs: stats.doneTargets,
      totalJobs: stats.allTargets,
      averageScore,
      timeElapsed: Date.now() - (this.#starTime || 0),
      timeRemaining: stats.timeRemaining > 0 ? stats.timeRemaining : undefined,
    }

    this.#pb.update(progressData)
  }
}