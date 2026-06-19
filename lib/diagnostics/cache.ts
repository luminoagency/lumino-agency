/**
 * Lightweight in-memory cache for diagnostics.
 * Resets on cold starts — acceptable for this use case.
 */

interface Entry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, Entry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export const AI_SUMMARY_TTL = 30 * 60 * 1000
