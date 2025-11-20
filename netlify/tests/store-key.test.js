import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { handler } from '../functions/store-key.js'
import { encrypt } from '../utils/auth.js'

// Mock the auth utility
vi.mock('../utils/auth.js')

describe('store-key handler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should return 200 and set a cookie on success', async () => {
    const apiKey = 'test-api-key'
    const encryptedKey = 'encrypted-key'
    vi.mocked(encrypt).mockReturnValue(encryptedKey)

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ apiKey }),
    }

    const response = await handler(event)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Session established successfully.')
    expect(response.headers['Set-Cookie']).toContain(`session_token=${encryptedKey}`)
    expect(encrypt).toHaveBeenCalledWith(apiKey)
  })

  test('should return 400 if API key is missing', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({}),
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe('API key is required.')
  })

  test('should return 405 for non-POST requests', async () => {
    const event = { httpMethod: 'GET' }
    const response = await handler(event)
    expect(response.statusCode).toBe(405)
    expect(response.body).toBe('Method Not Allowed')
  })

  test('should return 500 if encryption fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errorMessage = 'Encryption failed'
    vi.mocked(encrypt).mockImplementation(() => {
      throw new Error(errorMessage)
    })

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ apiKey: 'any-key' }),
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body).error).toBe('Failed to establish session.')
    expect(consoleSpy).toHaveBeenCalled()
  })
})
