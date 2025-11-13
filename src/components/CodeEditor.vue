<script setup lang="ts">
import { EXAMPLES } from '@/assets/examples'
import type { Issue } from '@/types'
import { computed, ref, useTemplateRef } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { angular } from '@codemirror/lang-angular'
import { vue } from '@codemirror/lang-vue'
import { javascript } from '@codemirror/lang-javascript'

// frameworks, selectFramework, selectedFramework, analyzeComponent, isAnalyzing, fixedCode, copyFixedCode, copied, issues, getSeverityClass, getSeverityIcon,categories
const selectedFramework = ref('vue')
const code = ref(EXAMPLES.vue)
const issues: Array<Issue> = ref([])
const isAnalyzing = ref(false)
const fixedCode = ref('')
const copied = ref(false)
// const editorElement = useTemplateRef('editorElement')

const frameworks = [
  { id: 'vue', name: 'Vue', icon: '💚', mode: 'vue' },
  { id: 'react', name: 'React', icon: '⚛️', mode: 'jsx' },
  { id: 'angular', name: 'Angular', icon: '🅰️', mode: 'javascript' },
]

const categories = {
  semantic: { label: 'Semantic HTML', icon: '🏗️' },
  contrast: { label: 'Color Contrast', icon: '🎨' },
  keyboard: { label: 'Keyboard Navigation', icon: '⌨️' },
  screenReader: { label: 'Screen Reader', icon: '👂' },
}

const extensions = computed(() => {
  const result = []
  const framework = frameworks.find((f) => f.id === selectedFramework.value)
  // const langCodeMap = reactive(new Map<string, { code: string; language: () => any }>())
  // need to understand above line so i can grab the string of the lang and make it a callable function like vue(), since that's what needs to be pushed to result
  result.push(framework!.mode)

  return result
})

function selectFramework(frameworkId: string) {
  selectedFramework.value = frameworkId
  code.value = EXAMPLES[frameworkId]
  issues.value = []
  fixedCode.value = ''
  // initEditor()
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
  //           if (!this.apiKey.trim()) {
  //             this.showApiInput = true;
  //             return;
  //           }
  //           this.isAnalyzing = true;
  //           this.issues = [];
  //           this.fixedCode = '';
  //           const framework = this.frameworks.find(f => f.id === this.selectedFramework);
  //           try {
  //             const response = await fetch(
  //               'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + this.apiKey,
  //               {
  //                 method: 'POST',
  //                 headers: { 'Content-Type': 'application/json' },
  //                 body: JSON.stringify({
  //                   contents: [{
  //                     parts: [{
  //                       text: `You are an accessibility expert. Analyze this ${framework.name} component for accessibility issues in these categories:
  // 1. Semantic HTML (use proper elements like button, nav, header, etc.)
  // 2. Color Contrast (WCAG AA requires 4.5:1 for normal text, 3:1 for large text)
  // 3. Keyboard Navigation (tab order, focus management, keyboard shortcuts)
  // 4. Screen Reader (ARIA labels, roles, alt text, sr-only content)
  // ${framework.name} component code:
  // \`\`\`${this.selectedFramework}
  // ${this.code}
  // \`\`\`
  // Respond with ONLY a JSON object (no markdown, no preamble) with this structure:
  // {
  //   "issues": [
  //     {
  //       "category": "semantic" | "contrast" | "keyboard" | "screenReader",
  //       "severity": "critical" | "warning" | "suggestion",
  //       "title": "Brief issue title",
  //       "description": "Detailed explanation",
  //       "lineNumber": 5,
  //       "fix": "How to fix it"
  //     }
  //   ],
  //   "fixedCode": "Complete corrected ${framework.name} component code"
  // }`
  //                     }]
  //                   }]
  //                 })
  //               }
  //             );
  //             const data = await response.json();
  //             if (data.error) {
  //               throw new Error(data.error.message || 'API error');
  //             }
  //             const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  //             if (!text) throw new Error('No response from API');
  //             // Clean up JSON response
  //             let jsonText = text.trim();
  //             jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  //             const result = JSON.parse(jsonText);
  //             this.issues = result.issues || [];
  //             this.fixedCode = result.fixedCode || '';
  //           } catch (error) {
  //             console.error('Analysis error:', error);
  //             this.issues = [{
  //               category: 'semantic',
  //               severity: 'critical',
  //               title: 'Analysis Error',
  //               description: error.message || 'Failed to analyze component. Please check your API key and try again.',
  //               lineNumber: 0,
  //               fix: 'Verify your Gemini API key is correct'
  //             }];
  //           } finally {
  //             this.isAnalyzing = false;
  //           }
}

// onMounted(() => {
//   initEditor()
// })
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Editor Section -->
    <div class="space-y-4">
      <!-- Framework Selector -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label class="block text-sm font-medium text-gray-700 mb-3"> Select Framework </label>
        <div class="flex gap-2">
          <button
            v-for="fw in frameworks"
            :key="fw.id"
            @click="selectFramework(fw.id)"
            :class="[
              'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              selectedFramework === fw.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            {{ fw.icon }} {{ fw.name }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-3 bg-gray-800 flex justify-between items-center">
          <span class="text-white text-sm font-medium">
            {{ frameworks.find((f) => f.id === selectedFramework)?.name }} Component
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
        <pre
          class="bg-gray-50 p-3 rounded-md overflow-x-auto text-sm"
        ><code>{{ fixedCode }}</code></pre>
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
