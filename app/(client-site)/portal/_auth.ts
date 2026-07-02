import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyClientSession, type ClientUser } from '@/lib/lab/client-auth';

export const CLIENT_COOKIE = 'lumino_client_session';

export interface ClientContext { user: ClientUser; project: any }

/** Ritorna il contesto cliente autenticato o null (senza redirect). */
export async function getClient(): Promise<ClientContext | null> {
  const token = cookies().get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  const r = await verifyClientSession(token);
  if (!r.valid || !r.user) return null;
  return { user: r.user, project: r.project };
}

/** Gate per le pagine protette: redirect a /portal/login se non autenticato. */
export async function requireClient(): Promise<ClientContext> {
  const c = await getClient();
  if (!c) redirect('/portal/login');
  return c;
}
