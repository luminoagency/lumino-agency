import React, { useEffect, useRef } from 'react';

const BentoItem = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      item.style.setProperty('--mouse-x', `${x}px`);
      item.style.setProperty('--mouse-y', `${y}px`);
    };
    item.addEventListener('mousemove', handleMouseMove);
    return () => item.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return <div ref={itemRef} className={`bento-item ${className || ''}`}>{children}</div>;
};

export const CyberneticBentoGrid = () => {
  return (
    <>
      <style>{`
        .main-container { min-height: 100vh; background: #0a0a0a; display: flex; align-items: center; justify-content: center; padding: 4rem 1rem; }
        .bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 180px; gap: 1rem; }
        .bento-item { position: relative; padding: 1.5rem; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 1rem; overflow: hidden; }
        .bento-item::before { content: ''; position: absolute; inset: 0; background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(99,102,241,0.15), transparent 40%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .bento-item:hover::before { opacity: 1; }
        @media (max-width: 768px) { .bento-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="main-container">
        <div className="w-full max-w-6xl z-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8">Funzionalità chiave</h1>
          <div className="bento-grid">
            <BentoItem className="col-span-2 row-span-2 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Analytics in tempo reale</h2>
                <p className="mt-2 text-gray-400">Monitora le performance con visualizzazioni live.</p>
              </div>
              <div className="mt-4 h-48 bg-neutral-800 rounded-lg flex items-center justify-center text-gray-500">Chart Placeholder</div>
            </BentoItem>
            <BentoItem>
              <h2 className="text-xl font-bold text-white">CDN Globale</h2>
              <p className="mt-2 text-gray-400 text-sm">Velocità di consegna ovunque.</p>
            </BentoItem>
            <BentoItem>
              <h2 className="text-xl font-bold text-white">Auth Sicuro</h2>
              <p className="mt-2 text-gray-400 text-sm">Sicurezza enterprise integrata.</p>
            </BentoItem>
            <BentoItem className="row-span-2">
              <h2 className="text-xl font-bold text-white">Backup Automatici</h2>
              <p className="mt-2 text-gray-400 text-sm">I tuoi dati sempre al sicuro.</p>
            </BentoItem>
            <BentoItem className="col-span-2">
              <h2 className="text-xl font-bold text-white">Serverless</h2>
              <p className="mt-2 text-gray-400 text-sm">Scala infinitamente, zero gestione.</p>
            </BentoItem>
            <BentoItem>
              <h2 className="text-xl font-bold text-white">CLI Tool</h2>
              <p className="mt-2 text-gray-400 text-sm">Gestisci tutto dalla riga di comando.</p>
            </BentoItem>
          </div>
        </div>
      </div>
    </>
  );
};
