<script setup lang="ts">
import { h, resolveComponent, computed } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Report, ReportCategory, PerformanceReport, AccessibilityReport, BestPracticesReport, SeoReport } from '@/types'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const props = defineProps<{
  category: ReportCategory
  reports: Report[]
}>()

const emit = defineEmits<{
  (e: 'open-report', url: string): void
}>()

function getScoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 90) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
}

function scoreCell({ row }: { row: any }) {
  const score = row.original.score as number
  return h(UBadge, {
    color: getScoreColor(score),
    variant: 'subtle',
    class: 'font-medium'
  }, () => score.toString())
}

function actionCell({ row }: { row: any }) {
  return h('div', { class: 'text-right' }, h(UButton, {
    icon: 'i-lucide-external-link',
    size: 'xs',
    variant: 'ghost',
    color: 'neutral',
    onClick: () => emit('open-report', row.original.reportUrl)
  }))
}

const performanceColumns: TableColumn<PerformanceReport>[] = [
  { accessorKey: 'page', header: 'Page' },
  { accessorKey: 'path', header: 'Path' },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: scoreCell
  },
  { accessorKey: 'fcp', header: 'FCP (s)' },
  { accessorKey: 'lcp', header: 'LCP (s)' },
  { accessorKey: 'cls', header: 'CLS' },
  { accessorKey: 'tbt', header: 'TBT (ms)' },
  {
    id: 'actions',
    cell: actionCell
  }
]

const accessibilityColumns: TableColumn<AccessibilityReport>[] = [
  { accessorKey: 'page', header: 'Page' },
  { accessorKey: 'path', header: 'Path' },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: scoreCell
  },
  { accessorKey: 'colorContrast', header: 'Color Contrast' },
  { accessorKey: 'headings', header: 'Headings' },
  { accessorKey: 'aria', header: 'ARIA' },
  {
    id: 'actions',
    cell: actionCell
  }
]

const bestPracticesColumns: TableColumn<BestPracticesReport>[] = [
  { accessorKey: 'page', header: 'Page' },
  { accessorKey: 'path', header: 'Path' },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: scoreCell
  },
  { accessorKey: 'errors', header: 'Errors' },
  { accessorKey: 'inspectorIssues', header: 'Inspector Issues' },
  { accessorKey: 'imagesResponsive', header: 'Images Responsive' },
  {
    id: 'actions',
    cell: actionCell
  }
]

const seoColumns: TableColumn<SeoReport>[] = [
  { accessorKey: 'page', header: 'Page' },
  { accessorKey: 'path', header: 'Path' },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: scoreCell
  },
  {
    accessorKey: 'indexable',
    header: 'Indexable',
    cell: ({ row }: any) => h(UBadge, {
      color: row.original.indexable ? 'success' : 'error',
      variant: 'subtle'
    }, () => row.original.indexable ? 'Yes' : 'No')
  },
  { accessorKey: 'internalLinks', header: 'Internal Links' },
  { accessorKey: 'externalLinks', header: 'External Links' },
  { accessorKey: 'description', header: 'Description' },
  {
    id: 'actions',
    cell: actionCell
  }
]

const columns = computed(() => {
  switch (props.category) {
    case 'performance': return performanceColumns
    case 'accessibility': return accessibilityColumns
    case 'best-practices': return bestPracticesColumns
    case 'seo': return seoColumns
  }
})
</script>

<template>
  <UTable
    :data="reports"
    :columns="columns"
    sticky
    class="flex-1"
  />
</template>
