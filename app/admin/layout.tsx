import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Lumino' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {children}
    </div>
  )
}
