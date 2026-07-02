export type Tier = "basic" | "pro" | "premium" | "personalizzato" | "all";
export type BusinessType =
  | "ristorante" | "barbiere" | "dentista" | "hotel" | "palestra"
  | "estetista" | "consulente" | "agenzia" | "saas" | "fashion"
  | "fotografo" | "studio-medico" | "all";

export interface ComponentMeta {
  name: string;
  description: string;
  tier: Tier;
  business: BusinessType[];
  dependencies: string[];
  category: string;
  status: "ready" | "needs-fix" | "missing-code";
  safe?: boolean; // true = importabile senza installare pacchetti
  hardcoded?: boolean; // true = contenuto fisso, le props non lo cambiano
  propsSchema?: Record<string, string>; // nome prop -> tipo/descrizione, es: { title: "string (required)" }
  multiplicity?: "single" | "collection" | "wrapper";
  // "single" = una istanza per sezione (default se non specificato)
  // "collection" = serve un array di items (es. menu-item-card per menu di N piatti)
  // "wrapper" = contenitore con children (es. masonry-grid)
  notes?: string;
}
