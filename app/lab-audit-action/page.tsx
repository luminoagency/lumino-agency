import { FeatureSection } from '@/lib/lab-library/features/feature-section';
import { Calendar } from '@/lib/lab-library/booking/calendar';
import { Contact } from '@/lib/lab-library/form/contact';

const BUSINESSES = [
  {
    label: 'RISTORANTE',
    palette: { bg: '#FAF7F2', ink: '#2A1F1A', accent: '#A0522D', muted: '#E8DDD0' },
    feature: {
      title: 'Cosa offriamo', highlight: 'Dal 1962', layout: 'grid',
      features: [
        { title: 'Cucina genuina', subtitle: 'Ricette della tradizione milanese', icon: 'ChefHat' },
        { title: 'Prodotti locali', subtitle: 'Materie prime selezionate ogni giorno', icon: 'Wheat' },
        { title: 'Cantina selezionata', subtitle: 'Vini del territorio lombardo', icon: 'Wine' },
        { title: 'Aperto la domenica', subtitle: 'Pranzo e cena tutti i weekend', icon: 'Calendar' },
      ],
    },
    calendar: { title: 'Prenota un tavolo', layout: 'card', bookingUrl: '#', contactPhone: '02 1234567', availableDays: ['mar', 'mer', 'gio', 'ven', 'sab', 'dom'], closedMessage: 'Chiuso il lunedì' },
    contact: { layout: 'split', phone: '02 1234567', email: 'info@trattoriamario.it', address: 'Naviglio Grande 12, Milano', hours: 'Mar-Dom 12:00-15:00 / 19:00-23:00', mapsUrl: 'https://maps.google.com' },
  },
  {
    label: 'HOTEL BOUTIQUE',
    palette: { bg: '#F5F1EB', ink: '#1A1A1A', accent: '#8B6F47', muted: '#D9CFC2' },
    feature: {
      title: 'I nostri servizi', highlight: 'Sul Lago di Como', layout: 'autoscroll',
      features: [
        { title: 'Vista lago', subtitle: 'Camere affacciate sull’acqua', icon: 'Mountain' },
        { title: 'Spa & Wellness', subtitle: 'Percorso benessere e massaggi', icon: 'Sparkles' },
        { title: 'Ristorante stellato', subtitle: 'Cucina d’autore', icon: 'Award' },
        { title: 'Servizio 24/7', subtitle: 'Reception sempre attiva', icon: 'Clock' },
        { title: 'Parking gratuito', subtitle: 'Posto auto riservato', icon: 'Car' },
        { title: 'Pet friendly', subtitle: 'I tuoi amici a 4 zampe benvenuti', icon: 'PawPrint' },
      ],
    },
    calendar: { title: 'Prenota la tua camera', layout: 'split', bookingUrl: 'https://booking.com/villaserena', availableDays: ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'], duration: 'soggiorno' },
    contact: { layout: 'stacked', phone: '031 987654', email: 'info@villaserena.it', address: 'Via Regina 5, Lago di Como', hours: 'Reception 24/7' },
  },
  {
    label: 'BARBIERE MODERNO',
    palette: { bg: '#1A1A1A', ink: '#F5F5F5', accent: '#D4AF37', muted: '#2A2A2A' },
    feature: {
      title: 'I servizi', highlight: 'Brera, Milano', layout: 'list',
      features: [
        { title: 'Taglio uomo', subtitle: 'Consulenza e styling', icon: 'Scissors' },
        { title: 'Barba', subtitle: 'Rifinitura e cura', icon: 'User' },
        { title: 'Beard styling', subtitle: 'Modellatura su misura', icon: 'Sparkles' },
        { title: 'Walk-in welcome', subtitle: 'Senza appuntamento', icon: 'DoorOpen' },
      ],
    },
    calendar: { title: 'Prenota online', layout: 'card', bookingUrl: 'https://cal.com/barberlab', availableDays: ['mar', 'mer', 'gio', 'ven', 'sab'], closedMessage: 'Chiuso lunedì e domenica' },
    contact: { layout: 'centered', phone: '02 5566778', email: 'ciao@barberlab.it', address: 'Via Brera 8, Milano', hours: 'Mar-Sab 10:00-20:00' },
  },
  {
    label: 'STUDIO DENTISTICO',
    palette: { bg: '#FFFFFF', ink: '#0F2547', accent: '#3B82F6', muted: '#EFF6FF' },
    feature: {
      title: 'Cosa offriamo', highlight: 'Dal 1995', layout: 'grid',
      features: [
        { title: 'Igiene professionale', subtitle: 'Pulizia e prevenzione', icon: 'Sparkles' },
        { title: 'Ortodonzia invisibile', subtitle: 'Allineatori trasparenti', icon: 'Smile' },
        { title: 'Implantologia', subtitle: 'Soluzioni fisse e durature', icon: 'Settings' },
        { title: 'Emergenze H24', subtitle: 'Reperibilità per urgenze', icon: 'Phone' },
        { title: 'Pagamenti rateizzati', subtitle: 'Piani su misura', icon: 'CreditCard' },
      ],
    },
    calendar: { title: 'Fissa una visita', layout: 'split', contactPhone: '02 3344556', availableDays: ['lun', 'mar', 'mer', 'gio', 'ven'], duration: '45 minuti' },
    contact: { layout: 'split', phone: '02 3344556', email: 'info@studiobianchi.it', address: 'Corso Buenos Aires 20, Milano', hours: 'Lun-Ven 8:30-19:00', privacyUrl: '/privacy' },
  },
];

function BizBanner({ label, palette }: { label: string; palette: { bg: string; ink: string; accent: string; muted: string } }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-blue-900 px-6 py-4 text-white">
      <h2 className="font-mono text-base font-bold tracking-wider">{label}</h2>
      <div className="flex items-center gap-2">
        {(['bg', 'ink', 'accent', 'muted'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-blue-100">
            <span className="inline-block h-5 w-5 rounded border border-white/30" style={{ background: palette[k] }} />
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

export default function LabAuditAction() {
  return (
    <div className="bg-zinc-900">
      {BUSINESSES.map((b) => {
        const p = b.palette;
        return (
          <section key={b.label}>
            <BizBanner label={b.label} palette={p} />

            <CompBanner text={`${b.label} — features/feature-section (layout ${b.feature.layout})`} />
            <FeatureSection title={b.feature.title} highlight={b.feature.highlight} features={b.feature.features} layout={b.feature.layout as any} palette={p} />

            <CompBanner text={`${b.label} — booking/calendar (layout ${b.calendar.layout})`} />
            <Calendar {...(b.calendar as any)} palette={p} />

            <CompBanner text={`${b.label} — form/contact (layout ${b.contact.layout})`} />
            <Contact {...(b.contact as any)} palette={p} />
          </section>
        );
      })}
    </div>
  );
}
