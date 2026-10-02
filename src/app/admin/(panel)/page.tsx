import Link from 'next/link'
import { getPedidos, getProductosAdmin, getResumen } from '@/lib/data'
import { precio } from '@/lib/format'
import { TablaPedidos } from './pedidos/tabla-pedidos'

export default async function PanelInicio() {
  const [r, pendientes, productos] = await Promise.all([getResumen(), getPedidos('pendiente'), getProductosAdmin()])
  const bajos = productos.filter((p) => p.activo && p.stock <= 2).slice(0, 8)

  const tarjetas = [
    { label: 'Pedidos por confirmar', valor: r.pendientes, href: '/admin/pedidos?estatus=pendiente' },
    { label: 'Ventas del mes', valor: precio(r.ventasMes), href: '/admin/pedidos?estatus=pagado' },
    { label: 'Pedidos pagados (mes)', valor: r.vendidosMes, href: '/admin/pedidos' },
    { label: 'Productos activos', valor: r.productos, href: '/admin/productos' },
  ]

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-4xl">Inicio</h1>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tarjetas.map((t) => (
          <Link key={t.label} href={t.href} className="bg-white p-5 transition hover:shadow-md">
            <p className="text-xs text-neutral-500">{t.label}</p>
            <p className="mt-2 font-serif text-3xl">{t.valor}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Pre-órdenes por confirmar</h2>
          <Link href="/admin/pedidos" className="text-sm text-oro-oscuro hover:underline">
            Ver todos
          </Link>
        </div>
        <TablaPedidos pedidos={pendientes.slice(0, 10)} vacio="No hay pedidos pendientes." />
      </section>

      {bajos.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl">Existencia baja</h2>
          <ul className="divide-y divide-neutral-100 bg-white">
            {bajos.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/productos/${p.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-marfil">
                  <span>
                    {p.nombre} <span className="text-neutral-400">· {p.sku}</span>
                  </span>
                  <span className={p.stock <= 0 ? 'text-red-700' : 'text-amber-700'}>
                    {p.stock <= 0 ? 'Agotado' : `${p.stock} pza${p.stock === 1 ? '' : 's'}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
