// types.ts
export interface Issue {
  category: 'semantic' | 'contrast' | 'keyboard' | 'screenReader'
  severity: 'critical' | 'warning' | 'suggestion'
  title: string
  description: string
  lineNumber: number
  fix: string
}

export interface AppInstance {
  apiKey: string
  code: string
  issues: Issue[]
  fixedCode: string
  isAnalyzing: boolean
  selectedFramework: 'vue' | 'react' | 'angular'
  analyzeComponent: () => Promise<void>
  selectFramework: (framework: string) => void
  copyFixedCode: () => void
}

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}
