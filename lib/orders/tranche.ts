/**
 * Logica delle tranche di pagamento (modello 30/70) per la tabella `orders`.
 * Condiviso tra admin, checkout pubblico e route handler PayPal, così che il
 * calcolo degli importi e la mappatura tipo→colonne stiano in un solo posto.
 */

export type TrancheType = 'deposit' | 'balance';

/** Percentuali del modello 30/70. */
export const DEPOSIT_RATE = 0.3;
export const BALANCE_RATE = 0.7;

/** True se la stringa è un tipo di tranche valido. */
export function isTrancheType(v: unknown): v is TrancheType {
  return v === 'deposit' || v === 'balance';
}

/** Arrotonda a 2 decimali (centesimi) in modo stabile. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calcola acconto (30%) e saldo (70%) da un totale, a 2 decimali.
 * Il saldo è ricavato per differenza così che deposit + balance == total
 * al centesimo (niente sbavature di arrotondamento).
 */
export function computeTranches(total: number): {
  deposit: number;
  balance: number;
} {
  const deposit = round2(total * DEPOSIT_RATE);
  const balance = round2(total - deposit);
  return { deposit, balance };
}

/** Formatta un numero come stringa PayPal con 2 decimali (es. "123.40"). */
export function toAmountString(n: number): string {
  return n.toFixed(2);
}

/** Formatta un importo EUR per la UI italiana (es. "123,40 €"). */
export function formatEuro(n: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(n);
}

/** Riga `orders` come letta da Supabase (campi che ci servono). */
export interface OrderRow {
  id: string;
  client_name: string;
  client_email: string;
  client_whatsapp: string | null;
  total_amount: number | string;
  deposit_amount: number | string;
  balance_amount: number | string;
  deposit_status: string;
  balance_status: string;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
  paypal_deposit_order_id: string | null;
  paypal_balance_order_id: string | null;
  created_at: string;
}

export interface TrancheView {
  type: TrancheType;
  /** Importo numerico della tranche. */
  amount: number;
  /** 'pending' | 'paid' */
  status: string;
  /** Etichetta per il cliente. */
  label: string;
  /** Nome colonna Supabase con l'ID ordine PayPal per questa tranche. */
  paypalOrderIdColumn: 'paypal_deposit_order_id' | 'paypal_balance_order_id';
  /** Nome colonna stato. */
  statusColumn: 'deposit_status' | 'balance_status';
  /** Nome colonna timestamp pagamento. */
  paidAtColumn: 'deposit_paid_at' | 'balance_paid_at';
}

/**
 * Estrae la vista di una tranche da una riga ordine.
 * numeric di Postgres può arrivare come stringa: normalizziamo a number.
 */
export function trancheOf(order: OrderRow, type: TrancheType): TrancheView {
  if (type === 'deposit') {
    return {
      type,
      amount: Number(order.deposit_amount),
      status: order.deposit_status,
      label: 'Acconto 30%',
      paypalOrderIdColumn: 'paypal_deposit_order_id',
      statusColumn: 'deposit_status',
      paidAtColumn: 'deposit_paid_at',
    };
  }
  return {
    type,
    amount: Number(order.balance_amount),
    status: order.balance_status,
    label: 'Saldo 70%',
    paypalOrderIdColumn: 'paypal_balance_order_id',
    statusColumn: 'balance_status',
    paidAtColumn: 'balance_paid_at',
  };
}
