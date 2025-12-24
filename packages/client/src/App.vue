<script setup lang="ts">
import { computed } from 'vue'
import { useReports } from '@/composables/useReports'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import ReportTable from '@/components/ReportTable.vue'

const {
  activeCategory,
  pathFilter,
  getReports,
  filterReportsByPath,
  openReport
} = useReports()

const filteredReports = computed(() => {
  const reports = getReports(activeCategory.value)
  return filterReportsByPath(reports, pathFilter.value)
})
</script>

<template>
  <div class="flex flex-col h-svh">
    <AppHeader />

    <div class="flex-1 flex overflow-hidden">
      <UDashboardSidebar collapsible resizable>
        <template #default>
          <AppSidebar v-model="activeCategory" />
        </template>
      </UDashboardSidebar>

      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 p-4 overflow-hidden">
          <ReportTable
            :category="activeCategory"
            :reports="filteredReports"
            @open-report="openReport"
          />
        </div>
      </div>
    </div>
  </div>
</template>
