/**
 * Test manuale submit form → /api/messages/{projectId} (Layer 5 · STEP 11).
 * NON eseguito automaticamente. Richiede: dev server attivo + un projectId reale.
 * Uso: BASE=http://localhost:3000 PROJECT_ID=<uuid> npx tsx scripts/test-form-submission.ts
 * Verifica poi che il messaggio compaia in /portal/messages del progetto.
 */

async function main() {
  const base = process.env.BASE || 'http://localhost:3000';
  const projectId = process.env.PROJECT_ID || 'test';
  const payload = {
    message_type: 'contact',
    from_name: 'Marco Bianchi',
    from_email: 'marco@example.com',
    from_phone: '+39 333 1234567',
    subject: 'Richiesta info matrimonio',
    message_body: 'Buongiorno, vorrei informazioni per un evento a giugno. Grazie.',
    page_slug: '/contatti',
    extra_data: { source: 'test-script' },
  };

  const res = await fetch(`${base}/api/messages/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  console.log('HTTP', res.status, JSON.stringify(data, null, 2));
  console.log(data.ok ? '✅ Messaggio inserito. Controlla /portal/messages.' : '❌ Fallito (verifica migration 0022 applicata + projectId valido).');
}
main();
