import type { Category } from './types';

/**
 * Lumino's food & beverage taxonomy mapped to Google Places (New) queries.
 *
 *   kind 'type'    → native Google place type, queried via searchNearby.
 *   kind 'keyword' → no exact native type; queried via searchText, optionally
 *                    narrowed by includedType.
 *
 * The order here is the default scan order; the active search_strategy may
 * reorder it at runtime. scan_state.category_cursor indexes this list.
 *
 * NOTE: the spec's "new brand" is NOT a searchable category — newly opened
 * businesses are detected in opening.ts, not via a dedicated search pass.
 */
export const categories: Category[] = [
  { key: 'restaurant', label: 'Restaurant', query: { kind: 'type', includedType: 'restaurant' } },
  { key: 'trattoria', label: 'Trattoria', query: { kind: 'keyword', textQuery: 'trattoria', includedType: 'restaurant' } },
  { key: 'pizzeria', label: 'Pizzeria', query: { kind: 'type', includedType: 'pizza_restaurant' } },
  { key: 'fast_food', label: 'Fast food', query: { kind: 'type', includedType: 'fast_food_restaurant' } },
  { key: 'kebab', label: 'Kebab', query: { kind: 'keyword', textQuery: 'kebab', includedType: 'restaurant' } },
  { key: 'bar', label: 'Bar', query: { kind: 'type', includedType: 'bar' } },
  { key: 'cafe', label: 'Cafe', query: { kind: 'type', includedType: 'cafe' } },
  { key: 'bakery', label: 'Bakery', query: { kind: 'type', includedType: 'bakery' } },
  { key: 'street_food', label: 'Street food', query: { kind: 'keyword', textQuery: 'street food' } },
];

const byKey = new Map(categories.map((c) => [c.key, c]));

/** Look up a category by its internal key. */
export function getCategory(key: string): Category | undefined {
  return byKey.get(key);
}

/**
 * Return categories ordered per the active strategy's prioritized_categories.
 * Unknown keys are skipped; categories not listed keep their default order at
 * the end, so a scan never silently drops a category.
 */
export function orderedCategories(priority: string[] = []): Category[] {
  const seen = new Set<string>();
  const ordered: Category[] = [];

  for (const key of priority) {
    const cat = byKey.get(key);
    if (cat && !seen.has(key)) {
      ordered.push(cat);
      seen.add(key);
    }
  }
  for (const cat of categories) {
    if (!seen.has(cat.key)) ordered.push(cat);
  }

  return ordered;
}
