import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'

describe('auth utility', () => {
  const originalEnv = process.env
  const testKey = 'a_super_secret_key_that_is_long_enough'
  const testData = 'my-secret-api-key'

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: testKey,
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('should encrypt and then decrypt data back to the original', async () => {
    const { encrypt, decrypt } = await import('../utils/auth')
    const encrypted = encrypt(testData)
    expect(encrypted).not.toBe(testData)
    expect(encrypted.includes(':')).toBe(true)

    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(testData)
  })

  test('encrypt should throw an error if ENCRYPTION_KEY is not set', async () => {
    delete process.env.ENCRYPTION_KEY
    vi.resetModules() // Reset modules to force re-import
    const { encrypt } = await import('../utils/auth')
    expect(() => encrypt(testData)).toThrow('ENCRYPTION_KEY environment variable is not set.')
  })

  test('decrypt should throw an error if ENCRYPTION_KEY is not set', async () => {
    const { encrypt, decrypt } = await import('../utils/auth')
    const encrypted = encrypt(testData)
    delete process.env.ENCRYPTION_KEY
    vi.resetModules() // Reset modules to force re-import
    expect(() => decrypt(encrypted)).toThrow('ENCRYPTION_KEY environment variable is not set.')
  })
})
