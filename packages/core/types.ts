import type { Cluster, TaskFunction } from 'puppeteer-cluster'
import type { Flags, Result } from 'lighthouse'
import type { LaunchOptions, Page } from 'puppeteer-core'
import type { Route } from './route'
import type { Hookable } from 'hookable'

export interface ModeProvider {
  name: 'cli' | 'ci'
  version: string
}

export interface GolighthouseContext {
  provider: ModeProvider
  hooks: Hookable<GolighthouseHooks>
  runtimeSetting: GolighthouseRuntimeSetting
  userConfig: GolighthouseUserConfig
}

export interface GolighthouseRuntimeSetting {
  lighthouseProcessPath: string
  lighthouseOptions: Flags
  puppeteerOptions: LaunchOptions
  clientDir: string
  artifactsDir: string
}

export interface GolighthouseSampler {
  /**
   * @default 1
   */
  size: number
  /**
   * @default true
   */
  throttle: boolean
  categories: string[]
  /**
   * @default mobile
   */
  device: 'desktop' | 'mobile'
  /**
   * @default true
   */
  headless: boolean
}

export interface GolighthouseUserConfig {
  /**
   * the proxy server which will be used by lighthouse process
   * @default null
   */
  proxy?: string
  sites: Site[]
  sampler: GolighthouseSampler
  /**
   * @default false
   */

  debug: boolean
  output: string
}

export interface Site {
  baseUrl: string
  domainRotation?: boolean
  urls?: string[]
}

export type GolighthouseJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'failed-retry'

export interface GolighthouseJob {
  id: string
  context: GolighthouseContext
  route: Route
  status: GolighthouseJobStatus
  createdAt: number
  executedAt?: number
  finishedAt?: number
}

export interface GolighthouseReport {
  artifactPath: string
  data?: GolighthouseReportData
}

export interface GolighthouseJobReturn {
  job: GolighthouseJob
  report: GolighthouseReport
}

export type PuppeteerJobExecutor = TaskFunction<GolighthouseJob, GolighthouseJobReturn>
export type GolighthousePuppetterCluster = Cluster<GolighthouseJob, GolighthouseJobReturn>

export type HookResult = Promise<void> | void

export interface GolighthouseHooks {
  'worker-finished': () => HookResult
  'job-added': (job: GolighthouseJob) => HookResult
  'job-started': (job: GolighthouseJob) => HookResult
  'job-completed': (job: GolighthouseJobReturn,) => HookResult
  'job-failed': (job: GolighthouseJob) => HookResult
  'puppeteer:before-goto': (page: Page) => HookResult
}

export interface ComputedLighthouseReportAudit {
  details?: {
    items?: any[]
  }
  displayValue: string | number
  score: number
}

/**
 * An augmented Lighthouse Report type, we add custom types to the base report for specific functionality on the
 * @golighthouse/client.
 */
export type GolighthouseReportData = Partial<Result> & {
  /**
   * The total score for the result, this is the sum of each category's result
   */
  score: number
  categories: { score: number | null }[]
  computed: {
    /**
     * An aggregation of multiple image audit results.
     */
    imageIssues: ComputedLighthouseReportAudit
    ariaIssues: ComputedLighthouseReportAudit
  }
}