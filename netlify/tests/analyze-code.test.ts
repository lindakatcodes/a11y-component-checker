import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { handler } from '../functions/analyze-code'
import { decrypt } from '../utils/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Mock dependencies
vi.mock('../utils/auth')
vi.mock('@google/generative-ai')

describe('analyze-code handler', () => {
  const mockCode = '<div>Hello</div>'
  const mockFramework = { name: 'React', mode: 'jsx' }
  const mockApiKey = 'decrypted-api-key'

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Mock successful decryption by default
    vi.mocked(decrypt).mockReturnValue(mockApiKey)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should return 200 with analysis on success', async () => {
    const mockAiResponse = { issues: [], fixedCode: '<div></div>' }
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockAiResponse),
      },
    })
    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    })
    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }))

    const event = {
      httpMethod: 'POST',
      headers: { cookie: 'session_token=encrypted-key' },
      body: JSON.stringify({ code: mockCode, framework: mockFramework }),
    }

    const response = await handler(event)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body).toEqual(mockAiResponse)
    expect(decrypt).toHaveBeenCalledWith('encrypted-key')
    expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey)
  })

  test('should return 401 if API key is not found in cookie', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(decrypt).mockImplementation(() => {
      throw new Error('Decryption failed')
    })

    const event = {
      httpMethod: 'POST',
      headers: { cookie: 'session_token=invalid-key' },
      body: JSON.stringify({ code: mockCode, framework: mockFramework }),
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body).error).toContain('No valid API key found')
    expect(consoleSpy).toHaveBeenCalled()
  })

  test('should return 400 if code or framework is missing', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { cookie: 'session_token=encrypted-key' },
      body: JSON.stringify({ code: mockCode }), // Missing framework
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe(
      'Code content and framework are required for analysis.',
    )
  })

  test('should return 500 if the AI service call fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => {
      throw new Error('AI service connection failed')
    })

    const event = {
      httpMethod: 'POST',
      headers: { cookie: 'session_token=encrypted-key' },
      body: JSON.stringify({ code: mockCode, framework: mockFramework }),
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body).error).toBe('Failed to get analysis from AI service.')
    expect(consoleSpy).toHaveBeenCalled()
  })
})
