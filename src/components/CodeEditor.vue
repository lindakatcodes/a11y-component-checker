<script setup lang="ts">
import { EXAMPLES } from '@/assets/examples'
import type { Categories, Issue } from '@/types'
import { angular } from '@codemirror/lang-angular'
import { javascript } from '@codemirror/lang-javascript'
import { vue } from '@codemirror/lang-vue'
import type { Extension } from '@codemirror/state'
import { computed, onMounted, reactive, ref } from 'vue'
import { Codemirror } from 'vue-codemirror'
import IssueBlock from './IssueBlock.vue'

const apiKeyInput = ref('')
const code = ref(EXAMPLES.vue)
const copied = ref(false)
const errorMessage = ref<string | null>(null)
const fixedCode = ref('')
const isAnalyzing = ref(false)
const issues = ref<Array<Issue>>([])
const selectedFramework = ref('vue')
const sessionActive = ref(false)

// sets up a map of the possible languages available, with a string for quick access, a name and icon for UI viewing, and a mode and langFunc for codemirror
const languageMap = reactive(
  new Map<string, { name: string; icon: string; mode: string; langFunc: () => unknown }>([
    ['vue', { name: 'Vue', icon: '💚', mode: 'vue', langFunc: vue }],
    ['react', { name: 'React', icon: '⚛️', mode: 'jsx', langFunc: javascript }],
    ['angular', { name: 'Angular', icon: '🅰️', mode: 'angular', langFunc: angular }],
  ]),
)

const extensions = computed<Extension[]>(() => {
  const framework = languageMap.get(selectedFramework.value)
  return framework ? [framework.langFunc() as Extension] : []
})

const categories: Categories = {
  semantic: { label: 'Semantic HTML', icon: '🏗️' },
  contrast: { label: 'Color Contrast', icon: '🎨' },
  keyboard: { label: 'Keyboard Navigation', icon: '⌨️' },
  screenReader: { label: 'Screen Reader', icon: '👂' },
}

// Created an HttpError class and type guard to help with api call type safety
class HttpError extends Error {
  response: { status: number; data: { error?: string } }
  constructor(message: string, status: number, data: { error?: string } = {}) {
    super(message)
    this.name = 'HttpError'
    this.response = { status, data }
  }
}

function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}

function selectFramework(frameworkId: string) {
  selectedFramework.value = frameworkId
  code.value = EXAMPLES[frameworkId as keyof typeof EXAMPLES]
  issues.value = []
  fixedCode.value = ''
}

function copyFixedCode() {
  navigator.clipboard.writeText(fixedCode.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

async function checkSessionStatus() {
  errorMessage.value = null
  try {
    const response = await fetch('/.netlify/functions/check-session', {
      credentials: 'include',
    })
    // if this call succeeds, the session is active
    if (response.status === 200) {
      sessionActive.value = true
    }
  } catch (error: unknown) {
    sessionActive.value = false
    errorMessage.value = 'Could not verify session. Please enter your API key.'
  }
}

onMounted(() => {
  checkSessionStatus()
})

async function startSession() {
  errorMessage.value = null
  isAnalyzing.value = true
  try {
    const response = await fetch('/.netlify/functions/store-key', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKeyInput.value }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new HttpError('Failed to start session', response.status, errorData)
    }

    // No errors here means the key was stored successfully, so we make sure to remove the api key from the frontend and can hide the api key input field
    sessionActive.value = true
    apiKeyInput.value = ''
    console.log('Session started successfully!')
  } catch (error: unknown) {
    let message = 'Failed to start session. Please check your API key and network.'
    if (isHttpError(error) && error.response.data.error) {
      message = error.response.data.error
    }
    errorMessage.value = message
    sessionActive.value = false
  } finally {
    isAnalyzing.value = false
  }
}

/**
 * Sorts an array of accessibility issues in-place.
 * 1. By line number (ascending, with 0 at the end).
 * 2. By severity (critical, warning, suggestion).
 * @param issuesToSort The array of Issue objects to sort.
 */
function sortIssues(issuesToSort: Issue[]): void {
  // Define the order of severity for sorting
  const severityOrder: { [key: string]: number } = {
    critical: 1,
    warning: 2,
    suggestion: 3,
  }

  issuesToSort.sort((a, b) => {
    // --- 1. Primary Sort: Line Number ---
    const lineA = a.lineNumber
    const lineB = b.lineNumber

    // Rule: lineNumber 0 should always be at the end.
    if (lineA === 0 && lineB !== 0) return 1
    if (lineB === 0 && lineA !== 0) return -1

    if (lineA !== lineB) return lineA - lineB

    // --- 2. Secondary Sort: Severity (only if line numbers are the same) ---
    const severityA = severityOrder[a.severity] || 99
    const severityB = severityOrder[b.severity] || 99
    return severityA - severityB
  })
}

async function analyzeComponent() {
  errorMessage.value = null
  // the site should be set up so you can't use this function unless your session is already active, but it's smart to check and exit early just in case
  if (!sessionActive.value) {
    errorMessage.value = 'Please start a session with your API key first.'
    return
  }
  isAnalyzing.value = true
  issues.value = []
  fixedCode.value = ''

  const framework = languageMap.get(selectedFramework.value)
  try {
    const response = await fetch('/.netlify/functions/analyze-code', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.value, framework }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new HttpError('Analysis failed', response.status, errorData)
    }

    const result = await response.json()

    const receivedIssues = result.issues || []
    sortIssues(receivedIssues)
    issues.value = receivedIssues
    fixedCode.value = result.fixedCode || ''
  } catch (error: unknown) {
    console.error('Analysis error:', error)
    let message = 'Failed to analyze component. Please check your API key and try again.'

    if (isHttpError(error) && error.response.data.error) {
      message = error.response.data.error
    }

    if (isHttpError(error) && error.response.status === 401) {
      sessionActive.value = false
      message += ' Please re-enter your API key to restart the session.'
    }

    errorMessage.value = message
    issues.value = [
      {
        category: 'semantic',
        severity: 'critical',
        title: 'Analysis Error',
        description: message || 'Failed to analyze component.',
        lineNumber: 0,
        fix: 'Verify your Gemini API key is correct and session is active',
      },
    ]
  } finally {
    isAnalyzing.value = false
  }
}

