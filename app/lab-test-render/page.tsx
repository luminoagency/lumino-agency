import React from 'react';
import { RenderPage } from '@/lib/lab/render';
import { normalizeBuild } from '@/lib/lab/builder';
import fs from 'fs';
import path from 'path';

export default function LabTestRender() {
  const outputPath = path.join(process.cwd(), 'scripts', 'last-smoke-output.json');

  if (!fs.existsSync(outputPath)) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Nessun output disponibile</h1>
        <p>Esegui prima: npx tsx scripts/test-lab-smoke.ts</p>
      </div>
    );
  }

  const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  const build = normalizeBuild(data.build || data);
  const businessName = build.globalConfig.businessName || data.research?.info?.name || 'Test';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-yellow-300 bg-yellow-100 px-6 py-3 text-sm">
        <strong>🧪 LAB TEST RENDER (multi-pagina)</strong> — {businessName} — Layout: <em>{data.chosenLayout?.name}</em> — {build.pages.length} pagine
      </header>
      <main className="flex flex-col">
        {build.pages.map((page) => (
          <div key={page.slug}>
            <div className="border-y border-zinc-300 bg-zinc-100 px-6 py-2 text-xs font-mono text-zinc-700">
              📄 {page.title} <span className="opacity-50">/{page.slug}</span> — {page.sections.length} sezioni
            </div>
            <RenderPage page={page} globalConfig={build.globalConfig} navigation={build.navigation} />
          </div>
        ))}
      </main>
    </div>
  );
}
