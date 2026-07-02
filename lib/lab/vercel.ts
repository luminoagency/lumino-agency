/**
 * Vercel deploy API (Layer 4) — SERVER ONLY. Solo fetch nativo, nessuna dipendenza.
 * Docs: https://vercel.com/docs/rest-api
 */

import 'server-only'
import { createHash } from 'crypto'

const VERCEL_API = 'https://api.vercel.com'

export interface VercelConfig {
  token: string
  teamId?: string
}

export interface DeploymentResult {
  ok: boolean
  url?: string
  deploymentId?: string
  projectId?: string
  error?: string
}

export type DeployFile = { path: string; content: string | Buffer; encoding?: 'utf-8' | 'base64' }

function authHeaders(config: VercelConfig): Record<string, string> {
  return { Authorization: `Bearer ${config.token}` }
}
function teamQuery(config: VercelConfig): string {
  return config.teamId ? `?teamId=${encodeURIComponent(config.teamId)}` : ''
}
function toBuffer(f: DeployFile): Buffer {
  if (Buffer.isBuffer(f.content)) return f.content
  return Buffer.from(f.content, f.encoding === 'base64' ? 'base64' : 'utf-8')
}

/** Crea o recupera il progetto Vercel del cliente (slug = lumino-client-...). */
export async function getOrCreateVercelProject(
  config: VercelConfig,
  projectSlug: string,
  vercelProjectId?: string,
): Promise<{ projectId: string; existed: boolean }> {
  // Se ho già un id, verifico che esista ancora.
  if (vercelProjectId) {
    const res = await fetch(`${VERCEL_API}/v9/projects/${vercelProjectId}${teamQuery(config)}`, { headers: authHeaders(config) })
    if (res.ok) { const data = await res.json(); return { projectId: data.id as string, existed: true } }
  }
  // Provo a recuperare per nome (idempotenza).
  const byName = await fetch(`${VERCEL_API}/v9/projects/${encodeURIComponent(projectSlug)}${teamQuery(config)}`, { headers: authHeaders(config) })
  if (byName.ok) { const data = await byName.json(); return { projectId: data.id as string, existed: true } }

  // Creo.
  const res = await fetch(`${VERCEL_API}/v9/projects${teamQuery(config)}`, {
    method: 'POST',
    headers: { ...authHeaders(config), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: projectSlug, framework: null }),
  })
  if (!res.ok) throw new Error(`Creazione progetto Vercel fallita: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { projectId: data.id as string, existed: false }
}

/** Carica i file e crea un deployment statico. Polling fino a READY. */
export async function deploySite(
  config: VercelConfig,
  projectSlug: string,
  files: DeployFile[],
): Promise<DeploymentResult> {
  try {
    // 1. Upload di ogni file su /v2/files (chiave = sha1).
    const fileRefs: Array<{ file: string; sha: string; size: number }> = []
    for (const f of files) {
      const buf = toBuffer(f)
      const sha = createHash('sha1').update(buf).digest('hex')
      const up = await fetch(`${VERCEL_API}/v2/files${teamQuery(config)}`, {
        method: 'POST',
        headers: { ...authHeaders(config), 'Content-Type': 'application/octet-stream', 'x-vercel-digest': sha },
        body: new Uint8Array(buf),
      })
      if (!up.ok && up.status !== 409) {
        return { ok: false, error: `Upload file ${f.path} fallito: ${up.status} ${await up.text()}` }
      }
      fileRefs.push({ file: f.path.replace(/^\/+/, ''), sha, size: buf.length })
    }

    // 2. Crea deployment.
    const dep = await fetch(`${VERCEL_API}/v13/deployments${teamQuery(config)}`, {
      method: 'POST',
      headers: { ...authHeaders(config), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectSlug,
        files: fileRefs,
        target: 'production',
        projectSettings: { framework: null },
      }),
    })
    if (!dep.ok) return { ok: false, error: `Deployment fallito: ${dep.status} ${await dep.text()}` }
    const depData = await dep.json()
    const deploymentId: string = depData.id
    let url: string = depData.url ? `https://${depData.url}` : ''

    // 3. Polling readyState (max ~60s).
    for (let i = 0; i < 30; i++) {
      const st = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery(config)}`, { headers: authHeaders(config) })
      if (st.ok) {
        const sd = await st.json()
        if (sd.url) url = `https://${sd.url}`
        const state = sd.readyState || sd.status
        if (state === 'READY') return { ok: true, url, deploymentId, projectId: depData.projectId }
        if (state === 'ERROR' || state === 'CANCELED') return { ok: false, error: `Deploy stato ${state}`, deploymentId }
      }
      await new Promise(r => setTimeout(r, 2000))
    }
    // Timeout polling: ritorna comunque l'URL (il build può completare poco dopo).
    return { ok: true, url, deploymentId, projectId: depData.projectId }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore deploy Vercel.' }
  }
}

/** Collega un dominio custom al progetto. Ritorna info DNS per il registrar. */
export async function addCustomDomain(
  config: VercelConfig,
  vercelProjectId: string,
  domain: string,
): Promise<{ ok: boolean; nameservers?: string[]; error?: string }> {
  try {
    const res = await fetch(`${VERCEL_API}/v10/projects/${vercelProjectId}/domains${teamQuery(config)}`, {
      method: 'POST',
      headers: { ...authHeaders(config), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    })
    if (!res.ok && res.status !== 409) return { ok: false, error: `${res.status} ${await res.text()}` }
    const data = await res.json().catch(() => ({}))
    return { ok: true, nameservers: data?.nameservers }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore dominio.' }
  }
}

/** Rimuove un dominio custom dal progetto. */
export async function removeCustomDomain(
  config: VercelConfig,
  vercelProjectId: string,
  domain: string,
): Promise<{ ok: boolean }> {
  try {
    await fetch(`${VERCEL_API}/v9/projects/${vercelProjectId}/domains/${encodeURIComponent(domain)}${teamQuery(config)}`, {
      method: 'DELETE',
      headers: authHeaders(config),
    })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
