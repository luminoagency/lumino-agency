/**
 * Intestazione di sezione condivisa del pannello /admin: titolo + sottotitolo
 * + link opzionale "Vedi il sito". Usata da tutte le sotto-route (STEP 2) e
 * dagli editor condivisi in modalità `embedded` (STEP 3), così ogni sezione ha
 * lo stesso header e la navigazione resta nella sidebar.
 */
export function AdminSectionHead({ title, sub, siteSlug }: { title: string; sub?: string; siteSlug?: string }) {
  return (
    <div className="ac-head ac-head-row">
      <div>
        <h1 className="ac-title">{title}</h1>
        {sub && <p className="ac-sub">{sub}</p>}
      </div>
      {siteSlug && (
        <a className="ac-viewsite" href={`/sites/${siteSlug}`} target="_blank" rel="noreferrer">Vedi il sito ↗</a>
      )}
    </div>
  )
}
