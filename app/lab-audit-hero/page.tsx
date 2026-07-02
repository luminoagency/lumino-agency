import { AuroraHero } from '@/lib/lab-library/hero/aurora-hero';
import { FloatingFoodHero } from '@/lib/lab-library/hero/floating-food-hero';
import { PixelHero } from '@/lib/lab-library/hero/pixel-hero';

const BUSINESSES = [
  {
    label: 'RISTORANTE',
    palette: { bg: '#FAF7F2', ink: '#2A1F1A', accent: '#A0522D', muted: '#E8DDD0' },
    data: {
      title: 'Trattoria Mario',
      subtitle: 'Cucina milanese dal 1962',
      description: 'Sui Navigli serviamo i piatti della tradizione: ossobuco, risotto allo zafferano, cotoletta.',
      primaryCta: { label: 'Prenota un tavolo' },
      secondaryCta: { label: 'Scopri il menu' },
      images: [
        { src: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', alt: 'Pasta' },
        { src: 'https://images.unsplash.com/photo-1572715376701-98568319fd0b?w=800&q=80', alt: 'Pizza' },
        { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', alt: 'Sala' },
        { src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', alt: 'Piatto' },
      ],
    },
  },
  {
    label: 'HOTEL BOUTIQUE',
    palette: { bg: '#F5F1EB', ink: '#1A1A1A', accent: '#8B6F47', muted: '#D9CFC2' },
    data: {
      title: 'Hotel Villa Serena',
      subtitle: 'Charme e relax sul Lago di Como',
      description: '12 camere uniche affacciate sul lago. Spa, ristorante stellato e servizio impeccabile dal 1987.',
      primaryCta: { label: 'Prenota la tua camera' },
      secondaryCta: { label: 'Scopri la spa' },
      images: [
        { src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80', alt: 'Camera' },
        { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', alt: 'Hotel' },
        { src: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80', alt: 'Spa' },
        { src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', alt: 'Lago' },
      ],
    },
  },
  {
    label: 'BARBIERE MODERNO',
    palette: { bg: '#1A1A1A', ink: '#F5F5F5', accent: '#D4AF37', muted: '#2A2A2A' },
    data: {
      title: 'BARBER LAB',
      subtitle: 'Il barbiere che cercavi',
      description: 'Taglio uomo, rasatura tradizionale, beard styling. Brera, Milano. Prenotazione online o walk-in.',
      primaryCta: { label: 'Prenota online' },
      secondaryCta: { label: 'Il nostro stile' },
      images: [
        { src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80', alt: 'Taglio' },
        { src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80', alt: 'Barbiere' },
        { src: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80', alt: 'Sedia' },
        { src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80', alt: 'Stile' },
      ],
    },
  },
  {
    label: 'STUDIO DENTISTICO',
    palette: { bg: '#FFFFFF', ink: '#0F2547', accent: '#3B82F6', muted: '#EFF6FF' },
    data: {
      title: 'Studio Dentistico Bianchi',
      subtitle: 'Cura del sorriso dal 1995',
      description: "Implantologia, ortodonzia invisibile, igiene e prevenzione. Tecnologie all'avanguardia e ambiente accogliente.",
      primaryCta: { label: 'Fissa una visita' },
      secondaryCta: { label: 'I nostri servizi' },
      images: [
        { src: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80', alt: 'Studio' },
        { src: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80', alt: 'Cure' },
        { src: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80', alt: 'Sorriso' },
        { src: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80', alt: 'Visita' },
      ],
    },
  },
];

// Variante migliore per ogni (business, hero), scelta autonomamente in base a tono/palette.
type Pick = { layout: any; tone: any; size?: any };
const PICKS: Record<string, { aurora: Pick; food: Pick; pixel: Pick }> = {
  RISTORANTE: {
    aurora: { layout: 'left', tone: 'classic' },
    food: { layout: 'split', tone: 'classic' },
    pixel: { layout: 'centered', tone: 'classic' },
  },
  'HOTEL BOUTIQUE': {
    aurora: { layout: 'centered', tone: 'editorial', size: 'spacious' },
    food: { layout: 'centered', tone: 'classic', size: 'spacious' },
    pixel: { layout: 'left', tone: 'editorial' },
  },
  'BARBIERE MODERNO': {
    aurora: { layout: 'centered', tone: 'modern' },
    food: { layout: 'centered', tone: 'modern', size: 'spacious' },
    pixel: { layout: 'centered', tone: 'modern' },
  },
  'STUDIO DENTISTICO': {
    aurora: { layout: 'left', tone: 'modern' },
    food: { layout: 'split', tone: 'modern' },
    pixel: { layout: 'centered', tone: 'modern', size: 'compact' },
  },
};

function BigBanner({ label, palette }: { label: string; palette: { bg: string; ink: string; accent: string; muted: string } }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-zinc-950 px-6 py-4 text-zinc-100">
      <h2 className="font-mono text-base font-bold tracking-wider">{label}</h2>
      <div className="flex items-center gap-2">
        {(['bg', 'ink', 'accent', 'muted'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="inline-block h-5 w-5 rounded border border-white/20" style={{ background: palette[k] }} />
            {palette[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompBanner({ text }: { text: string }) {
  return <div className="bg-amber-100 border-y border-amber-300 px-6 py-2 text-sm font-mono text-amber-900">{text}</div>;
}

export default function LabAuditHero() {
  return (
    <div className="bg-zinc-900">
      {BUSINESSES.map((b) => {
        const pick = PICKS[b.label];
        return (
          <section key={b.label}>
            <BigBanner label={b.label} palette={b.palette} />

            <CompBanner text={`${b.label} — hero/aurora-hero (${pick.aurora.layout}/${pick.aurora.tone}${pick.aurora.size ? '/' + pick.aurora.size : ''})`} />
            <AuroraHero {...b.data} palette={b.palette} layout={pick.aurora.layout} tone={pick.aurora.tone} size={pick.aurora.size} />

            <CompBanner text={`${b.label} — hero/floating-food-hero (${pick.food.layout}/${pick.food.tone}${pick.food.size ? '/' + pick.food.size : ''})`} />
            <FloatingFoodHero {...b.data} palette={b.palette} layout={pick.food.layout} tone={pick.food.tone} size={pick.food.size} />

            <CompBanner text={`${b.label} — hero/pixel-hero (${pick.pixel.layout}/${pick.pixel.tone}${pick.pixel.size ? '/' + pick.pixel.size : ''})`} />
            <PixelHero {...b.data} palette={b.palette} layout={pick.pixel.layout} tone={pick.pixel.tone} size={pick.pixel.size} />
          </section>
        );
      })}
    </div>
  );
}
