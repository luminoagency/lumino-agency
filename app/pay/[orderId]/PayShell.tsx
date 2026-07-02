/**
 * Guscio grafico condiviso per le pagine di pagamento pubbliche.
 * Componenti server-safe (nessuno stato): riusati dalla pagina /pay.
 */

export function PayShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10 text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-lg font-semibold tracking-tight">Lumino</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl">
          {children}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/30">
          Pagamento sicuro tramite PayPal
        </p>
      </div>
    </div>
  )
}

export function AlreadyPaid({
  clientName,
  label,
}: {
  clientName: string
  label: string
}) {
  return (
    <PayShell>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-3xl">
          ✓
        </div>
        <h1 className="text-xl font-semibold">Pagamento già completato</h1>
        <p className="mt-2 text-white/60">
          Ciao {clientName}, questo pagamento ({label}) risulta già ricevuto.
          Grazie! Non devi fare altro.
        </p>
      </div>
    </PayShell>
  )
}
