import Link from 'next/link'
import { FileSpreadsheet, Plus, Search } from 'lucide-react'
import { FotoProducto } from '@/components/foto-producto'
import { getProductosAdmin } from '@/lib/data'
import { precio } from '@/lib/format'
import { StockRapido } from './stock-rapido'

export const metadata = { title: 'Productos' }

export default async function ProductosPage({ searchParams }: PageProps<'/admin/productos'>) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q : ''
  const productos = await getProductosAdmin(q)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">Productos</h1>
        <div className="flex gap-2">
          <Link href="/admin/importar" className="btn-linea !px-4 !py-2.5">
            <FileSpreadsheet size={15} /> Importar Excel
          </Link>
          <Link href="/admin/productos/nuevo" className="btn-negro !px-4 !py-2.5">
            <Plus size={15} /> Nuevo producto
          </Link>
        </div>
      </div>

      <form className="flex max-w-md items-center border border-neutral-300 bg-white px-3 focus-within:border-tinta">
        <Search size={15} className="text-neutral-400" />
        <input name="q" defaultValue={q} placeholder="Buscar por nombre o SKU" className="w-full px-2 py-2.5 text-sm outline-none" />
      </form>

      {productos.length === 0 ? (
        <p className="bg-white p-8 text-center text-sm text-neutral-500">No hay productos{q && ' con esa búsqueda'}.</p>
      ) : (
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                <th className="px-4 py-3 font-normal" colSpan={2}>
                  Producto
                </th>
                <th className="px-4 py-3 font-normal">Categoría</th>
                <th className="px-4 py-3 text-right font-normal">Precio</th>
                <th className="px-4 py-3 font-normal">Existencia</th>
                <th className="px-4 py-3 font-normal">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-marfil">
                  <td className="w-14 py-2 pl-4">
                    <div className="relative h-14 w-12 overflow-hidden bg-tinta">
                      <FotoProducto src={p.imagenUrl} alt="" sizes="48px" />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/productos/${p.id}`} className="font-medium hover:text-oro-oscuro">
                      {p.nombre}
                    </Link>
                    <span className="block text-xs text-neutral-400">{p.sku}</span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{p.categoria ?? '—'}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">{precio(p.precio)}</td>
                  <td className="px-4 py-2">
                    <StockRapido id={p.id} stock={p.stock} />
                  </td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">
                    {p.activo ? <span className="text-emerald-700">Visible</span> : <span className="text-neutral-400">Oculto</span>}
                    {p.destacado && <span className="ml-2 text-oro-oscuro">★ Destacado</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
