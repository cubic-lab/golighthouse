<script setup lang="ts">
import { useReports } from '@/composables/useReports'

const {
  selectedSite,
  sites,
  jobStatus,
  pathFilter,
  rescanSite
} = useReports()
</script>

<template>
  <div class="flex items-center gap-4 px-4 py-3 border-b border-default">
    <span class="text-2xl">⚡ Golighthouse</span>

    <USelect
      v-model="selectedSite"
      :options="sites"
      option-attribute="name"
      value-attribute="id"
      class="w-48"
      placeholder="Select site"
    />

    <UInput
      v-model="pathFilter"
      placeholder="Filter by path..."
      icon="i-lucide-search"
      class="flex-1 max-w-md"
    />

    <UButton icon="i-lucide-refresh-cw" label="Rescan" @click="rescanSite" />

    <div class="flex items-center gap-4 text-sm ml-auto">
      <div class="flex items-center gap-2">
        <span class="text-muted">Progress:</span>
        <UProgress :value="jobStatus.percentage" class="w-24" />
        <span>{{ jobStatus.percentage }}%</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-muted">Jobs:</span>
        <span>{{ jobStatus.completed }}/{{ jobStatus.total }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-muted">Time:</span>
        <span>{{ jobStatus.timeRemaining }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-muted">CPU:</span>
        <UProgress :value="jobStatus.cpuUsage" class="w-16" />
        <span>{{ jobStatus.cpuUsage }}%</span>
      </div>
    </div>
  </div>
</template>
