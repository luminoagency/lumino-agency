'use client'

interface AllergenBadgesProps {
  allergens?: string[]
  variant?: 'pill' | 'icon' | 'minimal'
  accent?: string
  textColor?: string
}

const ALLERGEN_MAP: Record<string, { short: string; label: string; color: string }> = {
  vegan:      { short: 'V',  label: 'Vegano',          color: '#5e8a3a' },
  vegetarian: { short: 'VG', label: 'Vegetariano',     color: '#7a9a4a' },
  gf:         { short: 'GF', label: 'Senza glutine',   color: '#c98a3a' },
  spicy:      { short: '🌶', label: 'Piccante',        color: '#d44a2c' },
  signature:  { short: '★',  label: 'Signature',       color: '#c9a84c' },
  nuts:       { short: '⚠',  label: 'Frutta a guscio', color: '#a67c52' },
}

export function AllergenBadges({ allergens, variant = 'pill', accent, textColor }: AllergenBadgesProps) {
  if (!allergens || allergens.length === 0) return null

  if (variant === 'minimal') {
    return (
      <span style={{ display: 'inline-flex', gap: 6, marginLeft: 8, verticalAlign: 'middle' }}>
        {allergens.map(a => {
          const def = ALLERGEN_MAP[a]
          if (!def) return null
          return (
            <span
              key={a}
              title={def.label}
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: def.color,
                opacity: 0.9,
              }}
            >
              {def.short}
            </span>
          )
        })}
      </span>
    )
  }

  if (variant === 'icon') {
    return (
      <span style={{ display: 'inline-flex', gap: 4, marginLeft: 8, verticalAlign: 'middle' }}>
        {allergens.map(a => {
          const def = ALLERGEN_MAP[a]
          if (!def) return null
          return (
            <span
              key={a}
              title={def.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 6,
                fontSize: '0.65rem',
                fontWeight: 700,
                background: `${def.color}22`,
                color: def.color,
                border: `1px solid ${def.color}55`,
              }}
            >
              {def.short}
            </span>
          )
        })}
      </span>
    )
  }

  // default pill
  return (
    <span style={{ display: 'inline-flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
      {allergens.map(a => {
        const def = ALLERGEN_MAP[a]
        if (!def) return null
        return (
          <span
            key={a}
            title={def.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 100,
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              background: `${def.color}1a`,
              color: def.color,
              border: `1px solid ${def.color}40`,
              textTransform: 'uppercase' as const,
            }}
          >
            {def.short} <span style={{ fontWeight: 500, textTransform: 'none' as const }}>{def.label}</span>
          </span>
        )
      })}
    </span>
  )
}
