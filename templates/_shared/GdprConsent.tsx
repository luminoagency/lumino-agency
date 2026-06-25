/**
 * Checkbox GDPR riutilizzabile per i form dei siti clienti
 * (prenotazioni, newsletter, recensioni).
 *
 * - `required` rende il consenso obbligatorio: il browser blocca l'invio
 *   del form finché la casella non è spuntata.
 * - Stile inline adattivo: passa `accent` e `color` per integrarlo nel tema.
 * - Il link punta in modo assoluto alla Privacy Policy di Lumino, perché i
 *   siti dei clienti sono pubblicati su domini differenti.
 */
export default function GdprConsent({
  accent = '#888',
  color = 'rgba(255,255,255,0.6)',
  style,
}: {
  accent?: string
  color?: string
  style?: React.CSSProperties
}) {
  return (
    <label
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        width: '100%',
        fontSize: '0.72rem',
        lineHeight: 1.45,
        color,
        textAlign: 'left',
        cursor: 'pointer',
        ...style,
      }}
    >
      <input
        type="checkbox"
        required
        style={{ marginTop: 2, accentColor: accent, width: 14, height: 14, flexShrink: 0 }}
      />
      <span>
        Ho letto e accetto la{' '}
        <a
          href="https://bylumino.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: accent, textDecoration: 'underline' }}
        >
          Privacy Policy
        </a>{' '}
        (GDPR, Reg. UE 2016/679).
      </span>
    </label>
  )
}
