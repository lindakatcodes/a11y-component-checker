import cookie from 'cookie'
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const sessionCookie = cookie.serialize('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    expires: new Date(0), // Expire the cookie immediately
    path: '/',
  })

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': sessionCookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'Session cleared successfully.' }),
  }
}
