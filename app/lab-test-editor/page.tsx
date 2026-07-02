import Step4Editor from '@/app/lumino-admin/lab/Step4Editor';
import { normalizeBuild } from '@/lib/lab/builder';
import fs from 'fs';
import path from 'path';

export default function LabTestEditor() {
  const outputPath = path.join(process.cwd(), 'scripts', 'last-smoke-output.json');

  if (!fs.existsSync(outputPath)) {
    return (
      <div className="p-8 bg-zinc-950 text-zinc-100 min-h-screen">
        <h1 className="text-2xl font-bold">Nessun output disponibile</h1>
        <p>Esegui prima: npx tsx scripts/test-lab-smoke.ts</p>
      </div>
    );
  }

  const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  const build = normalizeBuild(data.build || data);
  const businessName = build.globalConfig.businessName || data.research?.info?.name || 'Trattoria Mario';

  const businessType = data.research?.info?.type || 'ristorante';
  return <Step4Editor projectId="test-no-db" build={build} businessName={businessName} businessType={businessType} />;
}
