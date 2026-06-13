import { type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Open-pixel endpoint. Embedded as a 1×1 image in the HTML part of every
 * outreach email. When an email client loads the image, we record opened_at.
 *
 * The DB update is awaited (not fire-and-forget) to avoid early function
 * termination in serverless. The pixel response is returned regardless of
 * whether the update succeeds — the recipient must not see an error.
 *
 * No auth: the token itself is the credential (unique, unguessable UUID).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 43-byte 1×1 transparent GIF.
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;

  try {
    const db = createAdminClient();
    await db
      .from('emails_sent')
      .update({ opened_at: new Date().toISOString(), opened: true })
      .eq('token', token)
      .is('opened_at', null); // idempotent — first load only
  } catch {
    // Non-critical: always return the pixel.
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  });
}
