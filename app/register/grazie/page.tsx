import Link from 'next/link'

export const metadata = { title: 'Grazie · Lumino' }

export default function GraziePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '32px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" />

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(700px circle at 18% 12%, rgba(34,197,94,0.10), transparent 50%),' +
          'radial-gradient(600px circle at 82% 85%, rgba(167,139,250,0.08), transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 5,
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em',
          color: '#fff', textDecoration: 'none', lineHeight: 1, marginBottom: 36,
        }}>
          <span>Lumino</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e52d1d', boxShadow: '0 0 12px #e52d1d', alignSelf: 'flex-end', marginBottom: 6 }} />
        </Link>

        {/* Check icon */}
        <div style={{
          width: 78, height: 78, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))',
          border: '1.5px solid rgba(34,197,94,0.5)',
          margin: '0 auto 26px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 14px 40px rgba(34,197,94,0.18)',
        }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(2.4rem, 7vw, 3.6rem)',
          letterSpacing: '-0.025em', lineHeight: 1.05,
          margin: '0 0 18px',
        }}>
          Ci siamo.<br />Inizia la magia.
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 16, lineHeight: 1.6,
          margin: '0 auto 36px', maxWidth: 460,
        }}>
          Account creato. Ora ti contattiamo <strong style={{ color: '#fff' }}>entro 24 ore</strong> per il pagamento della prima rata (50%) e per gli ultimi dettagli sul sito.
        </p>

        <div style={{
          background: 'rgba(20,20,22,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          padding: '24px 22px',
          textAlign: 'left',
          backdropFilter: 'blur(20px)',
        }}>
          <p style={{
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#e52d1d', fontWeight: 700, margin: '0 0 14px',
          }}>✦ Cosa succede adesso</p>

          {[
            { n: '1', t: 'Ti chiamiamo o ti scriviamo', p: 'Entro 24h per confermare i dettagli e mandarti il link di pagamento.' },
            { n: '2', t: 'Paghi il 50%', p: 'Pagamento sicuro online. Solo dopo iniziamo il lavoro.' },
            { n: '3', t: 'Costruiamo il tuo sito', p: 'L\'AI scrive i testi, sceglie le foto migliori, organizza tutto. Tu non fai nulla.' },
            { n: '4', t: 'Approvi e va online', p: 'Ti mandiamo il sito pronto. Modifichi quello che vuoi, paghi il 50% finale, andiamo live.' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{
                flexShrink: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e52d1d, #a78bfa)',
                color: '#fff', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.n}</div>
              <div>
                <p style={{ margin: '4px 0 4px', fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.t}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s.p}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{
          margin: '28px 0 0',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 13, lineHeight: 1.5,
        }}>
          Domande? Scrivi a <a href="mailto:ciao@bylumino.com" style={{ color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>ciao@bylumino.com</a>
        </p>

        <div style={{ marginTop: 28 }}>
          <Link href="/login" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 100,
            color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Accedi all’area riservata
          </Link>
        </div>
      </div>
    </div>
  )
}
