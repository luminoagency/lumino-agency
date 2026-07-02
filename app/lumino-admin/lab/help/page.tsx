import { requireSuperAdmin } from '../guard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Guida | Lumino Admin' };

export default async function LabHelpPage() {
  await requireSuperAdmin('/lumino-admin/lab/help');
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-8 mb-2 font-serif text-lg text-amber-500">{children}</h2>;
  const code = 'rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[12px]';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm leading-relaxed">
        <a href="/lumino-admin/lab" className="text-xs text-zinc-500 hover:text-zinc-300">← Lab</a>
        <h1 className="mt-2 font-serif text-3xl">Guida Lumino Lab</h1>

        <H>Flow completo (Step 1–6)</H>
        <ol className="list-decimal space-y-1 pl-5 text-zinc-300">
          <li><b>Research</b> — Opus analizza il business da URL/nome.</li>
          <li><b>Layout</b> — proposte multi-pagina (preset "Hotel Boutique" per ricettivi).</li>
          <li><b>Builder</b> — assemblaggio da libreria (103 certificati) + custom intelligente.</li>
          <li><b>Editor</b> — palette, testi, foto, sezioni, sostituzione componenti, multi-device, multi-lingua.</li>
          <li><b>Publish</b> — audit qualità → deploy Vercel (o test mode locale) + dominio custom.</li>
          <li><b>Subscription</b> — abbonamento hotel (manuale) + accesso cliente.</li>
        </ol>

        <H>Attivare abbonamento hotel</H>
        <p className="text-zinc-300">Step 5 (Publish) → sezione "🏨 Hotel — Attiva abbonamento": setup fee, canone, giorno addebito → crea l'abbonamento e porta allo Step 6. Da lì gestisci fatture (segna pagata), sospendi/riattiva, cambia importo.</p>

        <H>Credenziali cliente</H>
        <p className="text-zinc-300">Step 6 → box "👤 Accesso cliente": inserisci email → genera password temporanea + login URL (<span className={code}>{'{dominio}/portal/login'}</span>). Inoltrale al cliente. Puoi resettare la password o eliminare l'accesso.</p>

        <H>Applicare le migration</H>
        <p className="text-zinc-300">Le migration <span className={code}>0018–0023</span> sono in <span className={code}>supabase/migrations/</span>. Applicale a mano (Supabase SQL editor o CLI) quando pronto. Finché non applicate, le feature DB-backed (subscription, messaggi, accessi cliente, publish columns) degradano a vuoto senza errori.</p>

        <H>Env vars richieste</H>
        <ul className="list-disc space-y-1 pl-5 text-zinc-300">
          <li><span className={code}>CLAUDE_API_KEY</span> — generazione siti + traduzioni + categorizzazione foto.</li>
          <li><span className={code}>NEXT_PUBLIC_SUPABASE_URL</span> / <span className={code}>SUPABASE_SERVICE_ROLE_KEY</span> — DB + Storage.</li>
          <li><span className={code}>VERCEL_TOKEN</span> / <span className={code}>VERCEL_TEAM_ID</span> / <span className={code}>VERCEL_PROJECT_PREFIX</span> — deploy (vuoti = test mode locale in <span className={code}>public/published/</span>).</li>
          <li><span className={code}>GOOGLE_MAPS_API_KEY</span> — photo import Google Places (opzionale).</li>
          <li><span className={code}>NEXT_PUBLIC_LUMINO_APP_URL</span> — base URL per i form del sito statico cross-domain (opzionale).</li>
        </ul>

        <H>Troubleshooting</H>
        <ul className="list-disc space-y-1 pl-5 text-zinc-300">
          <li>Diagnostica rapida: <span className={code}>npx tsx scripts/setup-lab.ts</span>.</li>
          <li>"Audit: errori critici" al publish → risolvi i check critici nello Step 5 (privacy, palette, homepage, GDPR).</li>
          <li>Dashboard cliente vuota → applica la migration 0022 e crea un accesso.</li>
          <li>Upload logo/foto fallisce → applica 0018 (bucket <span className={code}>project-assets</span>) e verifica le env Supabase.</li>
          <li>Generazione siti fallisce → controlla crediti/validità <span className={code}>CLAUDE_API_KEY</span>.</li>
        </ul>

        <footer className="mt-10 border-t border-zinc-800 pt-4 text-center text-[11px] text-zinc-600">Lumino Lab v1.0 · 2026</footer>
      </div>
    </div>
  );
}
