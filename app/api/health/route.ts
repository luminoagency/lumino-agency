import { NextResponse } from 'next/server';

/** Lightweight health check. */
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
