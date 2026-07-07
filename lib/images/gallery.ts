/** Tipi e limiti della gallery, condivisi tra server action e UI (non "use server"). */
export type GalleryImage = { url: string; alt?: string; caption?: string }
export const MAX_GALLERY = 15
