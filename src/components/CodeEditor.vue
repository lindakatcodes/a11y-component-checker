<script setup lang="ts">
import { EXAMPLES } from '@/assets/examples'
import type { Issue } from '@/types'
import { angular } from '@codemirror/lang-angular'
import { javascript } from '@codemirror/lang-javascript'
import { vue } from '@codemirror/lang-vue'
import type { Extension } from '@codemirror/state'
import { GoogleGenAI } from '@google/genai'
import { computed, reactive, ref } from 'vue'
import { Codemirror } from 'vue-codemirror'
const selectedFramework = ref('vue')
const code = ref(EXAMPLES.vue)
const issues = ref<Array<Issue>>([])
const isAnalyzing = ref(false)
const fixedCode = ref('')
const copied = ref(false)
const showApiInput = ref(false)
const apiKey = ref('')

const ai = computed(() => {
  return new GoogleGenAI({ apiKey: apiKey.value })
})

// sets up a map of the possible languages available, with a string for quick access, a name and icon for UI viewing, and a mode and langFunc for codemirror to use
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

const categories = {
  semantic: { label: 'Semantic HTML', icon: '🏗️' },
  contrast: { label: 'Color Contrast', icon: '🎨' },
  keyboard: { label: 'Keyboard Navigation', icon: '⌨️' },
  screenReader: { label: 'Screen Reader', icon: '👂' },
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
      return 'text-red-600 bg-red-50 border-red-200'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200'
  }
}

async function analyzeComponent() {
  if (!apiKey.value.trim()) {
    showApiInput.value = true
    return
  }
  isAnalyzing.value = true
  issues.value = []
  fixedCode.value = ''

  const framework = languageMap.get(selectedFramework.value)
  try {
    const response = await ai.value.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `You are an accessibility expert. Analyze this ${framework?.name} component for accessibility issues in these categories:
      1. Semantic HTML (use proper elements like button, nav, header, etc.)
      2. Color Contrast (WCAG AA requires 4.5:1 for normal text, 3:1 for large text)
      3. Keyboard Navigation (tab order, focus management, keyboard shortcuts)
      4. Screen Reader (ARIA labels, roles, alt text, sr-only content)
      ${framework?.name} component code:
      \`\`\`${selectedFramework.value}
      ${code.value}
      \`\`\`
      Respond with ONLY a JSON object (no markdown, no preamble) with this structure:
      {
        "issues": [
          {
            "category": "semantic" | "contrast" | "keyboard" | "screenReader",
            "severity": "critical" | "warning" | "suggestion",
            "title": "Brief issue title",
            "description": "Detailed explanation",
            "lineNumber": 5,
            "fix": "How to fix it"
          }
        ],
        "fixedCode": "Complete corrected ${framework?.name} component code"
      }`,
    })

    // if (response.error) {
    //   throw new Error(data.error.message || 'API error')
    // }
    const text = response.text
    if (!text) throw new Error('No response from API')
    // Clean up JSON response
    let jsonText = text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const result = JSON.parse(jsonText)
    issues.value = result.issues || []
    fixedCode.value = result.fixedCode || ''
  } catch (error) {
    console.error('Analysis error:', error)
    issues.value = [
      {
        category: 'semantic',
        severity: 'critical',
        title: 'Analysis Error',
        description:
          error.message || 'Failed to analyze component. Please check your API key and try again.',
        lineNumber: 0,
        fix: 'Verify your Gemini API key is correct',
      },
    ]
  } finally {
    isAnalyzing.value = false
  }
}
</script>

<template>
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
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Editor Section -->
    <div class="space-y-4">
      <!-- Framework Selector -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label class="block text-sm font-medium text-gray-700 mb-3"> Select Framework </label>
        <div class="flex gap-2">
          <button
            v-for="fw in Array.from(languageMap.keys())"
            :key="fw"
            @click="selectFramework(fw)"
            :class="[
              'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              selectedFramework === fw
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            {{ languageMap.get(fw)?.icon }} {{ languageMap.get(fw)?.name }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-3 bg-gray-800 flex justify-between items-center">
          <span class="text-white text-sm font-medium">
            {{ languageMap.get(selectedFramework)?.name }} Component
          </span>
          <button
            @click="analyzeComponent"
            :disabled="isAnalyzing"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="isAnalyzing">⏳ Analyzing...</span>
            <span v-else>Analyze Accessibility</span>
          </button>
        </div>
        <codemirror
          v-model="code"
          ref="editorElement"
          class="w-full h-96"
          :extensions="extensions"
          :tab-size="2"
        />
      </div>

      <div v-if="fixedCode" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold text-gray-900">Fixed Code</h3>
          <button
            @click="copyFixedCode"
            class="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center gap-2"
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

    <!-- Issues Section -->
    <div class="space-y-4">
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

        <div class="space-y-3">
          <div
            v-for="(issue, idx) in issues"
            :key="idx"
            :class="['border rounded-lg p-4', getSeverityClass(issue.severity)]"
          >
            <div class="flex items-start gap-3">
              <span class="text-xl">{{ getSeverityIcon(issue.severity) }}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="text-xs font-semibold uppercase">
                    {{ issue.severity }}
                  </span>
                  <span class="text-xs">
                    {{ categories[issue.category]?.icon }} {{ categories[issue.category]?.label }}
                  </span>
                  <span v-if="issue.lineNumber > 0" class="text-xs">
                    Line {{ issue.lineNumber }}
                  </span>
                </div>
                <h4 class="font-semibold mb-1">{{ issue.title }}</h4>
                <p class="text-sm mb-2">{{ issue.description }}</p>
                <div class="text-sm font-medium">💡 Fix: {{ issue.fix }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 class="font-semibold text-gray-900 mb-3 text-sm">Categories</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div v-for="(val, key) in categories" :key="key" class="flex items-center gap-2">
            <span>{{ val.icon }}</span>
            <span class="text-gray-700">{{ val.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
