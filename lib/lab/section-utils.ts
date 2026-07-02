/**
 * Utility PURE per le SiteSection (Step 4 — Editor Livello 2).
 *
 * Questo file NON importa nulla a runtime da builder.ts (solo il type, che viene
 * eliso): è quindi importabile sia lato server (builder.ts lo ri-esporta) sia lato
 * client (Step4Editor) senza trascinare l'SDK Anthropic / node:fs nel bundle.
 */

import type { SiteSection } from './builder';

/**
 * Set immutabile di un valore a un path annidato.
 * Supporta indici di array: "images.0.src", "achievements.2.value", "palette.accent".
 * Un path vuoto ("") sostituisce l'intero target con newValue (usato per array root).
 */
function setAtPath(target: unknown, parts: string[], value: unknown): unknown {
  if (parts.length === 0) return value;
  const [head, ...rest] = parts;
  const isIndex = /^\d+$/.test(head);
  if (isIndex) {
    const idx = Number(head);
    const arr = Array.isArray(target) ? [...target] : [];
    arr[idx] = setAtPath(arr[idx], rest, value);
    return arr;
  }
  const obj =
    target && typeof target === 'object' && !Array.isArray(target)
      ? { ...(target as Record<string, unknown>) }
      : {};
  obj[head] = setAtPath(obj[head], rest, value);
  return obj;
}

/**
 * Aggiorna immutabilmente UNA prop di una SiteSection di libreria e ritorna una
 * nuova SiteSection. Le sezioni custom vengono ritornate invariate (niente props).
 *
 * @example updateSectionProps({ section, propPath: 'title', newValue: 'Ciao' })
 * @example updateSectionProps({ section, propPath: 'images.0.src', newValue: 'https://…' })
 * @example updateSectionProps({ section, propPath: '', newValue: [...items, newItem] }) // collection root
 */
export function updateSectionProps(input: {
  section: SiteSection;
  propPath: string;
  newValue: unknown;
}): SiteSection {
  const { section, propPath, newValue } = input;
  if (section.type !== 'library') return section;
  const parts = propPath.split('.').filter(Boolean);
  const newProps = setAtPath(section.props, parts, newValue) as
    | Record<string, unknown>
    | Array<Record<string, unknown>>;
  return { ...section, props: newProps };
}
