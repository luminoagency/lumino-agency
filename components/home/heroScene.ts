/**
 * Composizione dell'hero «muro dei contenuti».
 *
 * Il muro è fatto di riquadri verticali come i reel: alcuni sono video corti in
 * loop (solo da PC, dove la decodifica costa poco), gli altri sono foto. Su
 * telefono si vedono solo le foto: il movimento lo danno le colonne che
 * scorrono, e l'unico video che gira è quello in primo piano. È la regola che
 * tiene il telefono senza scatti.
 *
 * Tutti i file stanno in /public/hero/wall, già tagliati 300×534 (9:16).
 */

export interface WallTile {
  /** Nome del file senza estensione: c'è sempre il .webp, il .mp4 solo se video. */
  name: string
  video: boolean
  alt: string
}

export const WALL_TILES: WallTile[] = [
  { name: 'maker', video: true, alt: 'riprese sul posto con il videomaker' },
  { name: 'shop', video: false, alt: 'una titolare in negozio' },
  { name: 'crowd', video: true, alt: 'un locale pieno di clienti' },
  { name: 'reel-1', video: false, alt: 'un contenuto per i social' },
  { name: 'couple', video: true, alt: 'clienti che arrivano' },
  { name: 'scroll', video: false, alt: 'un cliente che guarda un reel' },
  { name: 'plate', video: true, alt: 'un piatto ripreso per un reel' },
  { name: 'reel-2', video: false, alt: 'un contenuto per i social' },
  { name: 'typing', video: true, alt: 'qualcuno che cerca sul telefono' },
  { name: 'shoot', video: false, alt: 'un set fotografico' },
  { name: 'full', video: true, alt: 'una sala piena' },
  { name: 'reel-3', video: false, alt: 'un contenuto per i social' },
  { name: 'sofa', video: true, alt: 'una persona che scorre il feed' },
  { name: 'sala', video: false, alt: 'una sala apparecchiata' },
  { name: 'owner', video: true, alt: 'un titolare nella sua attività' },
  { name: 'reel-4', video: false, alt: 'un contenuto per i social' },
]

/** Colonne del muro e riquadri per colonna (prima della copia per il loop). */
export const WALL_COLS = 7
export const WALL_PER_COL = 4

/** Riquadri della colonna c: ognuna pesca dalla lista con un passo diverso,
 *  così due colonne vicine non mostrano mai la stessa sequenza. */
export function tilesForColumn(c: number): WallTile[] {
  const out: WallTile[] = []
  for (let r = 0; r < WALL_PER_COL; r++) out.push(WALL_TILES[(c * 5 + r * 3 + c) % WALL_TILES.length])
  return out
}

export const HERO_LETTERS = ['L', 'U', 'M', 'I', 'N', 'O'] as const
