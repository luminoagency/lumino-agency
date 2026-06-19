/**
 * AES-256-GCM helper per cifrare/decifrare le password SMTP in DB.
 *
 * La chiave deve essere 32 byte (256 bit). In .env:
 *   OUTREACH_SMTP_KEY=<base64 32 bytes>
 *
 * Per generarla una volta:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Formato stored: base64(iv || ciphertext || authTag)
 *   - iv = 12 byte
 *   - authTag = 16 byte
 *
 * Stesso formato del prompt: outreach_accounts.smtp_password_encrypted.
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer {
  const raw = process.env.OUTREACH_SMTP_KEY
  if (!raw) throw new Error('[crypto] OUTREACH_SMTP_KEY non configurata')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('[crypto] OUTREACH_SMTP_KEY deve essere 32 byte (base64 di 256 bit)')
  return key
}

export function encryptPassword(plain: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, enc, tag]).toString('base64')
}

export function decryptPassword(stored: string): string {
  const key = getKey()
  const buf = Buffer.from(stored, 'base64')
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(buf.length - TAG_LEN)
  const enc = buf.subarray(IV_LEN, buf.length - TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
