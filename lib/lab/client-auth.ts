/**
 * Auth cliente (Layer 5) — SERVER ONLY. Hash password con pbkdf2 nativo (no deps).
 * Sessioni token in DB (hash SHA256). Lock dopo 5 tentativi falliti.
 */

import 'server-only'
import { pbkdf2Sync, randomBytes, createHash, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export type ClientRole = 'owner' | 'staff'
export interface ClientUser {
  id: string
  project_id: string
  email: string
  full_name?: string
  role: ClientRole
  onboarding_completed?: boolean
  last_login_at?: string
  notify_new_messages?: boolean
  notify_billing?: boolean
}

const PBKDF2_ROUNDS = 100_000
const DAY_MS = 86_400_000

function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex')
  const hash = pbkdf2Sync(password, salt, PBKDF2_ROUNDS, 64, 'sha256').toString('hex')
  return `${salt}:${hash}`
}
function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const test = pbkdf2Sync(password, salt, PBKDF2_ROUNDS, 64, 'sha256').toString('hex')
  const a = Buffer.from(test, 'hex'); const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}
function sha256(s: string): string { return createHash('sha256').update(s).digest('hex') }

export async function createClientUser(input: { projectId: string; email: string; password: string; fullName?: string; role?: ClientRole }): Promise<{ ok: boolean; userId?: string; error?: string }> {
  try {
    const admin = createAdminClient()
    const password_hash = hashPassword(input.password)
    const { data, error } = await admin.from('lab_client_users').insert({
      project_id: input.projectId, email: input.email.toLowerCase().trim(), password_hash,
      full_name: input.fullName || null, role: input.role || 'owner',
    }).select('id').single()
    if (error || !data) return { ok: false, error: error?.message || 'Errore creazione utente.' }
    return { ok: true, userId: data.id }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function loginClient(email: string, password: string, rememberMe?: boolean, ipAddress?: string, userAgent?: string): Promise<{ ok: boolean; sessionToken?: string; expiresAt?: string; user?: ClientUser; error?: string }> {
  try {
    const admin = createAdminClient()
    const { data: user } = await admin.from('lab_client_users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle()
    if (!user) return { ok: false, error: 'Credenziali non valide.' }
    if (user.locked_until && new Date(user.locked_until) > new Date()) return { ok: false, error: 'Account bloccato temporaneamente. Riprova tra qualche minuto.' }

    if (!verifyPassword(password, user.password_hash)) {
      const attempts = (user.failed_login_attempts || 0) + 1
      const patch: any = { failed_login_attempts: attempts }
      if (attempts >= 5) patch.locked_until = new Date(Date.now() + 15 * 60_000).toISOString()
      await admin.from('lab_client_users').update(patch).eq('id', user.id)
      return { ok: false, error: 'Credenziali non valide.' }
    }

    const token = randomBytes(32).toString('hex')
    const days = rememberMe ? 30 : 7
    const expiresAt = new Date(Date.now() + days * DAY_MS).toISOString()
    await admin.from('lab_client_sessions').insert({ user_id: user.id, token_hash: sha256(token), expires_at: expiresAt, ip_address: ipAddress || null, user_agent: userAgent || null })
    await admin.from('lab_client_users').update({ failed_login_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() }).eq('id', user.id)

    return { ok: true, sessionToken: token, expiresAt, user: { id: user.id, project_id: user.project_id, email: user.email, full_name: user.full_name, role: user.role, onboarding_completed: user.onboarding_completed } }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function verifyClientSession(token: string): Promise<{ valid: boolean; user?: ClientUser; project?: any }> {
  try {
    const admin = createAdminClient()
    const { data: sess } = await admin.from('lab_client_sessions').select('*').eq('token_hash', sha256(token)).maybeSingle()
    if (!sess || new Date(sess.expires_at) < new Date()) return { valid: false }
    const { data: user } = await admin.from('lab_client_users').select('*').eq('id', sess.user_id).maybeSingle()
    if (!user) return { valid: false }
    const { data: project } = await admin.from('lab_projects').select('*').eq('id', user.project_id).maybeSingle()
    return { valid: true, user: user as ClientUser, project }
  } catch { return { valid: false } }
}

export async function logoutClient(token: string): Promise<void> {
  try { const admin = createAdminClient(); await admin.from('lab_client_sessions').delete().eq('token_hash', sha256(token)) } catch { /* noop */ }
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; resetToken?: string; expiresAt?: string }> {
  try {
    const admin = createAdminClient()
    const { data: user } = await admin.from('lab_client_users').select('id').eq('email', email.toLowerCase().trim()).maybeSingle()
    if (!user) return { ok: true } // non rivelare esistenza
    const resetToken = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString()
    await admin.from('lab_client_users').update({ password_reset_token: sha256(resetToken), password_reset_expires: expiresAt }).eq('id', user.id)
    return { ok: true, resetToken, expiresAt }
  } catch { return { ok: false } }
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const { data: user } = await admin.from('lab_client_users').select('*').eq('password_reset_token', sha256(resetToken)).maybeSingle()
    if (!user || !user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) return { ok: false, error: 'Token non valido o scaduto.' }
    await admin.from('lab_client_users').update({ password_hash: hashPassword(newPassword), password_reset_token: null, password_reset_expires: null, failed_login_attempts: 0, locked_until: null }).eq('id', user.id)
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function updateClientPassword(userId: string, oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const { data: user } = await admin.from('lab_client_users').select('*').eq('id', userId).maybeSingle()
    if (!user || !verifyPassword(oldPassword, user.password_hash)) return { ok: false, error: 'Password attuale non corretta.' }
    await admin.from('lab_client_users').update({ password_hash: hashPassword(newPassword), updated_at: new Date().toISOString() }).eq('id', userId)
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

/** Reset password lato admin Lumino (imposta direttamente un nuovo hash). */
export async function setClientPassword(userId: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    await admin.from('lab_client_users').update({ password_hash: hashPassword(newPassword), password_reset_token: null, password_reset_expires: null, failed_login_attempts: 0, locked_until: null, updated_at: new Date().toISOString() }).eq('id', userId)
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

/** Genera una password temporanea robusta (per createClientAccessForProject). */
export function generateTempPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*?'
  const bytes = randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length]
  return out
}
