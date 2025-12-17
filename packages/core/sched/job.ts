import type { Page } from 'puppeteer-core'
import type { Result } from 'lighthouse'
import { computeMedianRun } from 'lighthouse/core/lib/median-run.js'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { ensureDir } from 'fs-extra'
import { sumBy, pick, map } from 'lodash'
import type { GolighthouseJobReturn, GolighthouseReportData } from '../types'
import { useLogger } from '../logging'
import type { PuppeteerJobExecutor } from '../types'
import { ReportArtifacts } from '../constants'
import { base64ToBuffer } from '../toolkits/sed'
import { routeUrl } from '../route'

function normaliseLighthouseResult(artifactPath: string, result: Result): GolighthouseReportData {
  const measuredCategories = 
    Object.values(result.categories)
    .filter(c => typeof c.score !== 'undefined') as { score: number }[]

  const imageIssues = [
    result.audits['unsized-images'],
    result.audits['preload-lcp-image'],
    result.audits['offscreen-images'],
    result.audits['modern-image-formats'],
    result.audits['uses-optimized-images'],
    result.audits['efficient-animated-content'],
    result.audits['uses-responsive-images'],
  ]
    .map(d => (d?.details as any)?.items || [])
    .flat()
  const ariaIssues = Object.values(result.audits)
    // @ts-expect-error untyped
    .filter(a => a && a.id.startsWith('aria-') && a.details?.items?.length > 0)
    // @ts-expect-error untyped
    .map(a => a.details?.items)
    .flat()
  // @ts-expect-error untyped
  if (result.audits['screenshot-thumbnails']?.details?.items) {
    // need to convert the base64 screenshot-thumbnails into their file name
    // @ts-expect-error untyped
    for (const k in result.audits['screenshot-thumbnails'].details.items) {
      const path = join(artifactPath, ReportArtifacts.screenshotThumbnailsDir, `${k}.jpeg`)
      // @ts-expect-error untyped
      result.audits['screenshot-thumbnails'].details.items[k].data = path
    }
  }
  // map the json report to what values we actually need
  return {
    // @ts-expect-error type override
    categories: map(result.categories, (c, k) => {
      return {
        key: k,
        id: k,
        ...pick(c, ['title', 'score']),
      }
    }),
    ...pick(result, [
      'fetchTime',
      'audits.redirects',
      // core web vitals
      'audits.layout-shifts',
      'audits.largest-contentful-paint-element',
      'audits.largest-contentful-paint',
      'audits.cumulative-layout-shift',
      'audits.first-contentful-paint',
      'audits.total-blocking-time',
      'audits.max-potential-fid',
      'audits.interactive',
    ]),
    computed: {
      imageIssues: {
        details: {
          items: imageIssues,
        },
        displayValue: imageIssues.length,
        score: imageIssues.length > 0 ? 0 : 1,
      },
      ariaIssues: {
        details: {
          items: ariaIssues,
        },
        displayValue: ariaIssues.length,
        score: ariaIssues.length > 0 ? 0 : 1,
      },
    },
    score: Math.round(sumBy(measuredCategories, 'score') / measuredCategories.length * 100) / 100,
  }
}

export const lighthouseJobExecutor: PuppeteerJobExecutor = async (args) => {
  const { page, data: job } = args
  const { context: { hooks, userConfig, runtimeSetting }, route } = job
  const log = useLogger()

  const setJobExecuted = () => {
    job.executedAt = Date.now()
    job.status = 'running'
  }

  const setJobFailed = () => {
    job.finishedAt = Date.now()
    job.status = 'failed'
  }

  const setJobFailedRetry = () => {
    job.finishedAt = Date.now()
    job.status = 'failed-retry'
  }

  setJobExecuted()

  const setupPage = async (page: Page) => {
    const browser = page.browser()

    browser.on('targetchanged', async (target) => {
      const page = await target.page()
      if (page) {
        await hooks.callHook('puppeteer:before-goto', page)
      }
    })

    if (route.siteDomainRotation) {
      await page.goto(route.siteUrl, { waitUntil: 'domcontentloaded' })
    }
  }

  await setupPage(page)

  const port = new URL(page.browser().wsEndpoint()).port
  const { sampler } = userConfig
  const { artifactsDir, lighthouseOptions, lighthouseProcessPath } = runtimeSetting
  const siteURL = new URL(route.siteUrl)
  const artifactPath = join(artifactsDir, siteURL.host)
  const urlToRun = routeUrl(page.url(), route.url)
  const jobRet: GolighthouseJobReturn = {
    job,
    report: {
      artifactPath
    }
  }

  await ensureDir(artifactPath)

  const lighthouseArgs = [
    `--lighthouseOptions=${JSON.stringify(lighthouseOptions)}`,
    `--url=${urlToRun}`,
    `--port=${port}`,
    `--artifactPath=${artifactPath}`,
  ]
  const reportJsonPath = join(artifactPath, ReportArtifacts.reportJson)

  const samples: Result[] = []
  for (let i = 0; i < sampler.size; i++) {
    try {
      // Spawn a worker process
      const worker = (await import('execa'))
        .execa(
          // handles stubbing
          'bun',
          [lighthouseProcessPath, ...lighthouseArgs],
          {
            timeout: 6 * 60 * 1000,
          },
        )
      worker.stdout.pipe(process.stdout)
      worker.stderr.pipe(process.stderr)
      const res = await worker
      if (res) {
        const file = Bun.file(reportJsonPath)
        const json = await file.json()
        samples.push(json)
      }
    } catch (e: any) {
      log.error('Failed to run lighthouse for route', e)
      setJobFailed()
      return jobRet
    }
  }

  let lhResult = samples[0]

  if (!lhResult) {
    log.error('Failed to execute lighthouse job')
    setJobFailed()
    return jobRet
  }

  if (lhResult.categories['performance'] && !lhResult.categories['performance'].score) {
    log.warn(`Failed to run performance audit for ${route.url}, adding back to queue.`)
    setJobFailedRetry()
    return jobRet
  }

  if (samples.length > 1) {
    try {
      lhResult = computeMedianRun(samples)
    } catch (e) {
      log.warn('Failed to compute median score, possibly audit failed.', e)
    }
  }

  // @ts-expect-error untyped
  if (lhResult?.audits?.['final-screenshot']?.details?.data) {
    const file = Bun.file(join(artifactPath, ReportArtifacts.screenshot))
    // @ts-expect-error untyped
    await file.write(base64ToBuffer(lhResult.audits['final-screenshot'].details?.data))
  }

  if (lhResult?.fullPageScreenshot?.screenshot.data) {
    const file = Bun.file(join(artifactPath, ReportArtifacts.fullScreenScreenshot))
    await file.write(base64ToBuffer(lhResult.fullPageScreenshot.screenshot.data))
  }

  const screenshotThumbnails = lhResult?.audits?.['screenshot-thumbnails']?.details
  await mkdir(join(artifactPath, ReportArtifacts.screenshotThumbnailsDir), { recursive: true })
  // @ts-expect-error untyped
  if (screenshotThumbnails?.items && screenshotThumbnails.type === 'filmstrip') {
    for (const key in screenshotThumbnails.items) {
      const thumbnail = screenshotThumbnails.items[key]
      if (thumbnail) {
        const file = Bun.file(join(artifactPath, ReportArtifacts.screenshotThumbnailsDir, `${key}.jpeg`))
        await file.write(base64ToBuffer(thumbnail.data))
      }
    }
  }

  jobRet.report.data = normaliseLighthouseResult(artifactPath, lhResult!)

  return jobRet
}