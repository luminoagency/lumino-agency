/**
 * Le ayat, in un file del repo.
 *
 * **Niente API.** Esistono servizi gratuiti che restituiscono un versetto a
 * caso, e sarebbero tre righe di codice: ma metterebbero una chiamata di rete
 * fra l'apertura della dashboard e la comparsa del testo, e un giorno di
 * downtime del servizio dentro il widget. Venticinque versetti sono pochi
 * kilobyte, arrivano col resto della pagina e funzionano anche in aereo.
 *
 * **Come sono scelte.** Solo versetti sulla preghiera e sul ricordo di Allah: è
 * un promemoria della preghiera, non un Corano tascabile. Dove il testo è una
 * parte di un versetto più lungo il campo `parziale` è vero e l'interfaccia lo
 * segna con un'ellissi — citare mezzo versetto senza dirlo è un errore anche
 * quando la metà è esatta.
 *
 * **Il riferimento è esatto o il versetto non c'è.** Qualche ayah molto
 * pertinente è rimasta fuori (Al-A'raf 7:205 fra le altre) perché non si era
 * certi di una parola della vocalizzazione: un versetto storto in un'area
 * interna resta storto per anni, e nessuno lo va a controllare.
 *
 * La traduzione italiana è di senso e non pretende di sostituire una
 * traduzione con commento: serve a chi legge l'arabo a fatica.
 */

export interface Ayah {
  /** Testo arabo vocalizzato. */
  ar: string
  /** Traduzione italiana di senso. */
  it: string
  /** Nome della sura in trascrizione. */
  sura: string
  /** Il riferimento esatto: `24:37`, oppure `23:1-2` per due versetti. */
  rif: string
  /** Di cosa parla: serve a bilanciare l'elenco, non si mostra. */
  tema: 'salat' | 'dhikr'
  /** Vero se il testo è una parte del versetto: l'interfaccia mette l'ellissi. */
  parziale?: boolean
}

