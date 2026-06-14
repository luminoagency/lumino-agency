import { luxuryTokens } from './luxury/tokens'
import { exoticTokens } from './exotic/tokens'
import { modernTokens } from './modern/tokens'
import type { SiteStyle } from '../shared/types/restaurant'

export { luxuryTokens } from './luxury/tokens'
export { exoticTokens } from './exotic/tokens'
export { modernTokens } from './modern/tokens'

export type { LuxuryTokens } from './luxury/tokens'
export type { ExoticTokens } from './exotic/tokens'
export type { ModernTokens } from './modern/tokens'

const themeMap = {
  luxury: luxuryTokens,
  exotic: exoticTokens,
  modern: modernTokens,
} as const

export function getThemeTokens(style: SiteStyle) {
  return themeMap[style]
}
