import { getCategorias } from '@/lib/data'
import { FilaCategoria, NuevaCategoria } from './controles'

export const metadata = { title: 'Categorías' }

export default async function CategoriasPage() {
  const categorias = await getCategorias()
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-4xl">Categorías</h1>
      <p className="text-sm text-neutral-500">El orden aquí es el orden en el menú de la tienda. Las categorías sin productos visibles no se muestran.</p>
      <NuevaCategoria />
      <ul className="divide-y divide-neutral-100 bg-white">
        {categorias.map((c, i) => (
          <FilaCategoria key={c.id} categoria={c} primera={i === 0} ultima={i === categorias.length - 1} />
        ))}
        {!categorias.length && <li className="p-6 text-center text-sm text-neutral-500">Aún no hay categorías.</li>}
      </ul>
    </div>
  )
}
