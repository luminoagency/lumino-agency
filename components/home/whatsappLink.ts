import { COMPANY } from '@/lib/company'

/**
 * Il link WhatsApp della home, col messaggio già scritto.
 *
 * FONTE UNICA per la home: lo usano il blocco della sezione Contatti, il
 * pulsante flottante e la scorciatoia nel menu. Scritto in un posto solo perché
 * il messaggio precompilato è una decisione di tono, e tre versioni diverse
 * dello stesso messaggio sono tre toni diversi.
 *
 * Il numero NON sta qui: sta in lib/company.ts, che resta l'unica fonte di
 * verità del contatto. Qui c'è solo cosa ci si scrive dentro.
 */
export const WA_MESSAGE = 'Ciao Lumino, ho visto il vostro sito e vorrei parlarvi di un progetto.'

export const WA_LINK = `${COMPANY.whatsapp.waLink}?text=${encodeURIComponent(WA_MESSAGE)}`
