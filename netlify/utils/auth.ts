import crypto from 'crypto'

const IV_LENGTH = 16 // For AES-256-CBC

const encrypt = (text: string): string => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set.')
  }
  // Use a sha256 hash of the key to ensure it is 32 bytes
  const hashedKey = crypto
    .createHash('sha256')
    .update(String(key))
    .digest('base64')
    .substring(0, 32)

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', hashedKey, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

const decrypt = (text: string): string => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set.')
  }
  // Use a sha256 hash of the key to ensure it is 32 bytes
  const hashedKey = crypto
    .createHash('sha256')
    .update(String(key))
    .digest('base64')
    .substring(0, 32)

  const textParts = text.split(':')
  if (textParts.length < 2) {
    throw new Error('Invalid encrypted text format.')
  }
  const iv = Buffer.from(textParts.shift(), 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', hashedKey, iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export { encrypt, decrypt }
