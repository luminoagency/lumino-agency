import ResetClient from './ResetClient';

export const dynamic = 'force-dynamic';

export default function Page({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 p-6"
        style={{ background: 'var(--lumino-muted, rgba(255,255,255,0.06))' }}
      >
        <ResetClient token={searchParams.token || ''} />
      </div>
    </div>
  );
}
