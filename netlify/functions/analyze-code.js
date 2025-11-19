import { GoogleGenerativeAI } from '@google/generative-ai'
import cookie from 'cookie'
import { decrypt } from '../utils/auth.js'

// Helper function to get API key from cookie
const getApiKeyFromCookie = (event) => {
  if (!event.headers.cookie) {
    return null
  }
  const cookies = cookie.parse(event.headers.cookie)
  const encryptedApiKey = cookies.session_token
  if (!encryptedApiKey) {
    return null
  }
  try {
    return decrypt(encryptedApiKey)
  } catch (error) {
    console.error('Error decrypting API key:', error)
    return null
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = getApiKeyFromCookie(event)

  if (!apiKey) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'Unauthorized: No valid API key found. Please re-enter your API key.',
      }),
    }
  }

  const { code, framework } = JSON.parse(event.body)

  if (!code || !framework) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Code content and framework are required for analysis.' }),
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const prompt = `You are an accessibility expert. Analyze this ${framework.name} component for accessibility issues in these categories:
      1. Semantic HTML (use proper elements like button, nav, header, etc.)
      2. Color Contrast (WCAG AA requires 4.5:1 for normal text, 3:1 for large text)
      3. Keyboard Navigation (tab order, focus management, keyboard shortcuts)
      4. Screen Reader (ARIA labels, roles, alt text, sr-only content)
      ${framework.name} component code:
      \`\`\`${framework.mode}
      ${code}
      \`\`\`
      Respond with ONLY a JSON object (no markdown, no preamble) with this structure:
      {
        "issues": [
          {
            "category": "semantic" | "contrast" | "keyboard" | "screenReader",
            "severity": "critical" | "warning" | "suggestion",
            "title": "Brief issue title",
            "description": "Detailed explanation",
            "lineNumber": 5,
            "fix": "How to fix it"
          }
        ],
        "fixedCode": "Complete corrected ${framework.name} component code"
      }`

    const initResult = await model.generateContent(prompt)
    const response = await initResult.response
    const text = response.text()
    let jsonText = text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const result = JSON.parse(jsonText)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error('Error calling Google AI:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to get analysis from AI service.',
        details: error.message,
      }),
    }
  }
}
