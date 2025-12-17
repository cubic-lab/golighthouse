import type { GolighthouseScheduler } from "./scheduler"

export interface SchedulerMonitorStats {
    /**
   * Status of the worker, completed when all tasks have been completed.
   */
  status: 'completed' | 'working'
  /**
   * Time in ms that the worker has been running
   */
  timeRunning: number
  /**
   * How many tasks have been completed.
   */
  doneTargets: number
  /**
   * Total number of tasks including completed, pending and working.
   */
  allTargets: number
  /**
   * The % of work completed.
   */
  donePercStr: string
  /**
   * The % of errors.
   */
  errorPerc: string
  /**
   * The remaining time until all tasks are completed.
   */
  timeRemaining: number
  /**
   * How many tasks per second are being processed.
   */
  pagesPerSecond: string
  /**
   * The devices CPU usage % out of 100
   */
  cpuUsage: string
  /**
   * The devices memory usage % out of 100
   */
  memoryUsage: string
  /**
   * How many workers are now working, usually the cpu count of the device.
   */
  workers: number
}

export class SchedulerMonitor {
  #sched: GolighthouseScheduler

  constructor(sched: GolighthouseScheduler) {
    this.#sched = sched
  }

  stats(): SchedulerMonitorStats {
    const cluster = this.#sched.cluster
    const now = Date.now()
    const timeDiff = now - cluster['startTime']
    const doneTargets = cluster['allTargetCount'] - cluster['jobQueue'].size() - cluster['workersBusy'].length
    const donePercentage = cluster['allTargetCount'] === 0 ? 1 : (doneTargets / cluster['allTargetCount'])
    const donePercStr = (100 * donePercentage).toFixed(0)
    const errorPerc = doneTargets === 0
      ? '0.00'
      : (100 * cluster['errorCount'] / doneTargets).toFixed(2)
    const timeRunning = timeDiff

    // Calculate weighted time remaining based on task types and their historical durations
    let timeRemainingMillis = -1
    const jobs = this.#sched.jobs

    if (donePercentage !== 0) {
      // Collect historical task times to calculate averages
      const taskDurations: number[] = []

      // Gather actual completed task times
      for (const job of jobs.values().filter(job => job.status === 'completed')) {
          const duration = job.finishedAt ? job.finishedAt - job.createdAt : null
          if (duration) {
            taskDurations.push(duration)
          }
        }

      // Calculate average durations or use defaults
      const avgJobTime = taskDurations.length > 0
        ? taskDurations.reduce((a, b) => a + b, 0) / taskDurations.length
        : 15000 // 15 seconds default

      // Count remaining tasks by type
      let remainingJobs = 0

      for (const job of jobs.values()) {
        const status = job.status
        if (status === 'pending' || status === 'running') {
          remainingJobs++
        }
      }

      // Calculate weighted time remaining
      const estimatedRemainingTime = (remainingJobs * avgJobTime)
      timeRemainingMillis = Math.round(estimatedRemainingTime)

      // Fallback to original calculation if we don't have enough data
      if (remainingJobs === 0 && remainingJobs === 0) {
        timeRemainingMillis = Math.round(((timeDiff) / donePercentage) - timeDiff)
      }
    }

    const timeRemaining = timeRemainingMillis
    const cpuUsage = `${cluster['systemMonitor'].getCpuUsage().toFixed(1)}%`
    const memoryUsage = `${cluster['systemMonitor'].getMemoryUsage().toFixed(1)}%`
    const pagesPerSecond = doneTargets === 0
      ? '0'
      : (doneTargets * 1000 / timeDiff).toFixed(2)

    return {
      status: cluster['allTargetCount'] === doneTargets ? 'completed' : 'working',
      timeRunning,
      doneTargets,
      allTargets: cluster['allTargetCount'],
      donePercStr,
      errorPerc,
      timeRemaining,
      pagesPerSecond,
      cpuUsage,
      memoryUsage,
      workers: cluster['workers'].length + cluster['workersStarting'],
    }
  }
}