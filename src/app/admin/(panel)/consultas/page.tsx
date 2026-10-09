import Link from 'next/link'
import { getConsultas } from '@/lib/data'
import { fechaHora } from '@/lib/format'

export const metadata = { title: 'Consultas' }

export default async function ConsultasPage() {
  const { porProducto, recientes } = await getConsultas()

  return (
    <div className="max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl">Consultas</h1>
        <p className="text-sm text-neutral-500">
          Cada vez que alguien toca “Consultar” o “Preguntar por WhatsApp” en un producto de la tienda. Sirve para saber qué piezas
          interesan más; el mensaje llega al WhatsApp de la tienda.
        </p>
      </div>

      {porProducto.length === 0 ? (
        <p className="bg-white p-8 text-center text-sm text-neutral-500">Aún no hay consultas registradas.</p>
      ) : (
        <>
          <section>
            <h2 className="mb-4 font-serif text-2xl">Piezas más consultadas (90 días)</h2>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                    <th className="px-5 py-3 font-normal">Producto</th>
                    <th className="px-5 py-3 text-right font-normal">Últimos 7 días</th>
                    <th className="px-5 py-3 text-right font-normal">Total</th>
                    <th className="px-5 py-3 font-normal">Última consulta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {porProducto.map((c) => (
                    <tr key={`${c.productoId}-${c.sku}`} className="hover:bg-marfil">
                      <td className="px-5 py-3">
                        {c.productoId ? (
                          <Link href={`/admin/productos/${c.productoId}`} className="font-medium hover:text-oro-oscuro">
                            {c.nombre}
                          </Link>
                        ) : (
                          <span className="font-medium">{c.nombre}</span>
                        )}
                        <span className="block text-xs text-neutral-400">
                          {c.sku}
                          {c.sinPrecio && <span className="text-amber-700"> · sin precio publicado</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">{c.semana}</td>
                      <td className="px-5 py-3 text-right">{c.total}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-neutral-500">{fechaHora(c.ultima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl">Más recientes</h2>
            <ul className="divide-y divide-neutral-100 bg-white text-sm">
              {recientes.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span>
                    {r.nombre} <span className="text-neutral-400">· {r.sku}</span>
                  </span>
                  <span className="text-xs whitespace-nowrap text-neutral-500">{fechaHora(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
