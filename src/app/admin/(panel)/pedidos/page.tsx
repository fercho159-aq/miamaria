import Link from 'next/link'
import { estatusPedido, type EstatusPedido } from '@/lib/config'
import { getPedidos } from '@/lib/data'
import { TablaPedidos } from './tabla-pedidos'

export const metadata = { title: 'Pedidos' }

export default async function PedidosPage({ searchParams }: PageProps<'/admin/pedidos'>) {
  const sp = await searchParams
  const estatus = typeof sp.estatus === 'string' && sp.estatus in estatusPedido ? sp.estatus : undefined
  const pedidos = await getPedidos(estatus)

  const chip = (activo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs whitespace-nowrap transition ${
      activo ? 'border-tinta bg-tinta text-white' : 'border-neutral-300 bg-white hover:border-tinta'
    }`

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Pedidos</h1>
      <nav className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/pedidos" className={chip(!estatus)}>
          Todos
        </Link>
        {(Object.keys(estatusPedido) as EstatusPedido[]).map((e) => (
          <Link key={e} href={`/admin/pedidos?estatus=${e}`} className={chip(estatus === e)}>
            {estatusPedido[e].label}
          </Link>
        ))}
      </nav>
      <TablaPedidos pedidos={pedidos} vacio="No hay pedidos con este estatus." />
    </div>
  )
}
