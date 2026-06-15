'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { saveMyMenu, type MenuCategoryDTO, type MenuItemDTO } from '../actions/site'

const ALLERGENS: Array<{ key: string; label: string; color: string }> = [
  { key: 'vegan', label: 'Vegano', color: '#5e8a3a' },
  { key: 'vegetarian', label: 'Vegetariano', color: '#7a9a4a' },
  { key: 'gf', label: 'Senza glutine', color: '#c98a3a' },
  { key: 'spicy', label: 'Piccante', color: '#d44a2c' },
  { key: 'signature', label: 'Signature', color: '#c9a84c' },
  { key: 'nuts', label: 'Frutta a guscio', color: '#a67c52' },
]

interface Props {
  initial: MenuCategoryDTO[]
  siteSlug: string
}

export function MenuEditor({ initial, siteSlug }: Props) {
  const [cats, setCats] = useState<MenuCategoryDTO[]>(initial.length > 0 ? initial : [emptyCategory()])
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function updateCat(i: number, patch: Partial<MenuCategoryDTO>) {
    setCats(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  }
  function updateItem(ci: number, ii: number, patch: Partial<MenuItemDTO>) {
    setCats(prev => prev.map((c, idx) => idx === ci ? {
      ...c,
      items: c.items.map((it, jj) => jj === ii ? { ...it, ...patch } : it),
    } : c))
  }
  function addCategory() {
    setCats(prev => [...prev, emptyCategory()])
  }
  function removeCategory(i: number) {
    if (!confirm('Eliminare questa categoria con tutti i piatti dentro?')) return
    setCats(prev => prev.filter((_, idx) => idx !== i))
  }
  function moveCategory(i: number, dir: -1 | 1) {
    setCats(prev => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const arr = [...prev]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }
  function addItem(ci: number) {
    setCats(prev => prev.map((c, idx) => idx === ci ? {
      ...c,
      items: [...c.items, { name: '', description: '', price: 0, allergens: [] }],
    } : c))
  }
  function removeItem(ci: number, ii: number) {
    setCats(prev => prev.map((c, idx) => idx === ci ? {
      ...c,
      items: c.items.filter((_, jj) => jj !== ii),
    } : c))
  }
  function toggleAllergen(ci: number, ii: number, key: string) {
    setCats(prev => prev.map((c, idx) => idx === ci ? {
      ...c,
      items: c.items.map((it, jj) => {
        if (jj !== ii) return it
        const list = it.allergens || []
        return {
          ...it,
          allergens: list.includes(key) ? list.filter(a => a !== key) : [...list, key],
        }
      }),
    } : c))
  }

  function save() {
    setFeedback(null)
    // pulizia: scarta categorie senza nome e piatti senza nome
    const cleaned = cats
      .filter(c => c.name.trim())
      .map(c => ({
        ...c,
        items: c.items.filter(i => i.name.trim()).map(i => ({
          ...i,
          price: Number(i.price) || 0,
        })),
      }))
      .filter(c => c.items.length > 0)
    startTransition(async () => {
      const r = await saveMyMenu(cleaned)
      if (r.ok) {
        setFeedback({ ok: true, msg: '✓ Menu salvato' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  return (
    <div className="me-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .me-root { min-height: 100vh; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .me-top { padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; gap:12px; background:rgba(10,10,10,0.7); backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; }
        .me-top-left { display:flex; align-items:center; gap:14px; }
        .me-back { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 13px; }
        .me-back:hover { color: #fff; }
        .me-title-bar { font-family:'Cormorant Garamond', Georgia, serif; font-size:22px; font-style:italic; }

        .me-wrap { max-width: 920px; margin: 0 auto; padding: 28px 22px; }
        .me-hint { color: rgba(255,255,255,0.5); font-size: 13.5px; line-height: 1.55; margin: 0 0 22px; }

        .me-cat { background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .me-cat-head { display:flex; align-items:center; gap:10px; margin-bottom: 14px; flex-wrap:wrap; }
        .me-cat-input { flex:1; min-width:220px; padding: 11px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:16px; font-family:inherit; font-family:'Cormorant Garamond', Georgia, serif; font-style:italic; }
        .me-cat-input:focus { outline:none; border-color: rgba(229,45,29,0.5); }
        .me-cat-desc { width:100%; padding: 10px 14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; color:#fff; font-size: 13px; font-family:inherit; margin-bottom: 12px; }
        .me-cat-desc:focus { outline:none; border-color: rgba(229,45,29,0.5); }
        .me-tool { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); border-radius: 8px; padding: 8px 12px; font-size: 12px; cursor:pointer; font-family:inherit; transition: all 0.2s; }
        .me-tool:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .me-tool-danger { color: #f87171; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
        .me-tool-danger:hover { background: rgba(239,68,68,0.15); }

        .me-item { padding: 12px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 8px; }
        .me-item-row1 { display: grid; grid-template-columns: 2fr 100px 40px; gap: 10px; align-items:center; margin-bottom: 8px; }
        .me-item-input { width:100%; padding: 9px 12px; background: transparent; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #fff; font-size: 14px; font-family:inherit; }
        .me-item-input:focus { outline:none; border-color: rgba(229,45,29,0.45); background: rgba(255,255,255,0.03); }
        .me-item-input::placeholder { color: rgba(255,255,255,0.3); }
        .me-item-desc { width:100%; padding: 7px 12px; background: transparent; border:1px solid rgba(255,255,255,0.06); border-radius: 8px; color: rgba(255,255,255,0.85); font-size: 12.5px; font-family:inherit; margin-bottom: 8px; resize: vertical; min-height: 34px; }
        .me-item-desc:focus { outline:none; border-color: rgba(229,45,29,0.4); }
        .me-item-x { background: transparent; border:0; color: rgba(239,68,68,0.55); cursor:pointer; font-size: 17px; padding: 4px; }
        .me-item-x:hover { color: #f87171; }

        .me-allergens { display:flex; gap:6px; flex-wrap:wrap; }
        .me-all { padding: 4px 10px; border-radius: 100px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; cursor:pointer; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); user-select: none; transition: all 0.2s; }
        .me-all.on { color: #fff; border-color: transparent; }

        .me-addcat-row { text-align:center; margin: 18px 0 0; }
        .me-addcat { padding: 13px 22px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.18); border-radius: 12px; color: rgba(255,255,255,0.75); font-size: 13px; cursor:pointer; font-family:inherit; }
        .me-addcat:hover { background: rgba(255,255,255,0.07); color: #fff; }

        .me-savebar { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); padding: 12px 16px; background: rgba(10,10,10,0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; box-shadow: 0 16px 48px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 14px; z-index: 50; }
        .me-save { padding: 11px 22px; border: 0; border-radius: 100px; background: linear-gradient(135deg, #e52d1d, #c9241a); color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; font-family:inherit; }
        .me-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(229,45,29,0.4); }
        .me-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .me-feedback { font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 100px; }
        .me-feedback-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
        .me-feedback-err { background: rgba(239,68,68,0.15); color: #f87171; }

        @media (max-width: 600px) {
          .me-item-row1 { grid-template-columns: 1fr 80px 32px; }
        }
      `}</style>

      <nav className="me-top">
        <div className="me-top-left">
          <Link href="/admin" className="me-back">← Pannello</Link>
          <span className="me-title-bar">Menu</span>
        </div>
        <Link href={`/sites/${siteSlug}`} target="_blank" className="me-back">Vedi il sito ↗</Link>
      </nav>

      <div className="me-wrap">
        <p className="me-hint">Organizza il tuo menu per categorie (es. <em>Antipasti</em>, <em>Primi</em>, <em>Cocktail</em>). Per ogni piatto puoi mettere il prezzo e gli allergeni. Niente foto qui — quelle le sceglie il sistema.</p>

        {cats.map((cat, ci) => (
          <div key={ci} className="me-cat">
            <div className="me-cat-head">
              <input
                className="me-cat-input"
                value={cat.name}
                onChange={e => updateCat(ci, { name: e.target.value })}
                placeholder="Nome categoria (es. Antipasti)"
              />
              <button type="button" className="me-tool" onClick={() => moveCategory(ci, -1)} disabled={ci === 0} title="Sposta su">↑</button>
              <button type="button" className="me-tool" onClick={() => moveCategory(ci, 1)} disabled={ci === cats.length - 1} title="Sposta giù">↓</button>
              <button type="button" className="me-tool me-tool-danger" onClick={() => removeCategory(ci)}>Elimina</button>
            </div>
            <input
              className="me-cat-desc"
              value={cat.description || ''}
              onChange={e => updateCat(ci, { description: e.target.value })}
              placeholder="Descrizione categoria (opzionale)"
            />

            {cat.items.map((item, ii) => (
              <div key={ii} className="me-item">
                <div className="me-item-row1">
                  <input
                    className="me-item-input"
                    value={item.name}
                    onChange={e => updateItem(ci, ii, { name: e.target.value })}
                    placeholder="Nome piatto"
                  />
                  <input
                    className="me-item-input"
                    type="number"
                    step="0.5"
                    min="0"
                    value={item.price}
                    onChange={e => updateItem(ci, ii, { price: Number(e.target.value) || 0 })}
                    placeholder="€"
                  />
                  <button type="button" className="me-item-x" onClick={() => removeItem(ci, ii)} title="Elimina piatto">✕</button>
                </div>
                <textarea
                  className="me-item-desc"
                  value={item.description || ''}
                  onChange={e => updateItem(ci, ii, { description: e.target.value })}
                  placeholder="Descrizione (opzionale) — gli ingredienti, lo stile..."
                  rows={2}
                />
                <div className="me-allergens">
                  {ALLERGENS.map(a => {
                    const active = item.allergens?.includes(a.key)
                    return (
                      <span
                        key={a.key}
                        className={`me-all ${active ? 'on' : ''}`}
                        onClick={() => toggleAllergen(ci, ii, a.key)}
                        style={active ? { background: a.color, boxShadow: `0 4px 12px ${a.color}40` } : undefined}
                      >
                        {a.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button type="button" className="me-tool" onClick={() => addItem(ci)}>+ Aggiungi piatto</button>
            </div>
          </div>
        ))}

        <div className="me-addcat-row">
          <button type="button" className="me-addcat" onClick={addCategory}>+ Aggiungi categoria</button>
        </div>
      </div>

      <div className="me-savebar">
        {feedback && <span className={`me-feedback ${feedback.ok ? 'me-feedback-ok' : 'me-feedback-err'}`}>{feedback.msg}</span>}
        <button type="button" className="me-save" onClick={save} disabled={pending}>
          {pending ? 'Salvataggio...' : 'Salva menu'}
        </button>
      </div>
    </div>
  )
}

function emptyCategory(): MenuCategoryDTO {
  return { name: '', description: '', items: [{ name: '', description: '', price: 0, allergens: [] }] }
}
