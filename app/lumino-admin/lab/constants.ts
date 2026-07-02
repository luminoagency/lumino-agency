// Costanti condivise del Lumino Lab (importabili sia da server che client).

export const BUSINESS_TYPES = [
  { key: 'ristorante', label: 'Ristorante', icon: '🍽️' },
  { key: 'hotel',      label: 'Hotel / B&B / Resort', icon: '🏨' },
  { key: 'barbiere',   label: 'Barbiere',   icon: '💈' },
  { key: 'dentista',   label: 'Dentista',   icon: '🦷' },
  { key: 'palestra',   label: 'Palestra',   icon: '🏋️' },
  { key: 'negozio',    label: 'Negozio',    icon: '🛍️' },
  { key: 'altro',      label: 'Altro',      icon: '🏢' },
] as const

export type BusinessTypeKey = (typeof BUSINESS_TYPES)[number]['key']

// Step 1..5 → index 0..4
export const STEP_LABELS = ['Research', 'Layout', 'Builder', 'Editor', 'Publish'] as const
export const TOTAL_STEPS = STEP_LABELS.length

export const STATUS_COLUMNS = [
  { key: 'bozza',          label: 'Bozze' },
  { key: 'in_costruzione', label: 'In costruzione' },
  { key: 'pubblicato',     label: 'Pubblicati' },
] as const

export type LabStatus = (typeof STATUS_COLUMNS)[number]['key']

export function businessTypeMeta(key: string) {
  return BUSINESS_TYPES.find(t => t.key === key) ?? { key, label: key, icon: '🏢' }
}

export function stepLabel(step: number) {
  const i = Math.min(Math.max(step, 1), TOTAL_STEPS) - 1
  return STEP_LABELS[i]
}
