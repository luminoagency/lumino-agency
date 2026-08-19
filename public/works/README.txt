Screenshot dei lavori.

STATO ATTUALE — i file presenti sono le PRIME SCHERMATE (hero),
circa 1880x907 in origine, ridotti a 1600px di larghezza.
Essendo piu larghi che alti, non c'e' pagina da scorrere: la card
lo capisce dalle proporzioni e fa una deriva lenta invece di
simulare uno scorrimento inesistente.

SERVONO LE VERSIONI FULL-PAGE, con gli STESSI NOMI:
  hosteria-moderna.webp   + .png
  trattoria-dalloste.webp + .png
  hotel-aurora.webp       + .png
  miss-poppy.webp         + .png
  rossi-restaurant.webp   + .png

Larghezza 1600px, altezza libera (tipicamente 3-6 volte la
larghezza). Appena i file vengono sostituiti, lo scorrimento
automatico parte da solo: nessuna modifica al codice.

Se cambiano le dimensioni, aggiornare width/height in
components/home/worksData.ts (servono a evitare il layout shift).
