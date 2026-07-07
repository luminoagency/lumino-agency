/**
 * Stili condivisi del pannello /admin, iniettati una sola volta dallo shell
 * (layout.tsx). Le classi `ae-*` sono le stesse dell'AdminEditor storico
 * (input, sezioni, toggle, bottoni, barra salva): così le sotto-route le
 * riusano senza duplicare CSS. Le `ac-*` sono nuove (wrapper contenuto,
 * intestazione sezione, card scorciatoia del cruscotto).
 */
export function AdminStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; background: #050505; }

      /* contenuto sotto-route */
      .ac-wrap { max-width: 840px; margin: 0 auto; padding: 30px 26px 120px; }
      .ac-head { margin-bottom: 22px; }
      .ac-head-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .ac-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 30px; font-weight: 400; margin: 0 0 4px; letter-spacing: -0.01em; color: #fff; }
      .ac-sub { color: rgba(255,255,255,0.5); font-size: 13.5px; margin: 0; line-height: 1.5; }
      .ac-viewsite { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 13px; white-space: nowrap; flex-shrink: 0; padding-top: 6px; }
      .ac-viewsite:hover { color: #fff; }
      .ac-hint { color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.55; margin: 0 0 22px; }

      /* cruscotto: scorciatoie */
      .ac-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
      .ac-card { display: flex; flex-direction: column; gap: 4px; padding: 18px; background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; text-decoration: none; color: #fff; transition: border-color 0.2s, background 0.2s; }
      .ac-card:hover { border-color: rgba(229,45,29,0.4); background: rgba(255,255,255,0.03); }
      .ac-card.locked { opacity: 0.55; }
      .ac-card-title { font-size: 14.5px; font-weight: 600; display: flex; align-items: center; gap: 7px; }
      .ac-card-sub { font-size: 12.5px; color: rgba(255,255,255,0.5); line-height: 1.4; }
      .ac-card-lock { margin-left: auto; font-size: 12px; opacity: 0.8; }

      /* sezioni card */
      .ae-section { background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 24px; margin-bottom: 18px; }
      .ae-h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 22px; font-weight: 400; margin: 0 0 4px; letter-spacing: -0.015em; color: #fff; }
      .ae-h2-sub { color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 20px; }

      /* campi */
      .ae-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .ae-grid-1 { display: grid; grid-template-columns: 1fr; gap: 14px; }
      .ae-field { display: flex; flex-direction: column; }
      .ae-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 6px; letter-spacing: 0.04em; }
      .ae-input, .ae-textarea { width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s, background 0.2s; }
      .ae-input:focus, .ae-textarea:focus { border-color: rgba(229,45,29,0.5); background: rgba(255,255,255,0.06); }
      .ae-textarea { min-height: 90px; resize: vertical; line-height: 1.5; }

      /* orari */
      .ae-hours-row { display: grid; grid-template-columns: 60px 1fr 1fr 100px; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .ae-hours-row:last-child { border-bottom: 0; }
      .ae-hours-day { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); }
      .ae-hours-input { width: 100%; padding: 8px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 13px; font-family: inherit; outline: none; }
      .ae-hours-input:disabled { opacity: 0.3; }
      .ae-hours-closed { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6); cursor: pointer; user-select: none; }
      .ae-hours-closed input { accent-color: #e52d1d; }

      /* bottoni */
      .ae-btn { padding: 11px 20px; border: 0; border-radius: 100px; font-family: inherit; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
      .ae-btn-primary { background: linear-gradient(135deg, #e52d1d, #c9241a); color: #fff; box-shadow: 0 10px 24px rgba(229,45,29,0.3); }
      .ae-btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
      .ae-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .ae-btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 10px 24px rgba(34,197,94,0.3); }
      .ae-btn-ghost { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.12); }
      .ae-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
      .ae-btn-danger { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
      .ae-btn-danger:hover { background: rgba(239,68,68,0.2); }

      /* barra salva flottante */
      .ae-savebar { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); padding: 12px 16px; background: rgba(10,10,10,0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; box-shadow: 0 16px 48px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 14px; z-index: 50; }
      .ae-feedback { font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 100px; }
      .ae-feedback-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
      .ae-feedback-err { background: rgba(239,68,68,0.15); color: #f87171; }

      /* stato sito (Panoramica) */
      .ae-status { padding: 22px 24px; border-radius: 18px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
      .ae-status.live { background: linear-gradient(180deg, rgba(34,197,94,0.10), rgba(20,20,22,0.7)); border: 1px solid rgba(34,197,94,0.3); }
      .ae-status.off { background: linear-gradient(180deg, rgba(229,45,29,0.08), rgba(20,20,22,0.7)); border: 1px solid rgba(255,255,255,0.08); }
      .ae-status-left { flex: 1; min-width: 220px; }
      .ae-status-pill { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; }
      .ae-status.live .ae-status-pill { color: #22c55e; }
      .ae-status.off .ae-status-pill { color: rgba(255,255,255,0.55); }
      .ae-status-dot { width: 8px; height: 8px; border-radius: 50%; }
      .ae-status.live .ae-status-dot { background: #22c55e; box-shadow: 0 0 12px #22c55e; }
      .ae-status.off .ae-status-dot { background: #888; }
      .ae-status-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 26px; font-weight: 400; margin: 6px 0 4px; letter-spacing: -0.01em; }
      .ae-status-meta { color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5; }
      .ae-status-meta code { background: rgba(255,255,255,0.05); padding: 2px 7px; border-radius: 5px; font-size: 12px; }
      .ae-status-meta b { color: #fff; text-transform: capitalize; }
      .ae-status-actions { display: flex; gap: 10px; flex-wrap: wrap; }

      /* funzionalità (toggle) */
      .ae-feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
      .ae-feat { padding: 16px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; transition: border-color 0.2s, background 0.2s; }
      .ae-feat.on { border-color: rgba(34,197,94,0.25); background: rgba(34,197,94,0.04); }
      .ae-feat.locked { opacity: 0.5; }
      .ae-feat-head { display: flex; align-items: center; gap: 12px; }
      .ae-feat-icon { font-size: 22px; flex-shrink: 0; }
      .ae-feat-meta { flex: 1; min-width: 0; }
      .ae-feat-name { margin: 0; font-size: 14px; font-weight: 600; color: #fff; }
      .ae-feat-sub { margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.35; }
      .ae-feat-badge { font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; background: rgba(167,139,250,0.18); color: #c4b5fd; padding: 5px 10px; border-radius: 9999px; text-decoration: none; white-space: nowrap; }
      .ae-toggle { width: 46px; height: 26px; border-radius: 9999px; background: rgba(255,255,255,0.1); border: 0; position: relative; cursor: pointer; transition: background 0.2s; padding: 0; flex-shrink: 0; }
      .ae-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
      .ae-toggle.on { background: #22c55e; }
      .ae-toggle-knob { display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
      .ae-toggle.on .ae-toggle-knob { left: 23px; }

      @media (max-width: 860px) {
        .ae-grid { grid-template-columns: 1fr; }
        .ae-hours-row { grid-template-columns: 50px 1fr 1fr; }
        .ae-hours-closed { grid-column: 1 / -1; padding-top: 2px; }
        .ac-head-row { flex-direction: column; gap: 6px; }
      }
    `}</style>
  )
}
