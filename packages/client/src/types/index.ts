export type ReportCategory = 'performance' | 'accessibility' | 'best-practices' | 'seo'

export interface Site {
  id: string
  name: string
  url: string
}

export interface JobStatus {
  percentage: number
  completed: number
  total: number
  timeRemaining: string
  cpuUsage: number
}

export interface BaseReport {
  id: string
  page: string
  path: string
  score: number
  reportUrl: string
}

export interface PerformanceReport extends BaseReport {
  fcp: number
  lcp: number
  cls: number
  tbt: number
}

export interface AccessibilityReport extends BaseReport {
  colorContrast: number
  headings: number
  aria: number
}

export interface BestPracticesReport extends BaseReport {
  errors: number
  inspectorIssues: number
  imagesResponsive: number
}

export interface SeoReport extends BaseReport {
  indexable: boolean
  internalLinks: number
  externalLinks: number
  description: string
}

export type Report = PerformanceReport | AccessibilityReport | BestPracticesReport | SeoReport
