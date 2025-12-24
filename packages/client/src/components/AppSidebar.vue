<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { ReportCategory } from '@/types'

const activeCategory = defineModel<ReportCategory>('category', { default: 'performance' })

const items: NavigationMenuItem[][] = [[
  {
    label: 'Performance',
    icon: 'i-lucide-zap',
    value: 'performance',
    active: true,
  },
  {
    label: 'Accessibility',
    icon: 'i-lucide-universal-access',
    value: 'accessibility'
  },
  {
    label: 'Best Practices',
    icon: 'i-lucide-shield-check',
    value: 'best-practices'
  },
  {
    label: 'SEO',
    icon: 'i-lucide-search',
    value: 'seo'
  }
]]
</script>

<template>
  <UNavigationMenu
    :items="items[0]"
    orientation="vertical"
    @update:model-value="activeCategory = $event.value as ReportCategory"
  />
</template>
