import cookie from 'cookie'
import { decrypt } from '../utils/auth'
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!event.headers.cookie) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Session is not active.' }),
    }
  }

  const cookies = cookie.parse(event.headers.cookie)
  const encryptedApiKey = cookies.session_token

  if (!encryptedApiKey) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Session is not active.' }),
    }
  }

  try {
    // Attempt to decrypt to validate the key
    decrypt(encryptedApiKey)
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Session is active.' }),
    }
  } catch (error) {
    console.error('Error validating session token:', error)
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Session is not active or invalid.' }),
    }
  }
}
