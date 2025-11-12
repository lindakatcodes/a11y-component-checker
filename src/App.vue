<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'A11y Component Checker',
  bodyAttrs: {
    class: 'bg-gray-50',
  },
})
</script>

<template>
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Accessible Component Checker</h1>
    <p class="text-gray-600">
      Paste your component code below to check for common accessibility issues
    </p>
  </header>
</template>

<style>
@import 'tailwindcss';
</style>
