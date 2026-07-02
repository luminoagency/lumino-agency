import { extractResearch } from '../lib/lab/research';
import { generateLayouts } from '../lib/lab/layout';
import { generatePage, paletteRoles } from '../lib/lab/builder';
import { localesForBusiness } from '../lib/lab/layout';

// Carica .env.local (stesso pattern del test-opus-4-7.ts)
import fs from 'fs';
import path from 'path';
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  env.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

async function main() {
  console.log('🧪 SMOKE TEST LAB (multi-pagina) — Trattoria Mario, Milano\n');

  const fakeInput = {
    businessName: 'Trattoria Mario',
    businessType: 'ristorante',
    location: 'Milano, Italia',
    rawText: `Trattoria Mario è un ristorante tradizionale milanese in zona Navigli, aperto dal 1962. Specialità: ossobuco, risotto alla milanese, cotoletta. Tono familiare ma curato. Aperto dal martedì alla domenica, pranzo 12-15 e cena 19-23. Telefono 02-1234567. Foto: 3 disponibili (sala interna, pasta fresca, dehors). Logo presente.`,
  };

  try {
    // STEP 1
    console.log('📖 STEP 1: extractResearch...');
    const research = await extractResearch({
      businessName: fakeInput.businessName,
      businessType: fakeInput.businessType,
      source: fakeInput.rawText,
      place: null,
    });
    console.log('✅ Research:', research.info?.name, '·', research.info?.type);
    console.log('🎨 Tono:', research.toneOfVoice);
    console.log('');

    // STEP 2 — Layout multi-pagina
    console.log('🎨 STEP 2: generateLayouts (multi-pagina)...');
    const layouts = await generateLayouts(research as any);
    console.log(`✅ ${layouts.length} layout proposti:`);
    layouts.forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.name} — pagine: ${l.pages.map(p => p.slug).join(', ')}`);
    });
    console.log('');

    // STEP 3 — Genera TUTTE le pagine del primo layout
    const chosenLayout = layouts[0];
    const pagesSpec = chosenLayout.pages;
    const totalSpecSections = pagesSpec.reduce((n, p) => n + p.sections.length, 0);
    console.log(`🔨 STEP 3: genero ${pagesSpec.length} pagine (${totalSpecSections} sezioni) del layout "${chosenLayout.name}"...\n`);

    const builtPages = [];
    for (const pageSpec of pagesSpec) {
      console.log(`  📄 "${pageSpec.title}" (${pageSpec.slug}) — ${pageSpec.sections.length} sezioni`);
      const page = await generatePage({
        page: pageSpec,
        businessName: fakeInput.businessName,
        businessType: fakeInput.businessType,
        research: research as any,
        layout: chosenLayout,
      });
      page.sections.forEach(s => {
        if (s.type === 'library') console.log(`    ✅ ${s.sectionKey} → ${s.component}`);
        else console.log(`    ⚠️ ${s.sectionKey} → custom (base: ${s.baseComponent || '—'})`);
      });
      builtPages.push(page);
      console.log('');
    }

    const roles = paletteRoles(chosenLayout.palette);
    const palette = {
      bg: roles.bg, ink: roles.ink, accent: roles.accent,
      muted: chosenLayout.palette[3] || (roles.isDark ? '#222222' : '#f5f5f5'),
    };
    const build = {
      pages: builtPages,
      globalConfig: { palette, businessName: fakeInput.businessName },
      navigation: chosenLayout.navigation,
      locales: localesForBusiness(fakeInput.businessType),
      defaultLocale: 'it',
      generatedAt: new Date().toISOString(),
    };

    const allSections = builtPages.flatMap(p => p.sections);
    const fromLibrary = allSections.filter(s => s.type === 'library').length;
    const custom = allSections.filter(s => s.type === 'custom').length;

    console.log('\n📊 RIEPILOGO:');
    console.log(`  Pagine: ${builtPages.length} (${builtPages.map(p => p.slug).join(', ')})`);
    console.log(`  Sezioni totali: ${allSections.length}`);
    console.log(`  Da libreria: ${fromLibrary}`);
    console.log(`  Custom: ${custom}`);

    fs.writeFileSync(
      path.join(process.cwd(), 'scripts', 'last-smoke-output.json'),
      JSON.stringify({ research, layouts, chosenLayout, build }, null, 2)
    );
    console.log('\n💾 Output completo salvato in scripts/last-smoke-output.json');
    console.log('\n✅ TEST COMPLETATO');
  } catch (error: any) {
    console.error('\n❌ ERRORE durante il test:');
    console.error('Message:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();
