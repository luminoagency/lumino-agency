import { About3 } from '@/lib/lab-library/about/about-3';
import { MenuItemCard } from '@/lib/lab-library/menu/menu-item-card';
import { TestimonialCarousel } from '@/lib/lab-library/testimonial/testimonial-carousel';

const U = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80`;

const BUSINESSES = [
  {
    label: 'RISTORANTE',
    palette: { bg: '#FAF7F2', ink: '#2A1F1A', accent: '#A0522D', muted: '#E8DDD0' },
    about: {
      title: 'La nostra storia',
      description: 'Dal 1962 la famiglia Mario porta in tavola la vera cucina milanese, con ingredienti del mercato e ricette tramandate di generazione in generazione.',
      mainImage: { src: U('photo-1414235077428-338989a2e8c0'), alt: 'Sala della trattoria' },
      secondaryImage: { src: U('photo-1551183053-bf91a1d81141'), alt: 'Pasta fresca' },
      breakout: { title: 'Cucina del territorio', description: 'Materie prime lombarde, stagionali, selezionate ogni mattina.', buttonText: 'Scopri il menu' },
      achievements: [
        { label: 'Anni di tradizione', value: '60+' },
        { label: 'Coperti', value: '80' },
        { label: 'Ricette storiche', value: '40+' },
      ],
    },
    aboutVariant: { layout: 'standard', tone: 'classic' },
    menuTitle: 'Il menu',
    menuLayout: 'card',
    items: [
      { name: 'Ossobuco alla milanese', description: 'Con risotto allo zafferano', price: 22, prepTime: 40, image: { src: U('photo-1544025162-d76694265947'), alt: 'Ossobuco' }, featured: true, allergens: ['glutine'] },
      { name: 'Risotto giallo', description: 'Riso Carnaroli, zafferano, midollo', price: 16, prepTime: 25, isVegetarian: true, image: { src: U('photo-1476124369491-e7addf5db371'), alt: 'Risotto' } },
      { name: 'Cotoletta alla milanese', description: 'Con osso, alta, dorata', price: 20, prepTime: 30, image: { src: U('photo-1565299624946-b28f40a0ae38'), alt: 'Cotoletta' } },
      { name: 'Tiramisù della casa', description: 'Mascarpone, savoiardi, caffè', price: 8, prepTime: 10, isVegetarian: true, image: { src: U('photo-1571877227200-a0d98ea607e9'), alt: 'Tiramisù' } },
    ],
    testimonialLayout: 'card',
    testimonials: [
      { quote: 'L’ossobuco migliore di Milano, esattamente come lo faceva mia nonna. Atmosfera familiare e servizio impeccabile.', author: 'Giulia Ferrari', role: 'Cliente abituale', rating: 5 },
      { quote: 'Una tappa fissa quando torno a Milano. Il risotto allo zafferano è da applausi.', author: 'Marco Colombo', role: 'Food blogger', rating: 5 },
      { quote: 'Tradizione vera, porzioni generose e prezzi onesti. Consigliatissimo.', author: 'Elena Rizzo', role: 'Cliente', rating: 4 },
    ],
  },
  {
    label: 'HOTEL BOUTIQUE',
    palette: { bg: '#F5F1EB', ink: '#1A1A1A', accent: '#8B6F47', muted: '#D9CFC2' },
    about: {
      title: 'Villa Serena',
      description: 'Dal 1987, dodici camere uniche affacciate sul Lago di Como. Un rifugio di charme dove ospitalità e relax si incontrano.',
      mainImage: { src: U('photo-1566073771259-6a8506099945'), alt: 'Hotel sul lago' },
      breakout: { title: 'Spa & benessere', description: 'Percorso benessere, massaggi e vista lago.', buttonText: 'Scopri la spa' },
      achievements: [
        { label: 'Camere', value: '12' },
        { label: 'Anni di ospitalità', value: '37' },
        { label: 'Riconoscimenti', value: '8' },
      ],
    },
    aboutVariant: { layout: 'editorial', tone: 'editorial', size: 'spacious' },
    menuTitle: 'Camere & servizi',
    menuLayout: 'list',
    items: [
      { name: 'Camera Standard', description: 'Vista giardino, 22 m², colazione inclusa', price: 120, image: { src: U('photo-1582719478250-c89cae4dc85b'), alt: 'Camera standard' } },
      { name: 'Suite vista lago', description: 'Terrazza privata, 45 m², jacuzzi', price: 280, featured: true, image: { src: U('photo-1611892440504-42a792e24d32'), alt: 'Suite' } },
      { name: 'Spa Day', description: 'Percorso benessere + massaggio 50 min', price: 80, image: { src: U('photo-1540541338287-41700207dee6'), alt: 'Spa' } },
      { name: 'Cena gourmet', description: 'Menu degustazione 5 portate', price: 65, image: { src: U('photo-1414235077428-338989a2e8c0'), alt: 'Cena' } },
    ],
    testimonialLayout: 'split',
    testimonials: [
      { quote: 'Una fuga perfetta sul lago. Camere curate, spa rilassante e uno staff che anticipa ogni desiderio.', author: 'Francesca De Luca', role: 'Ospite', rating: 5 },
      { quote: 'La suite vista lago è un sogno. Torneremo sicuramente per il nostro anniversario.', author: 'Alberto Greco', role: 'Ospite', rating: 5 },
      { quote: 'Eleganza discreta e cucina eccellente. Un boutique hotel come dovrebbero essere tutti.', author: 'Chiara Moretti', role: 'Ospite', rating: 4 },
    ],
  },
  {
    label: 'BARBIERE MODERNO',
    palette: { bg: '#1A1A1A', ink: '#F5F5F5', accent: '#D4AF37', muted: '#2A2A2A' },
    about: {
      title: 'BARBER LAB',
      description: 'Dieci anni di forbici, rasoi e stile nel cuore di Brera. Taglio classico o contemporaneo: qui conta solo il risultato.',
      mainImage: { src: U('photo-1503951914875-452162b0f3f1'), alt: 'Barbiere al lavoro' },
      achievements: [
        { label: 'Clienti', value: '5000+' },
        { label: 'Anni', value: '10' },
        { label: 'Tagli fatti', value: '20k+' },
      ],
    },
    aboutVariant: { layout: 'compact', tone: 'modern' },
    menuTitle: 'I servizi',
    menuLayout: 'list',
    items: [
      { name: 'Taglio uomo', description: 'Consulenza, taglio e styling', price: 18, prepTime: 30, image: { src: U('photo-1599351431202-1e0f0137899a'), alt: 'Taglio' } },
      { name: 'Taglio + barba', description: 'Taglio completo e rifinitura barba', price: 25, prepTime: 45, featured: true, image: { src: U('photo-1521590832167-7bcbfaa6381f'), alt: 'Taglio e barba' } },
      { name: 'Rasatura tradizionale', description: 'Panno caldo, rasoio a mano libera', price: 15, prepTime: 30, image: { src: U('photo-1622286342621-4bd786c2447c'), alt: 'Rasatura' } },
      { name: 'Beard styling', description: 'Modellatura e cura della barba', price: 20, prepTime: 25 },
    ],
    testimonialLayout: 'minimal',
    testimonials: [
      { quote: 'Il taglio + barba è sempre perfetto. Atmosfera giusta e gente che sa il fatto suo.', author: 'Davide Conti', role: 'Cliente', rating: 5 },
      { quote: 'Rasatura tradizionale da provare almeno una volta nella vita. Top.', author: 'Luca Bianchi', role: 'Cliente', rating: 5 },
      { quote: 'Prenoto sempre online, mai un’attesa. Professionisti veri.', author: 'Stefano Marini', role: 'Cliente', rating: 4 },
    ],
  },
  {
    label: 'STUDIO DENTISTICO',
    palette: { bg: '#FFFFFF', ink: '#0F2547', accent: '#3B82F6', muted: '#EFF6FF' },
    about: {
      title: 'Studio Dentistico Bianchi',
      description: 'Dal 1995 ci prendiamo cura del tuo sorriso con tecnologie all’avanguardia e un approccio attento alla persona.',
      mainImage: { src: U('photo-1606811971618-4486d14f3f99'), alt: 'Studio dentistico' },
      breakout: { title: 'Prima visita gratuita', description: 'Valutazione completa e piano di cura personalizzato.', buttonText: 'Prenota ora' },
      achievements: [
        { label: 'Pazienti seguiti', value: '3000+' },
        { label: 'Anni di attività', value: '30' },
        { label: 'Specialisti', value: '4' },
      ],
    },
    aboutVariant: { layout: 'standard', tone: 'modern' },
    menuTitle: 'I servizi',
    menuLayout: 'minimal',
    items: [
      { name: 'Igiene e pulizia', description: 'Ablazione tartaro e lucidatura', price: 60 },
      { name: 'Otturazione estetica', description: 'Composito in tinta col dente', price: 100 },
      { name: 'Ortodonzia invisibile', description: 'Allineatori trasparenti, percorso completo', price: 2500, featured: true },
      { name: 'Implantologia', description: 'Impianto in titanio + corona', price: 1800 },
    ],
    testimonialLayout: 'card',
    testimonials: [
      { quote: 'Avevo il terrore del dentista, qui mi hanno messo a mio agio. Professionalità e gentilezza.', author: 'Paola Esposito', role: 'Paziente', rating: 5 },
      { quote: 'Ortodonzia invisibile risultato perfetto in un anno. Consigliato a tutti.', author: 'Roberto Galli', role: 'Paziente', rating: 5 },
      { quote: 'Studio modernissimo, personale puntuale e disponibile. Finalmente un dentista di cui fidarsi.', author: 'Sara Fontana', role: 'Paziente', rating: 5 },
    ],
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

export default function LabAuditContent() {
  return (
    <div className="bg-zinc-900">
      {BUSINESSES.map((b) => {
        const p = b.palette;
        const grid = b.menuLayout === 'card' ? 'grid gap-5 px-6 sm:grid-cols-2 lg:grid-cols-3' : 'mx-auto flex max-w-3xl flex-col gap-3 px-6';
        return (
          <section key={b.label}>
            <BizBanner label={b.label} palette={p} />

            <CompBanner text={`${b.label} — about/about-3 (${b.aboutVariant.layout}/${b.aboutVariant.tone})`} />
            <About3 {...b.about} palette={p} layout={b.aboutVariant.layout as any} tone={b.aboutVariant.tone as any} size={(b.aboutVariant as any).size} />

            <CompBanner text={`${b.label} — menu/menu-item-card ×${b.items.length} (layout ${b.menuLayout})`} />
            <div className="py-12" style={{ background: p.bg }}>
              {b.menuTitle && <h3 className="mb-8 text-center text-2xl font-bold" style={{ color: p.ink }}>{b.menuTitle}</h3>}
              <div className={grid}>
                {b.items.map((it, i) => (
                  <MenuItemCard key={i} {...it} palette={p} layout={b.menuLayout as any} />
                ))}
              </div>
            </div>

            <CompBanner text={`${b.label} — testimonial/testimonial-carousel (layout ${b.testimonialLayout})`} />
            <TestimonialCarousel
              testimonials={b.testimonials as any}
              title="Dicono di noi"
              palette={p}
              layout={b.testimonialLayout as any}
            />
          </section>
        );
      })}
    </div>
  );
}
