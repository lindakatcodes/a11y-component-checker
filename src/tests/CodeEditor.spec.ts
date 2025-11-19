// src/tests/CodeEditor.spec.ts
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Issue } from '@/types'
import CodeEditor from '../components/CodeEditor.vue'

type CodeEditorInstance = InstanceType<typeof CodeEditor>

// Helper function to mock the global fetch API for backend responses
function mockFetchResponse(
  url: string,
  options: RequestInit | undefined,
  mockData: {
    issues?: Issue[]
    fixedCode?: string
    error?: string
    message?: string
  },
  status: number = 200,
): Response {
  return {
    status: status,
    json: () => Promise.resolve(mockData),
    ok: status >= 200 && status < 300,
  } as Response
}

// Mock the browser API that CodeMirror needs but is missing in JSDOM.
if (typeof Range.prototype.getClientRects === 'undefined') {
  Range.prototype.getClientRects = () => ({ length: 0 }) as DOMRectList
  Range.prototype.getBoundingClientRect = () => ({}) as DOMRect
}

describe('CodeEditor Component', () => {
  let wrapper: VueWrapper<CodeEditorInstance>
  let fetchSpy: Mock

  // Helper to simulate API key input and session start
  async function simulateSessionStart(apiKey: string = 'test-key') {
    await wrapper.vm.$nextTick()
    await wrapper.find('input[type="password"]').setValue(apiKey)
    await wrapper.find('[data-test="start-session-button"]').trigger('click')
    await wrapper.vm.$nextTick()
  }

  beforeEach(() => {
    // Clear all previous mocks
    vi.unstubAllGlobals()
    wrapper = mount(CodeEditor)
  })

  describe('Session Management', () => {
    beforeEach(() => {
      // Clear mock history before each test to ensure isolation
      if (fetchSpy) fetchSpy.mockClear()

      // for these tests, we start with no session so we can check the processes
      fetchSpy = vi.fn((url, options) => {
        if (url.includes('/check-session')) {
          return Promise.resolve(
            mockFetchResponse(url, options, { message: 'Session is not active.' }, 401),
          )
        }
        // Default for other unhandled fetches
        return Promise.resolve(
          mockFetchResponse(url, options, { message: 'Unhandled default mock' }, 200),
        )
      })
      vi.stubGlobal('fetch', fetchSpy)

      wrapper = mount(CodeEditor)
    })

    it('should show API key input when session is not active on mount', async () => {
      // the initial state - we just want to make sure what we expect to show on a first visit and/or when signed out is set correctly
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.vm.sessionActive).toBe(false)
      expect(wrapper.vm.apiKeyInput).toBe('')
    })

    it('should start a session with a valid API key', async () => {
      fetchSpy.mockImplementationOnce((url, options) => {
        if (url.includes('/store-key')) {
          return Promise.resolve(
            mockFetchResponse(url, options, { message: 'Session established successfully.' }, 200),
          )
        }
        return Promise.reject(new Error(`Expected call to /store-key, but got ${url}`))
      })
      await simulateSessionStart('test-key')

      // Verify the correct API endpoint was called.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/store-key'),
        expect.any(Object),
      )

      // Verify the component's state and UI updated correctly.
      expect(wrapper.vm.sessionActive).toBe(true)
      expect(wrapper.vm.apiKeyInput).toBe('')
      expect(wrapper.vm.errorMessage).toBeNull()
      expect(wrapper.find('input[type="password"]').exists()).toBe(false)
    })

    it('should keep the start session button disabled if the API key is empty', async () => {
      await simulateSessionStart('')

      // Assert that no API call was made because the button should be disabled
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('/store-key'),
        expect.any(Object),
      )

      // Find the button and check its disabled attribute
      const startButton = wrapper.find('[data-test="start-session-button"]')
      expect(startButton.attributes('disabled')).toBeDefined()
      expect(wrapper.vm.sessionActive).toBe(false)
    })

    it('should clear the session', async () => {
      await simulateSessionStart('test-key')

      fetchSpy.mockImplementationOnce((url, options) => {
        if (url.includes('/clear-session')) {
          return Promise.resolve(
            mockFetchResponse(url, options, { message: 'Session cleared successfully.' }, 200),
          )
        }
        return Promise.reject(new Error(`Expected call to /clear-session, but got ${url}`))
      })

      await wrapper.find('[data-test="clear-session-button"]').trigger('click')

      expect(wrapper.vm.sessionActive).toBe(false)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.vm.errorMessage).toBe('Session cleared. Please re-enter your API key.')
    })
  })

  describe('Framework Switching', () => {
    beforeEach(async () => {
      await simulateSessionStart('framework-test-key')
    })

    it('should update code and editor mode when switching to React', async () => {
      const initCode = wrapper.vm.code
      await wrapper
        .findAll('button')
        .find((button) => button.text().includes('React'))
        .trigger('click')
      expect(wrapper.vm.selectedFramework).toBe('react')
      expect(wrapper.vm.code).not.toBe(initCode)
      expect(wrapper.vm.code).toContain('className')
    })

    it('should update code and editor mode when switching to Angular', async () => {
      const initCode = wrapper.vm.code
      await wrapper
        .findAll('button')
        .find((button) => button.text().includes('Angular'))
        .trigger('click')
      expect(wrapper.vm.selectedFramework).toBe('angular')
      expect(wrapper.vm.code).not.toBe(initCode)
      expect(wrapper.vm.code).toContain('@Component')
    })

    it('should clear issues and fixed code when switching frameworks', async () => {
      wrapper.vm.issues = [
        {
          category: 'semantic',
          severity: 'suggestion',
          title: 'Semantic HTML',
          description: 'This is more important than you might think!',
          lineNumber: 1,
          fix: 'You should keep this in mind while building',
        },
      ]
      wrapper.vm.fixedCode = '<p>hello from the other side</p>'
      await wrapper
        .findAll('button')
        .find((button) => button.text().includes('React'))
        .trigger('click')
      expect(wrapper.vm.issues).toEqual([])
      expect(wrapper.vm.fixedCode).toBe('')
    })
  })

  // --- AI Response Parsing Tests ---
  describe('AI Response Parsing', () => {
    beforeEach(async () => {
      if (fetchSpy) fetchSpy.mockClear()
      fetchSpy = vi.fn((url, options) => {
        // Default for unhandled fetches
        return Promise.resolve(
          mockFetchResponse(url, options, { message: 'Unhandled default mock' }, 200),
        )
      })
      vi.stubGlobal('fetch', fetchSpy)
      await simulateSessionStart('ai-response-test-key')
    })

    it('should parse valid JSON response from backend analysis', async () => {
      const mockIssues = [
        {
          category: 'semantic',
          severity: 'suggestion',
          title: 'Semantic HTML',
          description: 'This is more important than you might think!',
          lineNumber: 1,
          fix: 'You should keep this in mind while building',
        },
      ]
      const mockFixedCode = '<p>hello from the other side</p>'

      // mock what we expect to get back from the server
      fetchSpy.mockImplementationOnce((url, options) => {
        if (url.includes('/analyze-code')) {
          return Promise.resolve(
            mockFetchResponse(url, options, {
              issues: mockIssues,
              fixedCode: mockFixedCode,
            }),
            200,
          )
        }
        return Promise.reject(new Error(`Expected call to /analyze-code, but got ${url}`))
      })

      // actually trigger the analysis call
      await wrapper
        .findAll('button')
        .find((button) => button.text().includes('Analyze Accessibility'))
        .trigger('click')

      // then test what we get back
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/analyze-code'),
        expect.any(Object),
      )
      expect(wrapper.vm.issues).toEqual(mockIssues)
      expect(wrapper.vm.fixedCode).toBe(mockFixedCode)
      expect(wrapper.vm.isAnalyzing).toBe(false)
      expect(wrapper.vm.errorMessage).toBeNull()
    })

    it('should handle backend error responses gracefully (e.g., 500)', async () => {
      const mockErrorIssue = [
        {
          category: 'semantic',
          severity: 'critical',
          title: 'Analysis Error',
          description: 'Failed to analyze component. Please check your API key and try again.',
          lineNumber: 0,
          fix: 'Verify your Gemini API key is correct and session is active',
        },
      ]

      fetchSpy.mockImplementationOnce((url) => {
        if (url.includes('/analyze-code')) {
          const httpError = {
            name: 'HttpError',
            response: {
              status: 500,
              data: { error: 'Failed to get analysis from AI service.' },
            },
          }
          return Promise.reject(httpError)
        }
        return Promise.reject(new Error(`Expected call to /analyze-code, but got ${url}`))
      })

      await wrapper
        .findAll('button')
        .find((button) => button.text().includes('Analyze Accessibility'))
        .trigger('click')

      await wrapper.vm.$nextTick()

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/analyze-code'),
        expect.any(Object),
      )
      expect(wrapper.vm.issues).toEqual(mockErrorIssue)
      expect(wrapper.vm.fixedCode).toBe('')
      expect(wrapper.vm.isAnalyzing).toBe(false)
      expect(wrapper.vm.errorMessage).toBe(
        'Failed to analyze component. Please check your API key and try again.',
      )
    })

    it('should not be able to trigger an analysis if no session is active', async () => {
      // we clear the session first, so we go back to a non-verified state
      fetchSpy.mockImplementationOnce((url, options) => {
        if (url.includes('/clear-session')) {
          return Promise.resolve(
            mockFetchResponse(url, options, { message: 'Session cleared successfully.' }, 200),
          )
        }
        return Promise.reject(new Error(`Expected call to /clear-session, but got ${url}`))
      })

      await wrapper.find('[data-test="clear-session-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      // then check the analyze button to ensure it can't be clicked and is disabled
      const analyzeButton = wrapper
        .findAll('button')
        .find((button) => button.text().includes('Analyze Accessibility'))
      await analyzeButton.trigger('click')

      expect(fetchSpy).not.toHaveBeenCalledWith('/analyze-code')
      expect(analyzeButton.attributes('disabled')).toBeDefined()
    })
  })
})
