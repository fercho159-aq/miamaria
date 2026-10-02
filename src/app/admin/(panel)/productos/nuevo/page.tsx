import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCategorias } from '@/lib/data'
import { FormProducto } from '../form-producto'

export const metadata = { title: 'Nuevo producto' }

export default async function NuevoProducto() {
  const categorias = await getCategorias()
  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/productos" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-tinta">
        <ChevronLeft size={15} /> Productos
      </Link>
      <h1 className="font-serif text-4xl">Nuevo producto</h1>
      <FormProducto categorias={categorias} />
    </div>
  )
}
