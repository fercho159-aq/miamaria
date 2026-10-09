import { getCategorias } from '@/lib/data'
import { FilaCategoria, NuevaCategoria } from './controles'

export const metadata = { title: 'Categorías' }

export default async function CategoriasPage() {
  const categorias = await getCategorias()
  const opciones = categorias.map((c) => ({ id: c.id, ruta: c.ruta }))

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-4xl">Categorías</h1>
      <p className="text-sm text-neutral-500">
        Una categoría puede ir dentro de otra (por ejemplo Collares › Plata). El menú de la tienda muestra las principales, en este
        orden; las subcategorías aparecen dentro de su colección. Las que no tienen productos visibles no se muestran.
      </p>
      <NuevaCategoria opciones={opciones} />
      <ul className="divide-y divide-neutral-100 bg-white">
        {categorias.map((c, i) => {
          const hermanas = categorias.filter((x) => x.parentId === c.parentId)
          // La lista viene en orden de árbol: la rama de c son las siguientes con mayor nivel.
          let fin = i + 1
          while (fin < categorias.length && categorias[fin].nivel > c.nivel) fin++
          const rama = new Set(categorias.slice(i, fin).map((x) => x.id))
          return (
            <FilaCategoria
              key={c.id}
              categoria={c}
              primera={hermanas[0].id === c.id}
              ultima={hermanas[hermanas.length - 1].id === c.id}
              subcategorias={fin - i - 1}
              madres={opciones.filter((o) => !rama.has(o.id))}
            />
          )
        })}
        {!categorias.length && <li className="p-6 text-center text-sm text-neutral-500">Aún no hay categorías.</li>}
      </ul>
    </div>
  )
}