async function clearLocalSession() {
  sessionActive.value = false
  apiKeyInput.value = ''
  issues.value = []
  fixedCode.value = ''
  errorMessage.value = 'Session cleared. Please re-enter your API key.'
  await fetch('/.netlify/functions/clear-session', {
    method: 'POST',
    credentials: 'include',
  })
}
</script>

<template>
  <div v-if="!sessionActive" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
      v-model="apiKeyInput"
      @keyup.enter="startSession"
    />
    <button
      @click="startSession"
      data-test="start-session-button"
      :disabled="isAnalyzing || !apiKeyInput.trim()"
      class="mt-3 px-4 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <span v-if="isAnalyzing">Establishing Session...</span>
      <span v-else>Start New Session</span>
    </button>
    <p v-if="errorMessage" class="mt-3 text-red-700">{{ errorMessage }}</p>
  </div>
  <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left column -->
    <div class="space-y-4">
      <!-- Framework Selector -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 class="block text-md font-medium text-gray-700 mb-3">Select Framework</h2>
        <div class="flex gap-2">
          <button
            v-for="fw in Array.from(languageMap.keys())"
            :key="fw"
            @click="selectFramework(fw)"
            :class="[
              'flex-1 md:px-4 py-2 rounded-md text-sm font-medium transition-colors',
              selectedFramework === fw
                ? 'bg-sky-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
            type="button"
          >
            {{ languageMap.get(fw)?.icon }} {{ languageMap.get(fw)?.name }}
          </button>
        </div>
      </div>

      <!-- Code to analyze -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-3 bg-gray-800 flex justify-between items-center">
          <h3 class="text-white font-semibold basis-1/2">
            {{ languageMap.get(selectedFramework)?.name }} Component
          </h3>
          <div class="flex items-center gap-2">
            <button
              @click="analyzeComponent"
              :disabled="isAnalyzing || !sessionActive"
              class="px-2 md:px-4 py-2 bg-sky-700 text-white rounded-md text-sm font-medium hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              type="button"
            >
              <span v-if="isAnalyzing">⏳ Analyzing...</span>
              <span v-else>Analyze Accessibility</span>
            </button>
            <button
              v-if="sessionActive"
              @click="clearLocalSession"
              data-test="clear-session-button"
              class="px-2 md:px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              type="button"
            >
              <span>Clear Session</span>
            </button>
          </div>
        </div>
        <codemirror
          v-model="code"
          ref="editorElement"
          class="w-full h-96"
          :extensions="extensions"
          :tab-size="2"
        />
      </div>

      <!-- Fixed code view -->
      <div v-if="fixedCode" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold text-gray-900">Fixed Code</h3>
          <button
            @click="copyFixedCode"
            class="px-3 py-1.5 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 flex items-center gap-2"
            type="button"
          >
            <span v-if="copied">✓ Copied!</span>
            <span v-else>📋 Copy Code</span>
          </button>
        </div>
        <codemirror
          v-model="fixedCode"
          ref="fixedEditorElement"
          class="w-full h-96"
          :extensions="extensions"
          :tab-size="2"
        />
      </div>
    </div>

    <!-- Right column -->
    <div class="space-y-4">
      <!-- Issues Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 class="font-semibold text-gray-900 mb-4">
          Accessibility Issues <span v-if="issues.length > 0">({{ issues.length }})</span>
        </h3>

        <div v-if="issues.length === 0 && !isAnalyzing" class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">✓</div>
          <p>Click "Analyze Accessibility" to check for issues</p>
        </div>

        <div v-if="isAnalyzing" class="text-center py-8">
          <div class="text-4xl mb-2">⏳</div>
          <p class="text-gray-600">Analyzing component...</p>
        </div>

        <p v-if="errorMessage && !isAnalyzing" class="error-message text-red-700 text-center py-4">
          {{ errorMessage }}
        </p>

        <div class="space-y-3">
          <IssueBlock
            v-for="(issue, idx) in issues"
            :key="idx"
            :issue="issue"
            :categories="categories"
          />
        </div>
      </div>

      <!-- Legend -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 class="font-semibold text-gray-900 mb-3">Categories</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div v-for="(val, key) in categories" :key="key" class="flex items-center gap-2">
            <span>{{ val.icon }}</span>
            <span class="text-gray-700">{{ val.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
