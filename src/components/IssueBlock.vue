<script setup lang="ts">
import type { Categories, Issue } from '@/types'

defineProps<{
  issue: Issue
  categories: Categories
}>()

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return '🔴'
    case 'warning':
      return '⚠️'
    default:
      return 'ℹ️'
  }
}

function getSeverityClass(severity: string) {
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-300'
    case 'warning':
      return 'text-yellow-700 bg-yellow-50 border-yellow-300'
    default:
      return 'text-blue-700 bg-blue-50 border-blue-300'
  }
}
</script>

<template>
  <div :class="['border rounded-lg p-4', getSeverityClass(issue.severity)]">
    <div class="flex items-start gap-2">
      <span class="text-xl">{{ getSeverityIcon(issue.severity) }}</span>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="text-xs font-semibold uppercase">
            {{ issue.severity }}
          </span>
          <span class="text-xs">
            {{ categories[issue.category]?.icon }} {{ categories[issue.category]?.label }}
          </span>
          <span v-if="issue.lineNumber > 0" class="text-xs"> Line {{ issue.lineNumber }} </span>
        </div>
        <h4 class="font-semibold mb-2">{{ issue.title }}</h4>
        <p class="text-sm mb-2">{{ issue.description }}</p>
        <div class="text-sm font-medium">💡 Fix: {{ issue.fix }}</div>
      </div>
    </div>
  </div>
</template>
