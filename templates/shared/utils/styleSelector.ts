import Anthropic from '@anthropic-ai/sdk'
import type { SiteStyle } from '../types/restaurant'

export interface RestaurantProfile {
  name: string
  category: string
  cuisine?: string
  description?: string
}

export interface StyleSelection {
  style: SiteStyle
  reasoning: string
}

const STYLE_CRITERIA = `
- luxury: fine dining, wine bars, hotels, steakhouses, upscale sushi, tasting menus, champagne bars
- exotic: Japanese, Thai, Indian, Mexican, Lebanese, Ethiopian, Vietnamese, Moroccan, Korean, fusion
- modern: pizzerias, burgers, fast food, street food, cafes, brunch spots, food trucks, casual bistros`

export async function selectRestaurantStyle(
  profile: RestaurantProfile,
): Promise<StyleSelection> {
  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `Choose a website design style for this restaurant.

Name: ${profile.name}
Category: ${profile.category}${profile.cuisine ? `\nCuisine: ${profile.cuisine}` : ''}${profile.description ? `\nDescription: ${profile.description}` : ''}

Styles:${STYLE_CRITERIA}

Reply ONLY with valid JSON: {"style":"luxury"|"exotic"|"modern","reasoning":"one sentence"}`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Claude response type')

  let parsed: StyleSelection
  try {
    parsed = JSON.parse(block.text)
  } catch {
    throw new Error(`Could not parse style selection response: ${block.text}`)
  }

  if (!['luxury', 'exotic', 'modern'].includes(parsed.style)) {
    throw new Error(`Invalid style returned: ${parsed.style}`)
  }

  return parsed
}
