import { ref } from 'vue'
import type { Site, JobStatus, Report, ReportCategory, PerformanceReport, AccessibilityReport, BestPracticesReport, SeoReport } from '@/types'

const mockSites: Site[] = [
  { id: '1', name: 'example.com', url: 'https://example.com' },
  { id: '2', name: 'test-site.org', url: 'https://test-site.org' },
  { id: '3', name: 'demo-app.io', url: 'https://demo-app.io' }
]

const mockPerformanceReports: PerformanceReport[] = [
  {
    id: '1', page: 'Home', path: '/', score: 92, reportUrl: '/reports/home.html',
    fcp: 1.2, lcp: 2.1, cls: 0.05, tbt: 45
  },
  {
    id: '2', page: 'About', path: '/about', score: 85, reportUrl: '/reports/about.html',
    fcp: 1.5, lcp: 2.8, cls: 0.15, tbt: 120
  },
  {
    id: '3', page: 'Products', path: '/products', score: 78, reportUrl: '/reports/products.html',
    fcp: 2.1, lcp: 3.5, cls: 0.25, tbt: 250
  },
  {
    id: '4', page: 'Contact', path: '/contact', score: 95, reportUrl: '/reports/contact.html',
    fcp: 0.9, lcp: 1.8, cls: 0.02, tbt: 30
  },
  {
    id: '5', page: 'Blog', path: '/blog', score: 67, reportUrl: '/reports/blog.html',
    fcp: 2.8, lcp: 4.2, cls: 0.35, tbt: 380
  }
]

const mockAccessibilityReports: AccessibilityReport[] = [
  {
    id: '1', page: 'Home', path: '/', score: 88, reportUrl: '/reports/home.html',
    colorContrast: 95, headings: 82, aria: 90
  },
  {
    id: '2', page: 'About', path: '/about', score: 72, reportUrl: '/reports/about.html',
    colorContrast: 78, headings: 65, aria: 70
  },
  {
    id: '3', page: 'Products', path: '/products', score: 95, reportUrl: '/reports/products.html',
    colorContrast: 98, headings: 92, aria: 96
  },
  {
    id: '4', page: 'Contact', path: '/contact', score: 83, reportUrl: '/reports/contact.html',
    colorContrast: 85, headings: 80, aria: 85
  },
  {
    id: '5', page: 'Blog', path: '/blog', score: 90, reportUrl: '/reports/blog.html',
    colorContrast: 92, headings: 88, aria: 90
  }
]

const mockBestPracticesReports: BestPracticesReport[] = [
  {
    id: '1', page: 'Home', path: '/', score: 90, reportUrl: '/reports/home.html',
    errors: 0, inspectorIssues: 2, imagesResponsive: 100
  },
  {
    id: '2', page: 'About', path: '/about', score: 75, reportUrl: '/reports/about.html',
    errors: 2, inspectorIssues: 5, imagesResponsive: 85
  },
  {
    id: '3', page: 'Products', path: '/products', score: 82, reportUrl: '/reports/products.html',
    errors: 1, inspectorIssues: 3, imagesResponsive: 92
  },
  {
    id: '4', page: 'Contact', path: '/contact', score: 88, reportUrl: '/reports/contact.html',
    errors: 0, inspectorIssues: 1, imagesResponsive: 95
  },
  {
    id: '5', page: 'Blog', path: '/blog', score: 68, reportUrl: '/reports/blog.html',
    errors: 3, inspectorIssues: 8, imagesResponsive: 70
  }
]

const mockSeoReports: SeoReport[] = [
  {
    id: '1', page: 'Home', path: '/', score: 94, reportUrl: '/reports/home.html',
    indexable: true, internalLinks: 45, externalLinks: 8, description: 'Main landing page'
  },
  {
    id: '2', page: 'About', path: '/about', score: 87, reportUrl: '/reports/about.html',
    indexable: true, internalLinks: 12, externalLinks: 3, description: 'Company information'
  },
  {
    id: '3', page: 'Products', path: '/products', score: 91, reportUrl: '/reports/products.html',
    indexable: true, internalLinks: 78, externalLinks: 15, description: 'Product catalog'
  },
  {
    id: '4', page: 'Contact', path: '/contact', score: 89, reportUrl: '/reports/contact.html',
    indexable: true, internalLinks: 8, externalLinks: 2, description: 'Contact information'
  },
  {
    id: '5', page: 'Blog', path: '/blog', score: 73, reportUrl: '/reports/blog.html',
    indexable: true, internalLinks: 32, externalLinks: 10, description: 'Blog posts index'
  }
]

const mockJobStatus: JobStatus = {
  percentage: 67,
  completed: 134,
  total: 200,
  timeRemaining: '12 min',
  cpuUsage: 45
}

export function useReports() {
  const selectedSite = ref<Site>(mockSites[0]!)
  const sites = ref<Site[]>(mockSites)
  const jobStatus = ref<JobStatus>(mockJobStatus)
  const activeCategory = ref<ReportCategory>('performance')
  const pathFilter = ref('')

  function getReports(category: ReportCategory): Report[] {
    switch (category) {
      case 'performance':
        return mockPerformanceReports
      case 'accessibility':
        return mockAccessibilityReports
      case 'best-practices':
        return mockBestPracticesReports
      case 'seo':
        return mockSeoReports
      default:
        return []
    }
  }

  function filterReportsByPath(reports: Report[], filter: string): Report[] {
    if (!filter) return reports
    return reports.filter(r => r.path.toLowerCase().includes(filter.toLowerCase()))
  }

  function openReport(url: string) {
    window.open(url, '_blank')
  }

  function rescanSite() {
    console.log('Triggering rescan for site:', selectedSite.value.name)
  }

  return {
    selectedSite,
    sites,
    jobStatus,
    activeCategory,
    pathFilter,
    getReports,
    filterReportsByPath,
    openReport,
    rescanSite
  }
}
