/**
 * Fake restaurant demo dataset for portfolio + landing.
 * 8 restaurants, varied cuisines, each pre-paired with a template.
 * Used by /portfolio, /demo/[slug], and bylumino.com landing.
 */

export type DemoTemplate = 'cinematico' | 'bento' | 'panoramico' | 'aurora' | 'mercato'

export interface DemoRestaurant {
  slug: string
  template: DemoTemplate
  accentColor: string
  cuisine: string
  category: 'fine-dining' | 'pizza' | 'sushi' | 'fast-food' | 'trattoria' | 'lounge' | 'ramen' | 'bistrot'
  data: any  // matches template props
}

const TIME_SLOTS = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']

const HOURS = {
  mon: { open: '12:00', close: '14:30' },
  tue: { open: '12:00', close: '14:30' },
  wed: { open: '12:00', close: '14:30' },
  thu: { open: '12:00', close: '23:00' },
  fri: { open: '12:00', close: '23:30' },
  sat: { open: '12:00', close: '23:30' },
  sun: { open: '12:00', close: '22:00' },
}

const FAQ_GENERIC = [
  { q: 'Avete piatti vegani e senza glutine?', a: 'Sì, abbiamo opzioni vegane e gluten-free chiaramente marcate nel menu. Per allergie specifiche, scrivici prima.' },
  { q: 'Si può venire con il cane?', a: 'Sì, abbiamo una zona dehor pet-friendly. Per stare dentro al locale dipende dalla taglia — chiamaci.' },
  { q: 'Quanti tavoli per gruppi grandi?', a: 'Gestiamo gruppi fino a 24 persone con un tavolo unico. Per gruppi più grandi facciamo eventi privati.' },
  { q: 'Fate consegne a domicilio?', a: 'Siamo su Deliveroo, Glovo e Just Eat. Per consegne dirette in zona chiamaci.' },
  { q: 'Si può prenotare per occasioni speciali?', a: 'Assolutamente. Compleanni, anniversari, eventi aziendali — ci pensiamo noi.' },
]

const REVIEWS_GENERIC = (cuisine: string) => ({
  score: 4.7 + Math.random() * 0.2,
  count: Math.floor(180 + Math.random() * 400),
  source: 'Google',
  items: [
    { author: 'Giulia M.', rating: 5, text: `Il miglior ${cuisine.toLowerCase()} della città, senza ombra di dubbio. Atmosfera bellissima, staff super gentile.`, source: 'Google', date: '2 settimane fa' },
    { author: 'Davide R.', rating: 5, text: 'Veniamo qui quasi ogni settimana. Sempre all\'altezza, sempre una sorpresa.', source: 'Tripadvisor', date: '1 mese fa' },
    { author: 'Sara P.', rating: 5, text: 'Esperienza top dalla prenotazione al conto. Lo consigliamo a tutti.', source: 'Google', date: '3 settimane fa' },
    { author: 'Lorenzo B.', rating: 4, text: 'Cibo eccellente, locale carino. Nel weekend l\'attesa è lunga, prenotate.', source: 'TheFork', date: '1 mese fa' },
  ],
})

