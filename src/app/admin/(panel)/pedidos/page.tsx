import Link from 'next/link'
import { Search } from 'lucide-react'
import { estatusPedido, type EstatusPedido } from '@/lib/config'
import { getPedidos } from '@/lib/data'
import { TablaPedidos } from './tabla-pedidos'

export const metadata = { title: 'Pedidos' }

export default async function PedidosPage({ searchParams }: PageProps<'/admin/pedidos'>) {
  const sp = await searchParams
  const estatus = typeof sp.estatus === 'string' && sp.estatus in estatusPedido ? sp.estatus : undefined
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const pedidos = await getPedidos(estatus, q)
  // Los filtros de estatus conservan la búsqueda.
  const liga = (e?: string) => {
    const params = new URLSearchParams()
    if (e) params.set('estatus', e)
    if (q) params.set('q', q)
    const cadena = params.toString()
    return cadena ? `/admin/pedidos?${cadena}` : '/admin/pedidos'
  }

  const chip = (activo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs whitespace-nowrap transition ${
      activo ? 'border-tinta bg-tinta text-white' : 'border-neutral-300 bg-white hover:border-tinta'
    }`

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Pedidos</h1>
      <form className="flex max-w-md items-center border border-neutral-300 bg-white px-3 focus-within:border-tinta">
        <Search size={15} className="text-neutral-400" />
        {estatus && <input type="hidden" name="estatus" value={estatus} />}
        <input name="q" defaultValue={q} placeholder="Buscar por folio, nombre o teléfono" className="w-full px-2 py-2.5 text-sm outline-none" />
      </form>
      <nav className="flex gap-2 overflow-x-auto pb-1">
        <Link href={liga()} className={chip(!estatus)}>
          Todos
        </Link>
        {(Object.keys(estatusPedido) as EstatusPedido[]).map((e) => (
          <Link key={e} href={liga(e)} className={chip(estatus === e)}>
            {estatusPedido[e].label}
          </Link>
        ))}
      </nav>
      <TablaPedidos pedidos={pedidos} vacio={q ? 'No hay pedidos con esa búsqueda.' : 'No hay pedidos con este estatus.'} />
    </div>
  )
}
