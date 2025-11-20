import { describe, test, expect } from 'vitest'
import { handler } from '../functions/clear-session.js'

describe('clear-session handler', () => {
  test('should return 200 and an expired cookie on success', async () => {
    const event = {
      httpMethod: 'POST',
    }

    const response = await handler(event)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Session cleared successfully.')

    // Check that the cookie is being expired
    const cookieHeader = response.headers['Set-Cookie']
    expect(cookieHeader).toContain('session_token=;')
    expect(cookieHeader).toContain('Expires=Thu, 01 Jan 1970')
  })

  test('should return 405 for non-POST requests', async () => {
    const event = { httpMethod: 'GET' }
    const response = await handler(event)
    expect(response.statusCode).toBe(405)
  })
})
