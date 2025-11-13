<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { ref } from 'vue'
import CodeEditor from './components/CodeEditor.vue'

useHead({
  title: 'A11y Component Checker',
  bodyAttrs: {
    class: 'bg-gray-50',
  },
})

const showApiInput = ref(false)
const apiKey = ref('')
</script>

<template>
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Accessible Component Checker</h1>
    <p class="text-gray-600">
      Paste your component code below to check for common accessibility issues
    </p>
  </header>

  <div v-if="showApiInput && !apiKey" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <p class="text-sm text-gray-700 mb-2">
      Get a free API key from
      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 underline"
      >
        Google AI Studio
      </a>
    </p>
    <input
      type="password"
      placeholder="Paste your Gemini API key"
      class="w-full px-3 py-2 border border-gray-300 rounded-md"
      v-model="apiKey"
    />
  </div>

  <CodeEditor />

  <footer class="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <div class="flex gap-3">
      <span class="text-2xl">⚠️</span>
      <div>
        <h4 class="font-semibold text-amber-900 mb-1">Important Reminder</h4>
        <p class="text-sm text-amber-800">
          This tool provides AI-powered suggestions to help identify common accessibility issues.
          However, it should not be your only check. Always run additional tools like
          <a href="https://wave.webaim.org/" target="_blank" class="underline font-medium">WAVE</a>,
          <a href="https://www.deque.com/axe/" target="_blank" class="underline font-medium"
            >axe DevTools</a
          >, or
          <a
            href="https://developer.chrome.com/docs/lighthouse/"
            target="_blank"
            class="underline font-medium"
            >Lighthouse</a
          >
          to confirm changes and check for more detailed accessibility issues. Real user testing
          with assistive technologies is also essential.
        </p>
      </div>
    </div>
  </footer>
</template>

<style>
@import 'tailwindcss';
</style>
