import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { getCategorias, getProductoAdmin } from '@/lib/data'
import { FormProducto } from '../form-producto'

export default async function EditarProducto({ params, searchParams }: PageProps<'/admin/productos/[id]'>) {
  const id = Number((await params).id)
  const [producto, categorias] = await Promise.all([Number.isInteger(id) ? getProductoAdmin(id) : null, getCategorias()])
  if (!producto) notFound()
  const creado = (await searchParams).creado === '1'

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/productos" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-tinta">
        <ChevronLeft size={15} /> Productos
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">{producto.nombre}</h1>
        {producto.activo && (
          <Link href={`/producto/${encodeURIComponent(producto.sku)}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-oro-oscuro hover:underline">
            Ver en la tienda <ExternalLink size={14} />
          </Link>
        )}
      </div>
      <FormProducto key={producto.id} producto={producto} categorias={categorias} creado={creado} />
    </div>
  )
}