export const AYAT: Ayah[] = [
  {
    /* La richiesta esplicita, ed è il versetto giusto per una dashboard di
       vendite: sono uomini che il commercio non distrae. */
    ar: 'رِجَالٌ لَا تُلْهِيهِمْ تِجَارَةٌ وَلَا بَيْعٌ عَنْ ذِكْرِ اللَّهِ وَإِقَامِ الصَّلَاةِ وَإِيتَاءِ الزَّكَاةِ يَخَافُونَ يَوْمًا تَتَقَلَّبُ فِيهِ الْقُلُوبُ وَالْأَبْصَارُ',
    it: 'Uomini che né il commercio né gli affari distolgono dal ricordo di Allah, dall’eseguire la preghiera e dal versare la zakat. Temono un Giorno in cui i cuori e gli sguardi saranno sconvolti.',
    sura: 'An-Nur',
    rif: '24:37',
    tema: 'dhikr',
  },
  {
    ar: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    it: 'Ricordatevi di Me e Io Mi ricorderò di voi. SiateMi grati e non rinnegateMi.',
    sura: 'Al-Baqarah',
    rif: '2:152',
    tema: 'dhikr',
  },
  {
    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    it: 'O voi che credete, cercate aiuto nella pazienza e nella preghiera: in verità Allah è con i perseveranti.',
    sura: 'Al-Baqarah',
    rif: '2:153',
    tema: 'salat',
  },
  {
    ar: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ',
    it: 'Cercate aiuto nella pazienza e nella preghiera. È certo gravosa, ma non per gli umili.',
    sura: 'Al-Baqarah',
    rif: '2:45',
    tema: 'salat',
  },
  {
    ar: 'حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَى وَقُومُوا لِلَّهِ قَانِتِينَ',
    it: 'Custodite le preghiere, e la preghiera mediana, e state davanti ad Allah con devozione.',
    sura: 'Al-Baqarah',
    rif: '2:238',
    tema: 'salat',
  },
  {
    ar: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
    it: 'Quando i Miei servi ti chiedono di Me: in verità Io sono vicino, rispondo all’invocazione di chi Mi invoca.',
    sura: 'Al-Baqarah',
    rif: '2:186',
    tema: 'dhikr',
    parziale: true,
  },
  {
    ar: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    it: 'Coloro che credono e i cui cuori si acquietano nel ricordo di Allah. Non è nel ricordo di Allah che i cuori si acquietano?',
    sura: 'Ar-Ra’d',
    rif: '13:28',
    tema: 'dhikr',
  },
  {
    ar: 'إِنَّنِي أَنَا اللَّهُ لَا إِلَهَ إِلَّا أَنَا فَاعْبُدْنِي وَأَقِمِ الصَّلَاةَ لِذِكْرِي',
    it: 'In verità Io sono Allah: non c’è divinità all’infuori di Me. AdoraMi dunque, ed esegui la preghiera per ricordarMi.',
    sura: 'Ta-Ha',
    rif: '20:14',
    tema: 'salat',
  },
  {
    ar: 'وَأْمُرْ أَهْلَكَ بِالصَّلَاةِ وَاصْطَبِرْ عَلَيْهَا لَا نَسْأَلُكَ رِزْقًا نَحْنُ نَرْزُقُكَ وَالْعَاقِبَةُ لِلتَّقْوَى',
    it: 'Ordina la preghiera alla tua famiglia e sii costante in essa. Non ti chiediamo sostentamento: siamo Noi a sostentarti. L’esito migliore è del timore di Allah.',
    sura: 'Ta-Ha',
    rif: '20:132',
    tema: 'salat',
  },
  {
    ar: 'اتْلُ مَا أُوحِيَ إِلَيْكَ مِنَ الْكِتَابِ وَأَقِمِ الصَّلَاةَ إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ وَلَذِكْرُ اللَّهِ أَكْبَرُ وَاللَّهُ يَعْلَمُ مَا تَصْنَعُونَ',
    it: 'Recita ciò che ti è stato rivelato del Libro ed esegui la preghiera: in verità la preghiera preserva da ciò che è turpe e riprovevole. Il ricordo di Allah è la cosa più grande, e Allah sa quello che fate.',
    sura: 'Al-Ankabut',
    rif: '29:45',
    tema: 'salat',
  },
  {
    ar: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ',
    it: 'Hanno successo i credenti: coloro che sono umili nella loro preghiera.',
    sura: 'Al-Mu’minun',
    rif: '23:1-2',
    tema: 'salat',
  },
  {
    ar: 'وَالَّذِينَ هُمْ عَلَى صَلَاتِهِمْ يُحَافِظُونَ',
    it: 'E coloro che custodiscono la loro preghiera.',
    sura: 'Al-Ma’arij',
    rif: '70:34',
    tema: 'salat',
  },
  {
    ar: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
    it: 'In verità la preghiera è per i credenti una prescrizione dal tempo stabilito.',
    sura: 'An-Nisa',
    rif: '4:103',
    tema: 'salat',
    parziale: true,
  },
  {
    ar: 'وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِنَ اللَّيْلِ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ ذَلِكَ ذِكْرَى لِلذَّاكِرِينَ',
    it: 'Esegui la preghiera ai due estremi del giorno e in una parte della notte. In verità le opere buone cancellano quelle cattive: questo è un richiamo per chi ricorda.',
    sura: 'Hud',
    rif: '11:114',
    tema: 'salat',
  },
  {
    ar: 'أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَى غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا',
    it: 'Esegui la preghiera dal declinare del sole fino al buio della notte, e la recitazione dell’alba: in verità la recitazione dell’alba ha dei testimoni.',
    sura: 'Al-Isra',
    rif: '17:78',
    tema: 'salat',
  },
  {
    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا وَسَبِّحُوهُ بُكْرَةً وَأَصِيلًا',
    it: 'O voi che credete, ricordate Allah con frequente ricordo, e glorificateLo al mattino e alla sera.',
    sura: 'Al-Ahzab',
    rif: '33:41-42',
    tema: 'dhikr',
  },
  {
    ar: 'قَدْ أَفْلَحَ مَنْ تَزَكَّى وَذَكَرَ اسْمَ رَبِّهِ فَصَلَّى',
    it: 'Ha successo chi si purifica, ricorda il Nome del suo Signore e prega.',
    sura: 'Al-A’la',
    rif: '87:14-15',
    tema: 'salat',
  },
  {
    ar: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ',
    it: 'Prega dunque il tuo Signore e offri il sacrificio.',
    sura: 'Al-Kawthar',
    rif: '108:2',
    tema: 'salat',
  },
  {
    /* Il versetto che dice di lasciare gli affari quando chiama la preghiera, e
       subito dopo quello che dice di tornarci. Stanno bene in questo elenco, e
       stanno bene uno accanto all'altro. */
    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِنْ يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَى ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ ذَلِكُمْ خَيْرٌ لَكُمْ إِنْ كُنْتُمْ تَعْلَمُونَ',
    it: 'O voi che credete, quando vi si chiama alla preghiera del venerdì accorrete al ricordo di Allah e lasciate gli affari: questo è meglio per voi, se sapeste.',
    sura: 'Al-Jumu’ah',
    rif: '62:9',
    tema: 'salat',
  },
  {
    ar: 'فَإِذَا قُضِيَتِ الصَّلَاةُ فَانْتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِنْ فَضْلِ اللَّهِ وَاذْكُرُوا اللَّهَ كَثِيرًا لَعَلَّكُمْ تُفْلِحُونَ',
    it: 'Terminata la preghiera, andate per la terra in cerca della grazia di Allah, e ricordate Allah molto: forse prospererete.',
    sura: 'Al-Jumu’ah',
    rif: '62:10',
    tema: 'dhikr',
  },
  {
    ar: 'قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ',
    it: 'Di’: in verità la mia preghiera, il mio rito, la mia vita e la mia morte appartengono ad Allah, Signore dei mondi.',
    sura: 'Al-An’am',
    rif: '6:162',
    tema: 'salat',
  },
  {
    ar: 'وَاذْكُرِ اسْمَ رَبِّكَ بُكْرَةً وَأَصِيلًا',
    it: 'E ricorda il Nome del tuo Signore al mattino e alla sera.',
    sura: 'Al-Insan',
    rif: '76:25',
    tema: 'dhikr',
  },
  {
    ar: 'وَاذْكُرِ اسْمَ رَبِّكَ وَتَبَتَّلْ إِلَيْهِ تَبْتِيلًا',
    it: 'E ricorda il Nome del tuo Signore, e rivolgiti a Lui con piena devozione.',
    sura: 'Al-Muzzammil',
    rif: '73:8',
    tema: 'dhikr',
  },
  {
    ar: 'وَأَوْصَانِي بِالصَّلَاةِ وَالزَّكَاةِ مَا دُمْتُ حَيًّا',
    it: 'E mi ha prescritto la preghiera e la zakat per tutta la durata della mia vita.',
    sura: 'Maryam',
    rif: '19:31',
    tema: 'salat',
    parziale: true,
  },
  {
    ar: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
    it: 'Signore mio, fa’ di me, e di parte della mia discendenza, gente che esegue la preghiera. Signore nostro, accogli la mia invocazione.',
    sura: 'Ibrahim',
    rif: '14:40',
    tema: 'salat',
  },
]

/**
 * L'ayah di un certo giro, scelta senza casualità.
 *
 * Niente `Math.random()`: il server e il browser devono disegnare la stessa
 * ayah al primo dipinto, altrimenti React segnala un errore di idratazione e il
 * testo lampeggia. L'indice viene dal numero del giro, che parte da zero uguale
 * per tutti e lo incrementa solo il timer nel browser.
 */
export function ayahDelGiro(giro: number): Ayah {
  return AYAT[((giro % AYAT.length) + AYAT.length) % AYAT.length]
}

/** Il riferimento leggibile: «An-Nur 24:37». */
export function riferimento(a: Ayah): string {
  return `${a.sura} ${a.rif}`
}
