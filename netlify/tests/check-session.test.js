import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { handler } from '../functions/check-session.js'
import { decrypt } from '../utils/auth.js'

// Mock the auth utility
vi.mock('../utils/auth.js')

describe('check-session handler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore any spies
    vi.restoreAllMocks()
  })

  test('should return 200 if session is active and valid', async () => {
    vi.mocked(decrypt).mockReturnValue('decrypted-key') // Simulate successful decryption

    const event = {
      httpMethod: 'GET',
      headers: {
        cookie: 'session_token=valid-encrypted-token',
      },
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).message).toBe('Session is active.')
    expect(decrypt).toHaveBeenCalledWith('valid-encrypted-token')
  })

  test('should return 401 if cookie is missing', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body).message).toBe('Session is not active.')
  })

  test('should return 401 if decryption fails', async () => {
    // Spy on console.error and provide a mock implementation to silence it
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(decrypt).mockImplementation(() => {
      throw new Error('Decryption failed')
    })

    const event = {
      httpMethod: 'GET',
      headers: {
        cookie: 'session_token=invalid-token',
      },
    }

    const response = await handler(event)
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body).message).toBe('Session is not active or invalid.')
    // Optional: Assert that the error was actually logged
    expect(consoleSpy).toHaveBeenCalled()
  })
})
