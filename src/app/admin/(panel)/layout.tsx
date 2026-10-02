import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { getResumen } from '@/lib/data'
import { NavPanel } from './nav-panel'

export const metadata: Metadata = { title: { default: 'Panel', template: '%s · Panel Mía María' }, robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const { pendientes } = await getResumen()
  return (
    <div className="flex min-h-screen flex-col bg-marfil lg:flex-row">
      <NavPanel nombre={admin.nombre} pendientes={pendientes} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12">{children}</main>
    </div>
  )
}
