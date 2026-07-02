'use server';

import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { loginClient, logoutClient, requestPasswordReset, resetPassword, updateClientPassword } from '@/lib/lab/client-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeBuild, type SiteBuild, type ProjectAsset } from '@/lib/lab/builder';
import { exportSiteToStatic } from '@/lib/lab/static-export';
import { deploySite } from '@/lib/lab/vercel';
import type { Subscription, Invoice } from '@/lib/lab/subscriptions';
import { CLIENT_COOKIE, requireClient } from './_auth';

export interface ClientMessage {
  id: string; message_type: string; status: string;
  from_name?: string; from_email?: string; from_phone?: string;
  subject?: string; message_body?: string; page_slug?: string;
  created_at: string; read_at?: string;
}

export async function loginAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const remember = formData.get('remember') === 'on';
  const r = await loginClient(email, password, remember);
  if (!r.ok || !r.sessionToken) return { error: r.error || 'Accesso non riuscito.' };
  cookies().set(CLIENT_COOKIE, r.sessionToken, {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/',
    maxAge: (remember ? 30 : 7) * 86_400,
  });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const token = cookies().get(CLIENT_COOKIE)?.value;
  if (token) await logoutClient(token);
  cookies().delete(CLIENT_COOKIE);
  redirect('/portal/login');
}

export async function requestResetAction(formData: FormData): Promise<{ ok: boolean; devToken?: string }> {
  const email = String(formData.get('email') || '');
  const r = await requestPasswordReset(email);
  // Non riveliamo se l'email esiste. In dev ritorniamo il token per test (no email service).
  return { ok: true, devToken: process.env.NODE_ENV !== 'production' ? r.resetToken : undefined };
}

export async function resetPasswordAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const token = String(formData.get('token') || '');
  const password = String(formData.get('password') || '');
  if (password.length < 8) return { error: 'La password deve avere almeno 8 caratteri.' };
  const r = await resetPassword(token, password);
  return r.ok ? { ok: true } : { error: r.error || 'Token non valido o scaduto.' };
}

/* ── Contenuti: draft / publish ──────────────────────────────────── */