export const DEMO_RESTAURANTS: DemoRestaurant[] = [
  // ─── 1. SUSHI HANAMI — Aurora (purple/pink magical lounge) ───────────────
  {
    slug: 'sushi-hanami',
    template: 'aurora',
    accentColor: '#a78bfa',
    cuisine: 'Sushi & Cocktail',
    category: 'sushi',
    data: {
      restaurantName: 'Sushi Hanami',
      tagline: 'Where Tokyo meets the night',
      description: 'Nel cuore di Milano, Hanami porta la cucina giapponese contemporanea in un\'atmosfera intima e onirica. Sushi-bar dietro il bancone, mixology team in sala — ogni serata è un viaggio sensoriale.',
      heroImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&q=90',
        'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1920&q=90',
        'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=85',
      menuCategories: [
        { name: 'Nigiri & Sashimi', description: 'Pesce selezionato ogni mattina al mercato del pesce', items: [
          { name: 'Toro Premium', description: 'Ventresca di tonno rosso, salsa ponzu, fiore di shiso', price: 18, allergens: ['signature'] },
          { name: 'Salmone Hokkaido', description: 'Salmone scozzese 24h marinato, zest di lime', price: 12, allergens: ['gf'] },
          { name: 'Branzino Yuzu', description: 'Carpaccio di branzino, gel di yuzu, sale Maldon', price: 14, allergens: ['gf'] },
          { name: 'Tartare Wagyu', description: 'Manzo wagyu A5, tuorlo affumicato, tartufo nero', price: 24, allergens: ['signature'] },
        ]},
        { name: 'Roll Signature', items: [
          { name: 'Hanami Roll', description: 'Salmone, avocado, mango, salsa al sesamo nero', price: 16, allergens: ['signature'] },
          { name: 'Dragon Spicy', description: 'Tempura di gambero, salsa piccante, anguilla', price: 18, allergens: ['spicy'] },
          { name: 'Green Garden', description: 'Avocado, cetriolo, asparagi, salsa wasabi', price: 12, allergens: ['vegan'] },
          { name: 'Foie Gras Roll', description: 'Foie gras seared, fichi, riduzione port wine', price: 22 },
        ]},
        { name: 'Cocktail Signature', items: [
          { name: 'Sakura Negroni', description: 'Gin, vermouth, campari, sciroppo di sakura', price: 14 },
          { name: 'Yuzu Sour', description: 'Whisky giapponese, yuzu, miele', price: 13 },
          { name: 'Forest Martini', description: 'Vodka, foglie di shiso, ginepro, lime', price: 14, allergens: ['vegan'] },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1400&q=90', alt: 'Sushi platter', caption: 'Il banco sushi' },
        { url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=85', alt: 'Nigiri', caption: 'Toro premium' },
        { url: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=85', alt: 'Hanami roll', caption: 'Hanami signature roll' },
        { url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=85', alt: 'Cocktail', caption: 'Sakura Negroni' },
        { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85', alt: 'Sala', caption: 'L\'atmosfera della sala' },
        { url: 'https://images.unsplash.com/photo-1564844536311-de546a28c87d?w=1200&q=85', alt: 'Dettaglio', caption: 'I dettagli che contano' },
      ],
      address: 'Via Solferino 24, 20121 Milano',
      phone: '+39 02 987 654',
      email: 'info@sushihanami.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2798.5!2d9.1859!3d45.4708!2m3!1f0!2f0!3f0',
      socialLinks: { instagram: '#', facebook: '#' },
      tier: 'premium',
      events: [
        { title: 'Omakase Night', description: '10 portate scelte dal sushi chef. Tutti i mercoledì', date: '2026-06-19' },
        { title: 'Sake Pairing', description: 'Cena con 4 sake giapponesi in abbinamento ai piatti', date: '2026-06-26' },
        { title: 'Live Jazz', description: 'Trio jazz dal vivo, ogni venerdì dalle 21', date: '2026-06-21' },
      ],
      whatsappNumber: '39029876543',
      chef: { name: 'Kenji Watanabe', role: 'Executive Chef', quote: 'Il sushi non è solo cucina, è gesto. Ogni movimento, ogni taglio è quello che faccio da quando ho 16 anni. Hanami è la mia casa.', photo: 'https://images.unsplash.com/photo-1577219492769-b63a779fac42?w=900&q=85', years: 22 },
      reviews: REVIEWS_GENERIC('sushi'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },

  // ─── 2. TRATTORIA DA NONNA LUCIA — Mercato (vintage editorial) ───────────
  {
    slug: 'trattoria-nonna-lucia',
    template: 'mercato',
    accentColor: '#b8451f',
    cuisine: 'Cucina toscana',
    category: 'trattoria',
    data: {
      restaurantName: 'Da Nonna Lucia',
      tagline: 'Da Lucia, come a casa.',
      description: 'Aperti nel 1958, tre generazioni della famiglia Berrini portano in tavola la vera cucina toscana. Pasta tirata a mano ogni mattina, ricette che non sono mai cambiate, il vino della casa che fa Lucia stessa.',
      heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=90',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=90',
        'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85',
      menuCategories: [
        { name: 'Antipasti', description: 'Da condividere, come si fa in famiglia', items: [
          { name: 'Tagliere del Casolare', description: 'Salumi locali, pecorino di fossa, mostarda di Lucia, pane caldo', price: 14, allergens: ['signature'] },
          { name: 'Crostini Misti', description: 'Tre tipi: fegatini, pomodorini secchi, lardo di Colonnata', price: 9 },
          { name: 'Burrata e Pomodori', description: 'Burrata pugliese, pomodori del nostro orto, basilico', price: 11, allergens: ['vegetarian', 'gf'] },
        ]},
        { name: 'Primi piatti', description: 'Pasta fatta in casa ogni mattina', items: [
          { name: 'Pici cacio e pepe', description: 'Pici tirati a mano, pecorino di Pienza 18 mesi, pepe nero del Sarawak', price: 13, allergens: ['vegetarian', 'signature'] },
          { name: 'Tagliatelle al ragù', description: 'Ragù di chianina cotto 6 ore, parmigiano 30 mesi', price: 14 },
          { name: 'Pappardelle al cinghiale', description: 'Cinghiale dell\'Amiata, vino rosso, profumi del bosco', price: 16 },
          { name: 'Ravioli di ricotta', description: 'Ricotta di pecora, spinaci, burro e salvia', price: 13, allergens: ['vegetarian'] },
        ]},
        { name: 'Secondi', items: [
          { name: 'Bistecca alla Fiorentina', description: '1.2 kg di chianina IGP, brace di legno, olio toscano', price: 65, allergens: ['signature'] },
          { name: 'Peposo del Brunelleschi', description: 'Stufato di manzo all\'antica, vino rosso, pepe', price: 18 },
          { name: 'Cinta senese arrosto', description: 'Maialino di Cinta Senese, patate al forno', price: 19 },
        ]},
        { name: 'Dolci della Lucia', items: [
          { name: 'Tiramisù di Lucia', description: 'Ricetta originale del 1965. Mai cambiata.', price: 7, allergens: ['signature'] },
          { name: 'Cantucci e Vin Santo', description: 'Cantucci di Prato, Vin Santo del Chianti', price: 8, allergens: ['vegetarian', 'nuts'] },
          { name: 'Torta della Nonna', description: 'La nostra ricetta segreta. Crema e pinoli', price: 6, allergens: ['vegetarian', 'nuts'] },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=90', alt: 'Pasta fresca', caption: 'Le tagliatelle di Lucia' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=85', alt: 'Cucina', caption: 'In cucina, dal 1958' },
        { url: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=1200&q=85', alt: 'Tavolata', caption: 'Le serate di festa' },
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85', alt: 'Sala', caption: 'La nostra sala storica' },
        { url: 'https://images.unsplash.com/photo-1551892589-865f69869476?w=1200&q=85', alt: 'Tagliere', caption: 'Tagliere del casolare' },
        { url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&q=85', alt: 'Vino', caption: 'Cantina di famiglia' },
      ],
      address: 'Piazza del Campo 11, 53100 Siena',
      phone: '+39 0577 281 234',
      email: 'lucia@dannonalucia.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2891.8!2d11.3318!3d43.3187!2m3!1f0!2f0!3f0',
      socialLinks: { instagram: '#', facebook: '#' },
      tier: 'premium',
      events: [
        { title: 'Cena della Vendemmia', description: 'Menu degustazione 5 portate con vini della nostra cantina', date: '2026-09-15' },
        { title: 'Domenica in famiglia', description: 'Pranzo della domenica con menu fisso a 35€ — tutto incluso', date: '2026-06-22' },
        { title: 'Corso di pici', description: 'Lucia ti insegna a fare i pici a mano. Pranzo incluso. 80€', date: '2026-07-05' },
      ],
      whatsappNumber: '390577281234',
      chef: { name: 'Lucia Berrini', role: 'Chef & Proprietaria, 3ª generazione', quote: 'Mia nonna mi insegnava: "Lucia, la cucina è la lingua che parli quando ami qualcuno." Da 67 anni questa famiglia parla così.', photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=900&q=85', years: 38 },
      reviews: REVIEWS_GENERIC('trattoria'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },

  // ─── 3. BURGER REPUBLIC — Bento (modern fast food) ─────────────────────
  {
    slug: 'burger-republic',
    template: 'bento',
    accentColor: '#FF6B35',
    cuisine: 'Smash burger',
    category: 'fast-food',
    data: {
      restaurantName: 'Burger Republic',
      tagline: 'Smashed. Stacked. Yours.',
      description: 'Smash burger artigianali, carne 100% italiana macinata fresca ogni mattina. Bun fatti da noi, salse di nostra invenzione. Niente filtri Instagram, solo carne, fuoco, e tanto sapore.',
      heroImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=90',
        'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1920&q=90',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=85',
      menuCategories: [
        { name: 'Smash Classics', items: [
          { name: 'OG Republic', description: 'Doppio smash, cheddar fuso, cipolla caramellata, salsa Republic', price: 11, allergens: ['signature'] },
          { name: 'Bacon Lover', description: 'Triplo smash, bacon affumicato, cheddar, salsa bbq', price: 13 },
          { name: 'Truffle King', description: 'Smash, crema di tartufo, mozzarella di bufala, rucola', price: 14, allergens: ['signature'] },
          { name: 'Green Smash', description: 'Beyond Meat patty, avocado, sriracha mayo, pomodori secchi', price: 12, allergens: ['vegetarian'] },
        ]},
        { name: 'Wraps & Sides', items: [
          { name: 'Republic Wrap', description: 'Pollo croccante, lattuga, pomodoro, salsa yogurt', price: 9 },
          { name: 'Loaded Fries', description: 'Patatine, cheddar fuso, bacon, jalapeños', price: 8, allergens: ['spicy'] },
          { name: 'Onion Rings', description: 'Anelli di cipolla in pastella croccante, salsa bbq', price: 6, allergens: ['vegetarian'] },
          { name: 'Sweet Potato Fries', description: 'Patate dolci croccanti, sale rosa, mayo speziata', price: 7, allergens: ['vegan', 'spicy'] },
        ]},
        { name: 'Bevande', items: [
          { name: 'Republic Shake', description: 'Milkshake artigianale — vaniglia, cioccolato, fragola', price: 6, allergens: ['vegetarian'] },
          { name: 'Craft Beer', description: 'Birra artigianale alla spina — rotazione settimanale', price: 5, allergens: ['vegan'] },
          { name: 'Fresh Lemonade', description: 'Limonata fresca, menta e zenzero', price: 4, allergens: ['vegan', 'gf'] },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1400&q=90', alt: 'OG Republic', caption: 'OG Republic' },
        { url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=85', alt: 'Double cheese', caption: 'Bacon Lover' },
        { url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=85', alt: 'Truffle burger', caption: 'Truffle King' },
        { url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=85', alt: 'Locale', caption: 'Il locale' },
        { url: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=1200&q=85', alt: 'Fries', caption: 'Loaded fries' },
        { url: 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=1200&q=85', alt: 'Shake', caption: 'Republic shake' },
      ],
      address: 'Via Po 18, 10124 Torino',
      phone: '+39 011 567 890',
      email: 'hey@burgerrepublic.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2820.5!2d7.6869!3d45.0703!2m3!1f0!2f0!3f0',
      socialLinks: { instagram: '#', facebook: '#' },
      tier: 'pro',
      events: [
        { title: 'Smash Night', description: 'Tutti i burger a 9€ — ogni giovedì', date: '2026-06-19' },
        { title: 'New Burger Launch', description: 'Presentiamo il "Cheddar Bomb" — solo per il weekend', date: '2026-06-21' },
      ],
      whatsappNumber: '390115678901',
      chef: { name: 'Tommaso "Tom" De Marchi', role: 'Founder & Pitmaster', quote: 'A New York mi hanno insegnato che un burger è quasi religioso: carne, fuoco, niente fronzoli. A Torino l\'ho riportato così.', photo: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=900&q=85', years: 10 },
      reviews: REVIEWS_GENERIC('burger'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },

  // ─── 4. LA MAISON VERTE — Panoramico (light fine dining) ────────────────
  {
    slug: 'la-maison-verte',
    template: 'panoramico',
    accentColor: '#b58a2f',
    cuisine: 'Cucina d\'autore',
    category: 'fine-dining',
    data: {
      restaurantName: 'La Maison Verte',
      tagline: 'Una panoramica sulla cucina.',
      description: 'Ristorante d\'autore con vista sul Lago di Como. Cucina contemporanea che onora la tradizione mediterranea, ingredienti del territorio interpretati con tecnica moderna. Una stella Michelin dal 2021.',
      heroImage: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1920&q=90',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=90',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85',
      menuCategories: [
        { name: 'Degustazione', description: 'Il viaggio. 7 portate. 95€', items: [
          { name: 'Apertura del Mare', description: 'Carpaccio di ricciola, agrumi del Garda, bottarga', price: 18, allergens: ['gf'] },
          { name: 'Risotto del Lago', description: 'Riso Carnaroli, perch della pesca del giorno, prezzemolo riccio', price: 22, allergens: ['signature'] },
          { name: 'Cervo nella sua foresta', description: 'Cervo dell\'alto Lario, ginepro, riduzione di mirtilli', price: 32 },
        ]},
        { name: 'Antipasti', items: [
          { name: 'Uovo Cinquanta', description: 'Uovo cotto a 50°, asparagi, parmigiano vacche rosse 36 mesi', price: 16, allergens: ['vegetarian', 'signature'] },
          { name: 'Vitello Tonnato 2025', description: 'Reinterpretazione: filetto di vitello, salsa tonnata moderna', price: 18 },
        ]},
        { name: 'Primi', items: [
          { name: 'Tortelli di brasato', description: 'Pasta fresca ripiena di brasato al Barolo', price: 24, allergens: ['signature'] },
          { name: 'Spaghettone aglio nero', description: 'Spaghettone Mancini, aglio nero fermentato, peperone crusco', price: 22, allergens: ['vegan', 'spicy'] },
        ]},
        { name: 'Secondi', items: [
          { name: 'Branzino del Tirreno', description: 'Branzino in crosta di sale, salsa al lime, finocchi croccanti', price: 36, allergens: ['gf'] },
          { name: 'Agnello e timo', description: 'Costolette di agnello, timo serpillo, carciofi violetti', price: 38 },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1400&q=90', alt: 'Sala', caption: 'La sala vista lago' },
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85', alt: 'Piatto degustazione', caption: 'Apertura del mare' },
        { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85', alt: 'Dettaglio sala', caption: 'I dettagli che curiamo' },
        { url: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1200&q=85', alt: 'Vista lago', caption: 'Vista dalla terrazza' },
        { url: 'https://images.unsplash.com/photo-1551892589-865f69869476?w=1200&q=85', alt: 'Plating', caption: 'Plating signature' },
        { url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=85', alt: 'Wine', caption: 'La nostra cantina' },
      ],
      address: 'Lungolago Argegno 7, 22010 Argegno (CO)',
      phone: '+39 031 821 456',
      email: 'reservations@maisonverte.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2789.8!2d9.1318!3d45.9268!2m3!1f0!2f0!3f0',
      socialLinks: { instagram: '#', facebook: '#' },
      tier: 'premium',
      events: [
        { title: 'Cena delle 4 mani', description: 'Lo chef ospita un guest chef stellato. 6 portate, vino in pairing', date: '2026-07-12' },
        { title: 'Degustazione vini del Lago', description: 'Verticale di 6 vini del territorio con sommelier', date: '2026-06-28' },
      ],
      whatsappNumber: '390318214567',
      chef: { name: 'Marco Bertoldi', role: 'Chef Patron — 1 stella Michelin', quote: 'Il lago di Como mi ha dato tutto. Pesci, erbe, persino i miei migliori sous-chef. Il mio mestiere è solo restituire bellezza.', photo: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=900&q=85', years: 27 },
      reviews: REVIEWS_GENERIC('fine dining'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },

  // ─── 5. QUATTRO STAGIONI — Cinematico (pizza traditional but cinematic) ──
  {
    slug: 'quattro-stagioni-pizza',
    template: 'cinematico',
    accentColor: '#e52d1d',
    cuisine: 'Pizza napoletana',
    category: 'pizza',
    data: {
      restaurantName: 'Quattro Stagioni',
      tagline: 'La pizza, come dovrebbe essere.',
      description: 'Pizza napoletana verace, lievitazione 72 ore, farina del Mulino Caputo, mozzarella di bufala campana DOP. Forno a legna a 480°, cottura in 60 secondi. Niente shortcut, niente compromessi.',
      heroImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=90',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=90',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&q=85',
      menuCategories: [
        { name: 'Le classiche', items: [
          { name: 'Margherita DOP', description: 'Pomodoro San Marzano DOP, mozzarella di bufala, basilico fresco, olio EVO', price: 9, allergens: ['vegetarian', 'signature'] },
          { name: 'Marinara', description: 'Pomodoro, aglio, origano di Sicilia, olio EVO', price: 7, allergens: ['vegan'] },
          { name: 'Diavola', description: 'Pomodoro, mozzarella, salame piccante calabrese', price: 11, allergens: ['spicy'] },
          { name: 'Capricciosa', description: 'Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive', price: 12 },
        ]},
        { name: 'Le speciali', items: [
          { name: 'Quattro Stagioni', description: 'La nostra signature. 4 stagioni in 4 spicchi', price: 14, allergens: ['signature'] },
          { name: 'Tartufo Nero', description: 'Mozzarella di bufala, tartufo nero estivo, parmigiano 30 mesi', price: 16 },
          { name: 'Mortadella e Pistacchi', description: 'Mozzarella, mortadella di Bologna IGP, pistacchio di Bronte, stracciatella', price: 14, allergens: ['nuts'] },
          { name: 'Vegana del Cuore', description: 'Pomodoro, mozzarella vegetale, verdure grigliate, basilico', price: 11, allergens: ['vegan'] },
        ]},
        { name: 'Bevande', items: [
          { name: 'Birra artigianale', description: 'Rotazione settimanale — chiedi a Tony', price: 5, allergens: ['vegan'] },
          { name: 'Coca-Cola in vetro', description: 'Servita ghiacciata, come si deve', price: 3 },
          { name: 'Acqua frizzante', description: 'San Pellegrino 75cl', price: 3 },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400&q=90', alt: 'Margherita', caption: 'La Margherita DOP' },
        { url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=85', alt: 'Pizza in forno', caption: 'A 480° per 60 secondi' },
        { url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&q=85', alt: 'Impasto', caption: 'Lievitazione 72 ore' },
        { url: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=1200&q=85', alt: 'Locale', caption: 'Forno a legna' },
        { url: 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=1200&q=85', alt: 'Tartufo', caption: 'Tartufo nero' },
        { url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1200&q=85', alt: 'Pizzaiolo', caption: 'Tony al banco' },
      ],
      address: 'Via dei Tribunali 42, 80138 Napoli',
      phone: '+39 081 234 567',
      email: 'info@quattrostagioni.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.8!2d14.2622!3d40.8533!2m3!1f0!2f0!3f0',
      socialLinks: { instagram: '#', facebook: '#' },
      tier: 'pro',
      events: [
        { title: 'Pizza Master Class', description: 'Tony ti insegna a fare la vera margherita napoletana. 60€', date: '2026-06-25' },
        { title: 'Wood Fire Night', description: 'Tutte le pizze cotte rigorosamente al forno a legna principale', date: '2026-06-19' },
      ],
      whatsappNumber: '390812345670',
      chef: { name: 'Antonio "Tony" Esposito', role: 'Maestro Pizzaiolo, 3ª generazione', quote: 'La pizza è la cosa più semplice del mondo. Per questo è la più difficile. Mio nonno me lo ripeteva ogni giorno per 20 anni.', photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=900&q=85', years: 24 },
      reviews: REVIEWS_GENERIC('pizza'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },

  // ─── 6. TOKYO RAMEN LAB — Aurora variant (neon ramen) ──────────────────
  {
    slug: 'tokyo-ramen-lab',
    template: 'aurora',
    accentColor: '#f0abfc',
    cuisine: 'Ramen & izakaya',
    category: 'ramen',
    data: {
      restaurantName: 'Tokyo Ramen Lab',
      tagline: 'Slurp. Repeat.',
      description: 'Ramen autentico in stile Tokyo, brodi cotti 24 ore, noodles fatti in casa ogni mattina. L\'unico vero ramen lab d\'Italia, dove l\'umami è religione.',
      heroImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1920&q=90',
        'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=1920&q=90',
        'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=1200&q=85',
      menuCategories: [
        { name: 'Ramen signature', items: [
          { name: 'Tonkotsu Black', description: 'Brodo di maiale 24h, aglio nero, chashu, ajitama', price: 14, allergens: ['signature'] },
          { name: 'Shoyu Classic', description: 'Brodo di pollo e soia, menma, scalogno, alga', price: 12 },
          { name: 'Spicy Miso', description: 'Brodo di miso piccante, peperoncino arashi, chashu', price: 13, allergens: ['spicy'] },
          { name: 'Vegan Mushroom', description: 'Brodo di shiitake e funghi, tofu marinato, mais', price: 12, allergens: ['vegan'] },
        ]},
        { name: 'Bao & Gyoza', items: [
          { name: 'Pork Belly Bao (3pz)', description: 'Pancia di maiale glassata, cetriolo, salsa hoisin', price: 10 },
          { name: 'Gyoza (6pz)', description: 'Ravioli alla piastra, maiale e cavolo cinese', price: 8 },
          { name: 'Vegan Bao (3pz)', description: 'Tofu fritto, avocado, salsa teriyaki', price: 9, allergens: ['vegan'] },
        ]},
        { name: 'Drink', items: [
          { name: 'Sake della casa', description: 'Sake junmai daiginjo, servito caldo o freddo', price: 8 },
          { name: 'Asahi spillata', description: 'Birra giapponese alla spina', price: 5, allergens: ['vegan'] },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1400&q=90', alt: 'Ramen', caption: 'Tonkotsu black' },
        { url: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=1200&q=85', alt: 'Bowl', caption: 'Shoyu classic' },
        { url: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=1200&q=85', alt: 'Spicy', caption: 'Spicy miso' },
        { url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=85', alt: 'Locale', caption: 'Il lab al banco' },
        { url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=85', alt: 'Sake', caption: 'La selezione di sake' },
        { url: 'https://images.unsplash.com/photo-1564844536311-de546a28c87d?w=1200&q=85', alt: 'Bao', caption: 'I nostri bao' },
      ],
      address: 'Via Tortona 27, 20144 Milano',
      phone: '+39 02 348 234',
      email: 'slurp@tokyoramenlab.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2798.5!2d9.1799!3d45.4540!2m3!1f0!2f0!3f0',
      socialLinks: { instagram: '#' },
      tier: 'pro',
      events: [
        { title: 'All-You-Can-Slurp', description: 'Ogni martedì: ramen illimitato per 2 ore. 25€', date: '2026-06-24' },
        { title: 'Sake Discovery', description: 'Verticale di 5 sake con il nostro sommelier giapponese', date: '2026-07-03' },
      ],
      whatsappNumber: '390234823456',
      chef: { name: 'Yuki Nakamura', role: 'Head Chef, dal Toky Ramen School', quote: 'Sono cresciuto in un ramen-ya di Shibuya. A 18 anni mio padre mi ha detto: vai. Ora qui faccio quello che amo, ogni giorno.', photo: 'https://images.unsplash.com/photo-1577219492769-b63a779fac42?w=900&q=85', years: 14 },
      reviews: REVIEWS_GENERIC('ramen'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },

  // ─── 7. OSTERIA DEL BORGO — Mercato variant (Emiliana) ──────────────────
  {
    slug: 'osteria-del-borgo',
    template: 'mercato',
    accentColor: '#6b3215',
    cuisine: 'Cucina emiliana',
    category: 'trattoria',
    data: {
      restaurantName: 'Osteria del Borgo',
      tagline: 'Tradizione emiliana, dal 1947.',
      description: 'Nel borgo storico di Brisighella, Osteria del Borgo è il punto di riferimento per chi cerca la vera Emilia. Sfoglia tirata a mata, sapori antichi, vini di territorio. Cucina che racconta storie di campagna.',
      heroImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=90',
        'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=1920&q=90',
        'https://images.unsplash.com/photo-1551892589-865f69869476?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=1200&q=85',
      menuCategories: [
        { name: 'Antipasti', items: [
          { name: 'Tagliere del Romagnolo', description: 'Prosciutto di Parma 24 mesi, mortadella IGP, squacquerone, piadina calda', price: 13, allergens: ['signature'] },
          { name: 'Piadina e affettati', description: 'Selezione di salumi locali con piadina romagnola fatta da noi', price: 11 },
          { name: 'Burrata e prosciutto', description: 'Burrata pugliese, prosciutto crudo, mostarda, focaccia', price: 12, allergens: ['vegetarian'] },
        ]},
        { name: 'Primi', items: [
          { name: 'Tagliatelle al ragù', description: 'Pasta tirata a mano, ragù di carne misto cotto 6 ore', price: 14, allergens: ['signature'] },
          { name: 'Cappelletti in brodo', description: 'Cappelletti ripieni di carne, brodo di cappone', price: 12 },
          { name: 'Tortellini panna e prosciutto', description: 'Tortellini freschi, panna fresca, prosciutto crudo', price: 13 },
          { name: 'Passatelli in brodo', description: 'Passatelli di parmigiano e pangrattato, brodo di carne', price: 11, allergens: ['vegetarian'] },
        ]},
        { name: 'Secondi', items: [
          { name: 'Scaloppine al Limone', description: 'Scaloppine di vitello, limoni di Sorrento, capperi', price: 16, allergens: ['gf'] },
          { name: 'Coniglio alla cacciatora', description: 'Coniglio dell\'azienda Bertelli, pomodorini, rosmarino', price: 17 },
          { name: 'Bollito misto della domenica', description: 'Solo la domenica. Manzo, lingua, cotechino, salsa verde', price: 18 },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=90', alt: 'Tagliatelle', caption: 'Le tagliatelle del Borgo' },
        { url: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=1200&q=85', alt: 'Sala', caption: 'La sala storica' },
        { url: 'https://images.unsplash.com/photo-1551892589-865f69869476?w=1200&q=85', alt: 'Salumi', caption: 'Il tagliere' },
        { url: 'https://images.unsplash.com/photo-1599974571832-7b41bd0e8e89?w=1200&q=85', alt: 'Cucina', caption: 'In cucina dal 1947' },
        { url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=85', alt: 'Vino', caption: 'Cantina con vini del territorio' },
        { url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&q=85', alt: 'Borgo', caption: 'Il borgo di Brisighella' },
      ],
      address: 'Via degli Asini 5, 48013 Brisighella (RA)',
      phone: '+39 0546 81 234',
      email: 'osteria@delborgo.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2851.8!2d11.7693!3d44.2245!2m3!1f0!2f0!3f0',
      socialLinks: { facebook: '#' },
      tier: 'pro',
      events: [
        { title: 'Bollito della Domenica', description: 'Ogni domenica, dal 1947. Menu fisso 32€', date: '2026-06-22' },
        { title: 'Sagra del Tartufo', description: 'Menu degustazione tartufo bianco. Ottobre-Novembre', date: '2026-10-15' },
      ],
      whatsappNumber: '390546812345',
      chef: { name: 'Maria Bertelli', role: 'Sfoglina & Patrona, 3ª generazione', quote: 'Mio nonno aprì nel 1947 con un\'idea: niente fronzoli, sapore vero. Io stiro la pasta dal 1985 e non sono mai cambiata.', photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=900&q=85', years: 41 },
      reviews: REVIEWS_GENERIC('emiliana'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },

  // ─── 8. THE FLAME — Cinematico variant (steakhouse) ─────────────────────
  {
    slug: 'the-flame',
    template: 'cinematico',
    accentColor: '#c9a84c',
    cuisine: 'Steakhouse',
    category: 'fine-dining',
    data: {
      restaurantName: 'The Flame',
      tagline: 'Where meat meets fire.',
      description: 'Steakhouse newyorkese nel cuore di Roma. Carni dry-aged 45 giorni, brace giapponese binchotan, vini importanti. Il posto dove vai per festeggiare qualcosa.',
      heroImage: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1920&q=90',
      heroImages: [
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1920&q=90',
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1920&q=90',
        'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1920&q=90',
      ],
      aboutImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85',
      menuCategories: [
        { name: 'Le grigliate', description: 'Dry-aged 45 giorni in maturazione su misura', items: [
          { name: 'Tomahawk 1.4kg', description: 'Costata di Black Angus dry-aged 45gg, per 2 persone', price: 95, allergens: ['signature'] },
          { name: 'Ribeye 400g', description: 'Ribeye Sashi finlandese, marmorizzazione 8+', price: 55 },
          { name: 'Tagliata di Chianina', description: 'Filetto e controfiletto, rucola, parmigiano', price: 38 },
          { name: 'Wagyu A5 Japan', description: 'Tournedos di Wagyu giapponese A5, 100g', price: 75, allergens: ['signature'] },
        ]},
        { name: 'Antipasti & Sides', items: [
          { name: 'Beef Tartare', description: 'Filetto di manzo, tuorlo affumicato, scaglie di tartufo', price: 22 },
          { name: 'Burrata e Bottarga', description: 'Burrata pugliese, bottarga di Cabras', price: 18, allergens: ['vegetarian'] },
          { name: 'Patate fondenti', description: 'Patate cotte 3 volte, grasso di manzo, sale Maldon', price: 8 },
          { name: 'Spinaci al burro', description: 'Spinacini freschi, burro francese, aglio nero', price: 7, allergens: ['vegetarian'] },
        ]},
        { name: 'Wine & Cocktail', items: [
          { name: 'Wine pairing 3 bicchieri', description: 'Selezione del sommelier per la tua bistecca', price: 35 },
          { name: 'Old Fashioned The Flame', description: 'Bourbon, zucchero affumicato, bitter', price: 14 },
          { name: 'Negroni Smoked', description: 'Affumicato al tavolo con cedro', price: 14 },
        ]},
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1400&q=90', alt: 'Steak', caption: 'Tomahawk dry-aged' },
        { url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85', alt: 'Sala', caption: 'L\'atmosfera della sala' },
        { url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1200&q=85', alt: 'Wagyu', caption: 'Wagyu A5 Japan' },
        { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85', alt: 'Cantina', caption: 'La cantina dei rossi' },
        { url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=85', alt: 'Vino', caption: 'Vini della casa' },
        { url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=85', alt: 'Cocktail', caption: 'Negroni smoked' },
      ],
      address: 'Via del Babuino 92, 00187 Roma',
      phone: '+39 06 678 901',
      email: 'reservations@theflame.it',
      hours: HOURS,
      mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2967.8!2d12.4807!3d41.9078!2m3!1f0!2f0!3f0',
      socialLinks: { instagram: '#', facebook: '#' },
      tier: 'premium',
      events: [
        { title: 'Wagyu Night', description: 'Menu degustazione 5 portate wagyu giapponese. 145€', date: '2026-06-27' },
        { title: 'Steak Master Class', description: 'Come tagliare e cuocere la bistecca perfetta. Cena inclusa', date: '2026-07-10' },
      ],
      whatsappNumber: '390666789012',
      chef: { name: 'James Carter', role: 'Executive Chef, NYC-trained', quote: 'A New York mi hanno insegnato che la bistecca è un atto di rispetto. Verso l\'animale, verso il fuoco, verso chi mangia. È quello che facciamo qui ogni sera.', photo: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=900&q=85', years: 18 },
      reviews: REVIEWS_GENERIC('steakhouse'),
      faq: FAQ_GENERIC,
      timeSlots: TIME_SLOTS,
    },
  },
]

export function getDemoBySlug(slug: string): DemoRestaurant | null {
  return DEMO_RESTAURANTS.find(r => r.slug === slug) || null
}
