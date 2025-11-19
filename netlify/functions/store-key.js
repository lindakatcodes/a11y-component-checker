import { encrypt } from '../utils/auth.js'
import cookie from 'cookie'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { apiKey } = JSON.parse(event.body)

  if (!apiKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'API key is required.' }) }
  }

  try {
    const encryptedApiKey = encrypt(apiKey)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    const sessionCookie = cookie.serialize('session_token', encryptedApiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: maxAge / 1000, // maxAge is in seconds for cookies
      path: '/',
    })

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': sessionCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Session established successfully.' }),
    }
  } catch (error) {
    console.error('Error storing API key:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to establish session.', details: error.message }),
    }
  }
}
