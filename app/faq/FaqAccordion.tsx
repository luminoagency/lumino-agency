'use client'

import { useState } from 'react'

export interface FaqItem {
  q: string
  a: React.ReactNode
}

export interface FaqGroup {
  title: string
  items: FaqItem[]
}

export default function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="fa">
      <style dangerouslySetInnerHTML={{ __html: `
        .fa { display: flex; flex-direction: column; gap: 36px; }
        .fa-group-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.7rem; font-weight: 400; color: #fff; margin: 0 0 14px; }
        .fa-item { border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.025); margin-bottom: 10px; overflow: hidden; transition: border-color 0.2s; }
        .fa-item.open { border-color: rgba(167,139,250,0.35); }
        .fa-q { width: 100%; text-align: left; background: transparent; border: 0; cursor: pointer; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; color: #fff; font-size: 15.5px; font-weight: 600; font-family: inherit; }
        .fa-icon { flex-shrink: 0; width: 22px; height: 22px; position: relative; transition: transform 0.3s; }
        .fa-icon::before, .fa-icon::after { content: ''; position: absolute; top: 50%; left: 50%; background: #a78bfa; border-radius: 2px; transform: translate(-50%,-50%); }
        .fa-icon::before { width: 13px; height: 2px; }
        .fa-icon::after { width: 2px; height: 13px; transition: transform 0.3s; }
        .fa-item.open .fa-icon::after { transform: translate(-50%,-50%) scaleY(0); }
        .fa-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s cubic-bezier(0.22,1,0.36,1); }
        .fa-item.open .fa-a { grid-template-rows: 1fr; }
        .fa-a-inner { overflow: hidden; min-height: 0; padding: 0 22px 20px; color: rgba(255,255,255,0.66); font-size: 14px; line-height: 1.65; }
        .fa-a-inner a { color: #a78bfa; }
      ` }} />

      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="fa-group-title">{g.title}</h2>
          {g.items.map((item) => {
            const id = `${g.title}::${item.q}`
            const isOpen = open === id
            return (
              <div key={id} className={`fa-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="fa-q"
                  onClick={() => setOpen(isOpen ? null : id)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span className="fa-icon" aria-hidden />
                </button>
                <div className="fa-a">
                  <div className="fa-a-inner">{item.a}</div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
