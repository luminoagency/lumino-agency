import { AuroraHero } from '@/lib/lab-library/hero/aurora-hero';
import { FloatingFoodHero } from '@/lib/lab-library/hero/floating-food-hero';
import { PixelHero } from '@/lib/lab-library/hero/pixel-hero';
import { About3 } from '@/lib/lab-library/about/about-3';
import { MenuItemCard } from '@/lib/lab-library/menu/menu-item-card';
import { FeatureSection } from '@/lib/lab-library/features/feature-section';
import { FeatureCarousel } from '@/lib/lab-library/features/feature-carousel';
import { FeatureHighlight } from '@/lib/lab-library/features/feature-highlight';
import { TestimonialCarousel } from '@/lib/lab-library/testimonial/testimonial-carousel';
import { ClientFeedback } from '@/lib/lab-library/testimonial/client-feedback';
import { Calendar } from '@/lib/lab-library/booking/calendar';
import { Contact } from '@/lib/lab-library/form/contact';
import { SiteFooter } from '@/lib/lab-library/footer/site-footer';

const U = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80`;
const IMGS = [U('photo-1551183053-bf91a1d81141'), U('photo-1414235077428-338989a2e8c0'), U('photo-1565299624946-b28f40a0ae38'), U('photo-1572715376701-98568319fd0b')];

type Biz = {
  label: string;
  palette: { bg: string; ink: string; accent: string; muted: string };
  hero: { title: string; subtitle: string; description: string; primaryCta: { label: string }; secondaryCta: { label: string } };
  tone: any;
  about: any;
  menuTitle: string;
  items: any[];
  featureSection: any;
  featureCarousel: any;
  featureHighlight: any;
  testimonials: any[];
  feedback: any[];
  calendar: any;
  contact: any;
  footer: any;
};

const imgs = (alt: string) => IMGS.map((src, i) => ({ src, alt: `${alt} ${i + 1}` }));

const BUSINESSES: Biz[] = [
  {
    label: 'RISTORANTE',
    palette: { bg: '#FAF7F2', ink: '#2A1F1A', accent: '#A0522D', muted: '#E8DDD0' },
    tone: 'classic',
    hero: { title: 'Trattoria Mario', subtitle: 'Cucina milanese dal 1962', description: 'Sui Navigli i piatti della tradizione: ossobuco, risotto allo zafferano, cotoletta.', primaryCta: { label: 'Prenota un tavolo' }, secondaryCta: { label: 'Scopri il menu' } },
    about: { title: 'La nostra storia', description: 'Dal 1962 la famiglia Mario porta in tavola la vera cucina milanese.', mainImage: { src: IMGS[1], alt: 'Sala' }, secondaryImage: { src: IMGS[0], alt: 'Pasta' }, breakout: { title: 'Cucina del territorio', description: 'Materie prime lombarde, ogni giorno.' }, achievements: [{ label: 'Anni', value: '60+' }, { label: 'Coperti', value: '80' }, { label: 'Ricette', value: '40+' }] },
    menuTitle: 'Il menu',
    items: [
      { name: 'Ossobuco alla milanese', description: 'Con risotto giallo', price: 22, prepTime: 40, featured: true, image: { src: IMGS[2], alt: 'Ossobuco' } },
      { name: 'Risotto allo zafferano', description: 'Carnaroli, midollo', price: 16, isVegetarian: true, image: { src: IMGS[0], alt: 'Risotto' } },
      { name: 'Cotoletta alla milanese', description: 'Alta, con osso', price: 20, image: { src: IMGS[3], alt: 'Cotoletta' } },
      { name: 'Tiramisù della casa', description: 'Mascarpone e caffè', price: 8, isVegetarian: true, image: { src: IMGS[1], alt: 'Dolce' } },
    ],
    featureSection: { title: 'Cosa offriamo', highlight: 'Dal 1962', layout: 'grid', features: [{ title: 'Cucina genuina', subtitle: 'Tradizione milanese', icon: 'ChefHat' }, { title: 'Prodotti locali', subtitle: 'Ogni giorno', icon: 'Wheat' }, { title: 'Cantina selezionata', subtitle: 'Vini del territorio', icon: 'Wine' }, { title: 'Aperto la domenica', subtitle: 'Pranzo e cena', icon: 'Calendar' }] },
    featureCarousel: { title: 'Gli ambienti', layout: 'split', features: [{ id: 'a', label: 'La sala', icon: 'Utensils', image: { src: IMGS[1], alt: 'Sala' }, description: 'Atmosfera familiare e curata.' }, { id: 'b', label: 'La cucina', icon: 'ChefHat', image: { src: IMGS[0], alt: 'Cucina' }, description: 'Pasta fresca fatta in casa.' }, { id: 'c', label: 'Il dehors', icon: 'Sun', image: { src: IMGS[2], alt: 'Dehors' }, description: 'Tavoli all’aperto sui Navigli.' }] },
    featureHighlight: { title: 'Perché sceglierci', icon: 'Award', features: ['Ricette storiche dal 1962', 'Ingredienti del mercato', 'Cantina con 120 etichette', 'Servizio attento e familiare'], footer: 'Vi aspettiamo sui Navigli.' },
    testimonials: [{ quote: 'L’ossobuco migliore di Milano.', author: 'Giulia Ferrari', role: 'Cliente', rating: 5 }, { quote: 'Risotto da applausi, torno sempre.', author: 'Marco Colombo', role: 'Food blogger', rating: 5 }, { quote: 'Tradizione vera e prezzi onesti.', author: 'Elena Rizzo', role: 'Cliente', rating: 4 }],
    feedback: [{ quote: 'Come a casa della nonna.', author: 'Paolo B.', role: 'Cliente', accent: true }, { quote: 'Cotoletta perfetta.', author: 'Sara M.', role: 'Cliente' }, { quote: 'Cantina eccezionale.', author: 'Luca T.', role: 'Sommelier' }, { quote: 'Servizio impeccabile.', author: 'Anna V.', role: 'Cliente' }],
    calendar: { title: 'Prenota un tavolo', layout: 'card', bookingUrl: '#', contactPhone: '02 1234567', availableDays: ['mar', 'mer', 'gio', 'ven', 'sab', 'dom'], closedMessage: 'Chiuso il lunedì' },
    contact: { layout: 'split', phone: '02 1234567', email: 'info@trattoriamario.it', address: 'Naviglio Grande 12, Milano', hours: 'Mar-Dom 12-15 / 19-23', mapsUrl: 'https://maps.google.com' },
    footer: { businessName: 'Trattoria Mario', description: 'Cucina milanese dal 1962.', columns: [{ title: 'Menu', links: [{ label: 'Antipasti', href: '#' }, { label: 'Primi', href: '#' }, { label: 'Dolci', href: '#' }] }, { title: 'Info', links: [{ label: 'Chi siamo', href: '#' }, { label: 'Contatti', href: '#' }] }], socials: [{ platform: 'instagram', url: '#' }, { platform: 'facebook', url: '#' }], email: 'info@trattoriamario.it', phone: '02 1234567', address: 'Naviglio Grande 12, Milano', newsletter: { enabled: true }, legalLinks: [{ label: 'Privacy', href: '/privacy' }, { label: 'Cookie', href: '/cookie' }] },
  },
  {
    label: 'HOTEL BOUTIQUE',
    palette: { bg: '#F5F1EB', ink: '#1A1A1A', accent: '#8B6F47', muted: '#D9CFC2' },
    tone: 'editorial',
    hero: { title: 'Hotel Villa Serena', subtitle: 'Sul Lago di Como dal 1987', description: 'Dodici camere uniche, spa e ristorante stellato in un rifugio di charme.', primaryCta: { label: 'Prenota la camera' }, secondaryCta: { label: 'Scopri la spa' } },
    about: { title: 'Villa Serena', description: 'Dal 1987 ospitalità di charme affacciata sul lago.', mainImage: { src: IMGS[1], alt: 'Hotel' }, breakout: { title: 'Spa & benessere', description: 'Percorso benessere con vista lago.' }, achievements: [{ label: 'Camere', value: '12' }, { label: 'Anni', value: '37' }, { label: 'Premi', value: '8' }] },
    menuTitle: 'Camere & servizi',
    items: [
      { name: 'Camera Standard', description: '22 m², colazione inclusa', price: 120, layout: 'list', image: { src: IMGS[1], alt: 'Camera' } },
      { name: 'Suite vista lago', description: '45 m², terrazza privata', price: 280, featured: true, image: { src: IMGS[2], alt: 'Suite' } },
      { name: 'Spa Day', description: 'Percorso + massaggio', price: 80, image: { src: IMGS[3], alt: 'Spa' } },
      { name: 'Cena gourmet', description: 'Degustazione 5 portate', price: 65, image: { src: IMGS[0], alt: 'Cena' } },
    ],
    featureSection: { title: 'I nostri servizi', highlight: 'Lago di Como', layout: 'autoscroll', features: [{ title: 'Vista lago', subtitle: 'Camere sull’acqua', icon: 'Mountain' }, { title: 'Spa & Wellness', subtitle: 'Massaggi', icon: 'Sparkles' }, { title: 'Ristorante stellato', subtitle: 'Cucina d’autore', icon: 'Award' }, { title: 'Servizio 24/7', subtitle: 'Sempre attivo', icon: 'Clock' }, { title: 'Parking', subtitle: 'Gratuito', icon: 'Car' }, { title: 'Pet friendly', subtitle: 'Benvenuti', icon: 'PawPrint' }] },
    featureCarousel: { title: 'Esperienze', layout: 'split', autoplay: true, features: [{ id: 'a', label: 'Le camere', icon: 'BedDouble', image: { src: IMGS[1], alt: 'Camera' }, description: 'Dodici stanze uniche.' }, { id: 'b', label: 'La spa', icon: 'Sparkles', image: { src: IMGS[3], alt: 'Spa' }, description: 'Relax con vista.' }, { id: 'c', label: 'Il ristorante', icon: 'Utensils', image: { src: IMGS[0], alt: 'Ristorante' }, description: 'Cucina stellata.' }] },
    featureHighlight: { title: 'Incluso nel soggiorno', icon: 'PackageCheck', layout: 'inline', features: ['Colazione a buffet', 'Accesso spa', 'Wi-Fi gratuito', 'Parcheggio privato', 'Late check-out su richiesta', 'Concierge dedicato'], footer: 'Tutto incluso, nessun costo nascosto.' },
    testimonials: [{ quote: 'Una fuga perfetta sul lago.', author: 'Francesca De Luca', role: 'Ospite', rating: 5 }, { quote: 'La suite è un sogno.', author: 'Alberto Greco', role: 'Ospite', rating: 5 }, { quote: 'Eleganza e cucina top.', author: 'Chiara Moretti', role: 'Ospite', rating: 4 }],
    feedback: [{ quote: 'Servizio impeccabile.', author: 'Marta R.', role: 'Ospite', accent: true }, { quote: 'Spa rilassante.', author: 'Giorgio P.', role: 'Ospite' }, { quote: 'Vista mozzafiato.', author: 'Lucia F.', role: 'Ospite' }, { quote: 'Torneremo di sicuro.', author: 'Davide C.', role: 'Ospite' }],
    calendar: { title: 'Prenota la tua camera', layout: 'split', bookingUrl: 'https://booking.com/villaserena', availableDays: ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'], duration: 'soggiorno' },
    contact: { layout: 'stacked', phone: '031 987654', email: 'info@villaserena.it', address: 'Via Regina 5, Lago di Como', hours: 'Reception 24/7' },
    footer: { businessName: 'Hotel Villa Serena', description: 'Charme sul Lago di Como.', layout: 'multi-column', columns: [{ title: 'Hotel', links: [{ label: 'Camere', href: '#' }, { label: 'Spa', href: '#' }, { label: 'Ristorante', href: '#' }] }, { title: 'Info', links: [{ label: 'Come arrivare', href: '#' }, { label: 'Contatti', href: '#' }] }], socials: [{ platform: 'instagram', url: '#' }, { platform: 'facebook', url: '#' }], email: 'info@villaserena.it', address: 'Via Regina 5, Lago di Como', newsletter: { enabled: true }, legalLinks: [{ label: 'Privacy', href: '/privacy' }] },
  },
  {
    label: 'BARBIERE MODERNO',
    palette: { bg: '#1A1A1A', ink: '#F5F5F5', accent: '#D4AF37', muted: '#2A2A2A' },
    tone: 'modern',
    hero: { title: 'BARBER LAB', subtitle: 'Il barbiere che cercavi', description: 'Taglio uomo, rasatura tradizionale, beard styling. Brera, Milano.', primaryCta: { label: 'Prenota online' }, secondaryCta: { label: 'Il nostro stile' } },
    about: { title: 'BARBER LAB', description: 'Dieci anni di forbici e stile nel cuore di Brera.', mainImage: { src: IMGS[2], alt: 'Barbiere' }, layout: 'compact', achievements: [{ label: 'Clienti', value: '5000+' }, { label: 'Anni', value: '10' }, { label: 'Tagli', value: '20k+' }] },
    menuTitle: 'I servizi',
    items: [
      { name: 'Taglio uomo', description: 'Consulenza e styling', price: 18, prepTime: 30, layout: 'list', image: { src: IMGS[1], alt: 'Taglio' } },
      { name: 'Taglio + barba', description: 'Completo', price: 25, featured: true, prepTime: 45, image: { src: IMGS[2], alt: 'Taglio e barba' } },
      { name: 'Rasatura tradizionale', description: 'Rasoio a mano libera', price: 15, prepTime: 30, image: { src: IMGS[3], alt: 'Rasatura' } },
      { name: 'Beard styling', description: 'Modellatura barba', price: 20, prepTime: 25, image: { src: IMGS[0], alt: 'Barba' } },
    ],
    featureSection: { title: 'I servizi', highlight: 'Brera, Milano', layout: 'list', features: [{ title: 'Taglio uomo', subtitle: 'Su misura', icon: 'Scissors' }, { title: 'Barba', subtitle: 'Cura e rifinitura', icon: 'User' }, { title: 'Beard styling', subtitle: 'Modellatura', icon: 'Sparkles' }, { title: 'Walk-in welcome', subtitle: 'Senza appuntamento', icon: 'DoorOpen' }] },
    featureCarousel: { title: 'Il nostro stile', layout: 'compact', features: [{ id: 'a', label: 'Classico', icon: 'Scissors', image: { src: IMGS[1], alt: 'Classico' }, description: 'Tagli intramontabili.' }, { id: 'b', label: 'Moderno', icon: 'Sparkles', image: { src: IMGS[2], alt: 'Moderno' }, description: 'Fade e contemporaneo.' }, { id: 'c', label: 'Barba', icon: 'User', image: { src: IMGS[3], alt: 'Barba' }, description: 'Beard styling su misura.' }] },
    featureHighlight: { title: 'Perché BARBER LAB', icon: 'Star', features: ['Barbieri esperti', 'Prodotti premium', 'Prenotazione online', 'Ambiente curato'], footer: 'Walk-in sempre benvenuti.' },
    testimonials: [{ quote: 'Taglio + barba sempre perfetto.', author: 'Davide Conti', role: 'Cliente', rating: 5 }, { quote: 'Rasatura da provare.', author: 'Luca Bianchi', role: 'Cliente', rating: 5 }, { quote: 'Mai un’attesa, top.', author: 'Stefano Marini', role: 'Cliente', rating: 4 }],
    feedback: [{ quote: 'Professionisti veri.', author: 'Andrea G.', role: 'Cliente', accent: true }, { quote: 'Stile impeccabile.', author: 'Matteo L.', role: 'Cliente' }, { quote: 'Atmosfera giusta.', author: 'Simone R.', role: 'Cliente' }, { quote: 'Consigliatissimo.', author: 'Fabio D.', role: 'Cliente' }],
    calendar: { title: 'Prenota online', layout: 'card', bookingUrl: 'https://cal.com/barberlab', availableDays: ['mar', 'mer', 'gio', 'ven', 'sab'], closedMessage: 'Chiuso lunedì e domenica' },
    contact: { layout: 'centered', phone: '02 5566778', email: 'ciao@barberlab.it', address: 'Via Brera 8, Milano', hours: 'Mar-Sab 10-20' },
    footer: { businessName: 'BARBER LAB', description: 'Il barbiere che cercavi, a Brera.', layout: 'minimal', socials: [{ platform: 'instagram', url: '#' }], email: 'ciao@barberlab.it', legalLinks: [{ label: 'Privacy', href: '/privacy' }] },
  },
  {
    label: 'STUDIO DENTISTICO',
    palette: { bg: '#FFFFFF', ink: '#0F2547', accent: '#3B82F6', muted: '#EFF6FF' },
    tone: 'modern',
    hero: { title: 'Studio Dentistico Bianchi', subtitle: 'Cura del sorriso dal 1995', description: 'Implantologia, ortodonzia invisibile, igiene e prevenzione. Tecnologie avanzate.', primaryCta: { label: 'Fissa una visita' }, secondaryCta: { label: 'I nostri servizi' } },
    about: { title: 'Studio Dentistico Bianchi', description: 'Dal 1995 ci prendiamo cura del tuo sorriso con un approccio attento.', mainImage: { src: IMGS[1], alt: 'Studio' }, breakout: { title: 'Prima visita gratuita', description: 'Valutazione e piano di cura.' }, achievements: [{ label: 'Pazienti', value: '3000+' }, { label: 'Anni', value: '30' }, { label: 'Specialisti', value: '4' }] },
    menuTitle: 'I servizi',
    items: [
      { name: 'Igiene e pulizia', description: 'Ablazione tartaro', price: 60, layout: 'minimal' },
      { name: 'Otturazione estetica', description: 'Composito in tinta', price: 100, layout: 'minimal' },
      { name: 'Ortodonzia invisibile', description: 'Allineatori trasparenti', price: 2500, featured: true, layout: 'minimal' },
      { name: 'Implantologia', description: 'Impianto + corona', price: 1800, layout: 'minimal' },
    ],
    featureSection: { title: 'Cosa offriamo', highlight: 'Dal 1995', layout: 'grid', features: [{ title: 'Igiene professionale', subtitle: 'Prevenzione', icon: 'Sparkles' }, { title: 'Ortodonzia invisibile', subtitle: 'Allineatori', icon: 'Smile' }, { title: 'Implantologia', subtitle: 'Soluzioni fisse', icon: 'Settings' }, { title: 'Emergenze H24', subtitle: 'Reperibilità', icon: 'Phone' }, { title: 'Pagamenti rateizzati', subtitle: 'Su misura', icon: 'CreditCard' }] },
    featureCarousel: { title: 'Il percorso di cura', layout: 'split', features: [{ id: 'a', label: 'Visita', icon: 'Stethoscope', image: { src: IMGS[1], alt: 'Visita' }, description: 'Valutazione completa.' }, { id: 'b', label: 'Cura', icon: 'Settings', image: { src: IMGS[2], alt: 'Cura' }, description: 'Piano personalizzato.' }, { id: 'c', label: 'Sorriso', icon: 'Smile', image: { src: IMGS[3], alt: 'Sorriso' }, description: 'Risultato duraturo.' }] },
    featureHighlight: { title: 'Il nostro approccio', icon: 'ShieldCheck', layout: 'inline', features: ['Tecnologie all’avanguardia', 'Ambiente accogliente', 'Prima visita gratuita', 'Pagamenti rateizzati', 'Emergenze H24', 'Team di specialisti'], footer: 'Il tuo sorriso, le nostre cure.' },
    testimonials: [{ quote: 'Mi hanno messo a mio agio.', author: 'Paola Esposito', role: 'Paziente', rating: 5 }, { quote: 'Ortodonzia, risultato perfetto.', author: 'Roberto Galli', role: 'Paziente', rating: 5 }, { quote: 'Studio modernissimo.', author: 'Sara Fontana', role: 'Paziente', rating: 5 }],
    feedback: [{ quote: 'Finalmente un dentista di cui fidarsi.', author: 'Elena P.', role: 'Paziente', accent: true }, { quote: 'Personale gentile.', author: 'Marco T.', role: 'Paziente' }, { quote: 'Puntuali e precisi.', author: 'Giulia N.', role: 'Paziente' }, { quote: 'Consigliato a tutti.', author: 'Andrea S.', role: 'Paziente' }],
    calendar: { title: 'Fissa una visita', layout: 'split', contactPhone: '02 3344556', availableDays: ['lun', 'mar', 'mer', 'gio', 'ven'], duration: '45 minuti' },
    contact: { layout: 'split', phone: '02 3344556', email: 'info@studiobianchi.it', address: 'Corso Buenos Aires 20, Milano', hours: 'Lun-Ven 8:30-19', privacyUrl: '/privacy' },
    footer: { businessName: 'Studio Dentistico Bianchi', description: 'Cura del sorriso dal 1995.', layout: 'centered', socials: [{ platform: 'facebook', url: '#' }, { platform: 'linkedin', url: '#' }], legalLinks: [{ label: 'Privacy', href: '/privacy' }, { label: 'Note legali', href: '/legal' }] },
  },
];

function BizBanner({ label, palette }: { label: string; palette: Biz['palette'] }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-blue-900 px-6 py-4 text-white">
      <h2 className="font-mono text-base font-bold tracking-wider">{label}</h2>
      <div className="flex items-center gap-2">
        {(['bg', 'ink', 'accent', 'muted'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-blue-100">
            <span className="inline-block h-5 w-5 rounded border border-white/30" style={{ background: palette[k] }} />{palette[k]}
          </span>
        ))}
      </div>
    </div>
  );
}
function CB({ text }: { text: string }) {
  return <div className="bg-amber-100 border-y border-amber-300 px-6 py-1.5 text-xs font-mono text-amber-900">{text}</div>;
}

export default function LabAuditAll() {
  return (
    <div className="bg-zinc-900">
      {BUSINESSES.map((b) => {
        const p = b.palette;
        const heroImgs = imgs(b.label);
        const menuGrid = b.items[0]?.layout === 'minimal' ? 'mx-auto flex max-w-3xl flex-col px-6'
          : b.items[0]?.layout === 'list' ? 'mx-auto flex max-w-3xl flex-col gap-3 px-6'
            : 'grid gap-5 px-6 sm:grid-cols-2 lg:grid-cols-4';
        return (
          <section key={b.label}>
            <BizBanner label={b.label} palette={p} />

            <CB text={`${b.label} — hero/aurora-hero`} />
            <AuroraHero {...b.hero} palette={p} tone={b.tone} layout="left" />
            <CB text={`${b.label} — hero/floating-food-hero`} />
            <FloatingFoodHero {...b.hero} images={heroImgs} palette={p} tone={b.tone} layout="split" />
            <CB text={`${b.label} — hero/pixel-hero`} />
            <PixelHero {...b.hero} palette={p} tone={b.tone} layout="centered" />

            <CB text={`${b.label} — about/about-3`} />
            <About3 {...b.about} palette={p} tone={b.tone} />

            <CB text={`${b.label} — menu/menu-item-card ×${b.items.length}`} />
            <div className="py-12" style={{ background: p.bg }}>
              <h3 className="mb-8 text-center text-2xl font-bold" style={{ color: p.ink }}>{b.menuTitle}</h3>
              <div className={menuGrid}>
                {b.items.map((it, i) => <MenuItemCard key={i} {...it} palette={p} />)}
              </div>
            </div>

            <CB text={`${b.label} — features/feature-section`} />
            <FeatureSection {...b.featureSection} palette={p} tone={b.tone} />
            <CB text={`${b.label} — features/feature-carousel`} />
            <FeatureCarousel {...b.featureCarousel} palette={p} tone={b.tone} />
            <CB text={`${b.label} — features/feature-highlight`} />
            <FeatureHighlight {...b.featureHighlight} palette={p} tone={b.tone} />

            <CB text={`${b.label} — testimonial/testimonial-carousel`} />
            <TestimonialCarousel title="Dicono di noi" testimonials={b.testimonials} palette={p} tone={b.tone} />
            <CB text={`${b.label} — testimonial/client-feedback`} />
            <ClientFeedback title="Recensioni" testimonials={b.feedback} palette={p} tone={b.tone} />

            <CB text={`${b.label} — booking/calendar`} />
            <Calendar {...b.calendar} palette={p} tone={b.tone} />

            <CB text={`${b.label} — form/contact`} />
            <Contact {...b.contact} palette={p} tone={b.tone} />

            <CB text={`${b.label} — footer/site-footer`} />
            <SiteFooter {...b.footer} palette={p} tone={b.tone} />
          </section>
        );
      })}
    </div>
  );
}
