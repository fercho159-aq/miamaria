import Link from 'next/link'
import { entregas, estatusPedido, type EstatusPedido, type MetodoEntrega } from '@/lib/config'
import type { PedidoResumen } from '@/lib/data'
import { fechaHora, precio } from '@/lib/format'

export function EtiquetaEstatus({ estatus }: { estatus: string }) {
  const e = estatusPedido[estatus as EstatusPedido]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap ${e?.color ?? ''}`}>{e?.label ?? estatus}</span>
}

export function TablaPedidos({ pedidos, vacio }: { pedidos: PedidoResumen[]; vacio: string }) {
  if (!pedidos.length) return <p className="bg-white p-8 text-center text-sm text-neutral-500">{vacio}</p>
  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
            <th className="px-5 py-3 font-normal">Folio</th>
            <th className="px-5 py-3 font-normal">Cliente</th>
            <th className="px-5 py-3 font-normal">Entrega</th>
            <th className="px-5 py-3 font-normal">Fecha</th>
            <th className="px-5 py-3 text-right font-normal">Total</th>
            <th className="px-5 py-3 font-normal">Estatus</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {pedidos.map((p) => (
            <tr key={p.id} className="hover:bg-marfil">
              <td className="px-5 py-3 font-medium whitespace-nowrap">
                <Link href={`/admin/pedidos/${p.id}`} className="hover:text-oro-oscuro">
                  {p.folio}
                </Link>
              </td>
              <td className="px-5 py-3">
                <Link href={`/admin/pedidos/${p.id}`} className="block">
                  {p.clienteNombre}
                  <span className="block text-xs text-neutral-400">{p.clienteTel}</span>
                </Link>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">{entregas[p.entrega as MetodoEntrega]?.titulo ?? p.entrega}</td>
              <td className="px-5 py-3 whitespace-nowrap text-neutral-500">{fechaHora(p.createdAt)}</td>
              <td className="px-5 py-3 text-right whitespace-nowrap">
                {precio(p.total)}
                <span className="block text-xs text-neutral-400">
                  {p.piezas} pza{p.piezas === 1 ? '' : 's'}
                </span>
              </td>
              <td className="px-5 py-3">
                <EtiquetaEstatus estatus={p.estatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