/** Salva la bozza cliente (NON pubblica). `draft` = build modificato. */
export async function clientSaveDraft(draft: SiteBuild): Promise<{ ok: boolean; error?: string }> {
  const { project } = await requireClient();
  try {
    const admin = createAdminClient();
    const pdata = project.project_data || {};
    await admin.from('lab_projects').update({
      project_data: { ...pdata, client_draft: draft },
      client_draft_updated_at: new Date().toISOString(),
    }).eq('id', project.id);
    revalidatePath('/portal/content');
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore salvataggio.' }; }
}

/** Scarta la bozza cliente. */
export async function clientDiscardDraft(): Promise<{ ok: boolean }> {
  const { project } = await requireClient();
  try {
    const admin = createAdminClient();
    const pdata = { ...(project.project_data || {}) };
    delete pdata.client_draft;
    await admin.from('lab_projects').update({ project_data: pdata, client_draft_updated_at: null }).eq('id', project.id);
    revalidatePath('/portal'); return { ok: true };
  } catch { return { ok: false }; }
}

/** Pubblica la bozza: client_draft → build, deploy, clear draft. */
export async function clientPublishDraft(): Promise<{ ok: boolean; url?: string; testMode?: boolean; error?: string }> {
  const { project } = await requireClient();
  try {
    const admin = createAdminClient();
    const pdata = project.project_data || {};
    const draft = pdata.client_draft;
    if (!draft) return { ok: false, error: 'Nessuna modifica da pubblicare.' };
    const build = normalizeBuild(draft);

    const files = await exportSiteToStatic(build, project.id);
    const token = process.env.VERCEL_TOKEN;
    let url = pdata.publish?.url as string | undefined;
    let testMode = false;
    if (!token) {
      testMode = true;
      const baseDir = path.join(process.cwd(), 'public', 'published', project.id);
      const { writeFile, mkdir, rm } = await import('fs/promises');
      await rm(baseDir, { recursive: true, force: true }).catch(() => {});
      for (const f of files) { const full = path.join(baseDir, f.path); await mkdir(path.dirname(full), { recursive: true }); await writeFile(full, f.content); }
      url = `/published/${project.id}/index.html`;
    } else if (pdata.publish?.vercelProjectId) {
      const slug = `${process.env.VERCEL_PROJECT_PREFIX || 'lumino-client'}-${project.id.slice(0, 8)}`;
      const dep = await deploySite({ token, teamId: process.env.VERCEL_TEAM_ID || undefined }, slug, files);
      if (dep.ok && dep.url) url = dep.url;
    }

    const now = new Date().toISOString();
    const cleaned = { ...pdata, build, publish: { ...(pdata.publish || {}), url, publishedAt: now, testMode } };
    delete cleaned.client_draft;
    await admin.from('lab_projects').update({ project_data: cleaned, client_draft_updated_at: null, client_last_publish_at: now }).eq('id', project.id);
    revalidatePath('/portal');
    return { ok: true, url, testMode };
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore pubblicazione.' }; }
}

/** Upload libero foto cliente (max 10MB) → aggiunge a build.assets. */
export async function clientUploadAsset(formData: FormData): Promise<{ ok: boolean; asset?: ProjectAsset; error?: string }> {
  const { project } = await requireClient();
  const { uploadAsset } = await import('@/lib/lab/branding');
  const { randomUUID } = await import('crypto');
  try {
    const file = formData.get('file');
    if (!(file instanceof File)) return { ok: false, error: 'Nessun file.' };
    if (!file.type.startsWith('image/')) return { ok: false, error: 'Serve un\'immagine.' };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'Immagine troppo grande (max 10MB).' };
    const up = await uploadAsset(file, project.id);
    const asset: ProjectAsset = { id: randomUUID(), url: up.url, alt: (file.name || 'foto').replace(/\.[^.]+$/, ''), width: up.width, height: up.height, uploadedAt: new Date().toISOString(), tags: [] };
    const admin = createAdminClient();
    const build = normalizeBuild(project.project_data?.build);
    const assets = [...(build.assets || []), asset];
    await admin.from('lab_projects').update({ project_data: { ...(project.project_data || {}), build: { ...build, assets } } }).eq('id', project.id);
    return { ok: true, asset };
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore upload.' }; }
}

/* ── Messaggi ────────────────────────────────────────────────────── */

export async function getClientMessages(): Promise<ClientMessage[]> {
  const { project } = await requireClient();
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('lab_project_messages').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    return (data || []) as ClientMessage[];
  } catch { return []; }
}

export async function markMessageAction(id: string, status: 'new' | 'read' | 'replied' | 'archived'): Promise<{ ok: boolean }> {
  const { project } = await requireClient();
  try {
    const admin = createAdminClient();
    const patch: any = { status };
    if (status === 'read') patch.read_at = new Date().toISOString();
    if (status === 'replied') patch.replied_at = new Date().toISOString();
    await admin.from('lab_project_messages').update(patch).eq('id', id).eq('project_id', project.id);
    revalidatePath('/portal/messages'); return { ok: true };
  } catch { return { ok: false }; }
}

export async function deleteMessageAction(id: string): Promise<{ ok: boolean }> {
  const { project } = await requireClient();
  try {
    const admin = createAdminClient();
    await admin.from('lab_project_messages').delete().eq('id', id).eq('project_id', project.id);
    revalidatePath('/portal/messages'); return { ok: true };
  } catch { return { ok: false }; }
}

/* ── Abbonamento (read-only) ─────────────────────────────────────── */

export async function getClientSubscription(): Promise<{ subscription?: Subscription; invoices: Invoice[] }> {
  const { project } = await requireClient();
  try {
    const admin = createAdminClient();
    const { data: sub } = await admin.from('lab_subscriptions').select('*').eq('project_id', project.id).maybeSingle();
    const { data: inv } = await admin.from('lab_invoices').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    return { subscription: (sub as Subscription) || undefined, invoices: (inv || []) as Invoice[] };
  } catch { return { invoices: [] }; }
}

/* ── Settings ────────────────────────────────────────────────────── */

export async function changePasswordAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const { user } = await requireClient();
  const oldPw = String(formData.get('old') || '');
  const newPw = String(formData.get('new') || '');
  if (newPw.length < 8) return { error: 'La nuova password deve avere almeno 8 caratteri.' };
  const r = await updateClientPassword(user.id, oldPw, newPw);
  return r.ok ? { ok: true } : { error: r.error || 'Errore.' };
}

export async function updateNotificationsAction(notifyMessages: boolean, notifyBilling: boolean): Promise<{ ok: boolean }> {
  const { user } = await requireClient();
  try {
    const admin = createAdminClient();
    await admin.from('lab_client_users').update({ notify_new_messages: notifyMessages, notify_billing: notifyBilling, updated_at: new Date().toISOString() }).eq('id', user.id);
    return { ok: true };
  } catch { return { ok: false }; }
}

export async function completeOnboardingAction(): Promise<{ ok: boolean }> {
  const { user } = await requireClient();
  try {
    const admin = createAdminClient();
    await admin.from('lab_client_users').update({ onboarding_completed: true }).eq('id', user.id);
    return { ok: true };
  } catch { return { ok: false }; }
}
