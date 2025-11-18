import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { v4 as uuidv4 } from 'uuid'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
const PORT = 3001
const frontendUrl = 'http://localhost:5173'

// In-memory store for API keys and session data
const apiKeysStore = {} // { sessionId: apiKey, expiresAt: timestamp }
const sessionTokenMap = {} // { sessionToken: sessionId }

app.use(
  cors({
    origin: frontendUrl,
    credentials: true, // Allow cookies to be sent
  }),
)

// Middleware
app.use(bodyParser.json())
app.use(cookieParser())

// Middleware to authenticate requests using the session token
function authenticateToken(req, res, next) {
  const sessionToken = req.cookies.session_token
  if (!sessionToken) {
    console.log('No session token found in cookies.')
    return res.status(401).json({ error: 'Unauthorized: No session token provided.' })
  }

  const sessionId = sessionTokenMap[sessionToken]
  const sessionData = apiKeysStore[sessionId]

  if (!sessionId || !sessionData || sessionData.expiresAt < Date.now()) {
    console.log(`Invalid or expired session token: ${sessionToken}`)
    // Clear expired/invalid cookie
    res.clearCookie('session_token')
    // Clean up backend store if session expired
    if (sessionId && sessionData) {
      delete apiKeysStore[sessionId]
      delete sessionTokenMap[sessionToken]
    }
    return res
      .status(401)
      .json({ error: 'Unauthorized: Session expired or invalid. Please re-enter your API key.' })
  }

  req.apiKey = sessionData.apiKey // Attach API key to request
  next()
}

// Endpoint to store the API key and issue a session token
app.post('/api/store-key', (req, res) => {
  const { apiKey } = req.body
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required.' })
  }

  const sessionId = uuidv4()
  const sessionToken = uuidv4()
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now

  apiKeysStore[sessionId] = { apiKey, expiresAt }
  sessionTokenMap[sessionToken] = sessionId

  res.cookie('session_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })

  console.log(`API Key stored for session ${sessionId}. Token issued.`)
  res.status(200).json({ message: 'Session established successfully.' })
})

// Endpoint to analyze code using the stored API key
app.post('/api/analyze-code', authenticateToken, async (req, res) => {
  const { code, framework } = req.body
  const apiKey = req.apiKey

  if (!code || !framework) {
    return res.status(400).json({ error: 'Code content and framework are required for analysis.' })
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

    res.status(200).json(result)
  } catch (error) {
    console.error('Error calling Google AI:', error)
    res
      .status(500)
      .json({ error: 'Failed to get analysis from AI service.', details: error.message })
  }
})

// Endpoint to check if the current session is active
app.get('/api/check-session', authenticateToken, (req, res) => {
  // If the authenticateToken middleware calls next(), it means the session is valid.
  // We can just send a success response.
  res.status(200).json({ message: 'Session is active.' })
})

// Endpoint to clear the session
app.post('/api/clear-session', (req, res) => {
  const sessionToken = req.cookies.session_token

  if (sessionToken) {
    const sessionId = sessionTokenMap[sessionToken]
    // Clean up the stores if the session exists
    if (sessionId) {
      delete apiKeysStore[sessionId]
    }
    delete sessionTokenMap[sessionToken]
  }

  res.clearCookie('session_token')
  res.status(200).json({ message: 'Session cleared successfully.' })
})

// Cleanup for expired sessions
setInterval(
  () => {
    const now = Date.now()
    for (const sessionId in apiKeysStore) {
      if (apiKeysStore[sessionId].expiresAt < now) {
        console.log(`Cleaning up expired session: ${sessionId}`)
        delete apiKeysStore[sessionId]
        // Find and remove from sessionTokenMap
        for (const token in sessionTokenMap) {
          if (sessionTokenMap[token] === sessionId) {
            delete sessionTokenMap[token]
            break
          }
        }
      }
    }
  },
  5 * 60 * 1000,
) // Run every 5 minutes to clean up expired sessions

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`)
  console.log(`Frontend URL for CORS: ${frontendUrl}`)
})
