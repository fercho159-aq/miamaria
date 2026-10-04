import Link from 'next/link'
import { Search } from 'lucide-react'
import { TarjetaProducto } from '@/components/tarjeta-producto'
import { getCategorias, getProductos } from '@/lib/data'
import { urlColeccion } from '@/lib/seo'

/** Catálogo completo (/catalogo) o una colección (/coleccion/[slug]), con búsqueda. */
export async function VistaCatalogo({ categoria, q, descripcion }: { categoria?: string; q?: string; descripcion?: string }) {
  const [productos, categorias] = await Promise.all([getProductos({ categoria, q }), getCategorias()])
  const actual = categorias.find((c) => c.slug === categoria)
  const visibles = categorias.filter((c) => (c.productos ?? 0) > 0)
  const base = categoria ? urlColeccion(categoria) : '/catalogo'
  const conQ = (ruta: string) => (q ? `${ruta}?q=${encodeURIComponent(q)}` : ruta)

  const chip = (activo: boolean) =>
    `eyebrow whitespace-nowrap border px-4 py-2 text-[0.62rem] transition ${
      activo ? 'border-tinta bg-tinta text-white' : 'border-neutral-300 text-neutral-600 hover:border-tinta'
    }`

  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 pb-24 sm:px-6">
      <header className="text-center">
        <p className="eyebrow text-oro-oscuro">Mía María</p>
        <h1 className="mt-3 font-serif text-5xl">{actual?.nombre ?? 'Catálogo'}</h1>
        <div className="filete-oro mx-auto mt-6 w-40" />
        {descripcion && <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-neutral-600">{descripcion}</p>}
      </header>

      <div className="mt-10 flex flex-col items-center gap-6">
        <nav className="flex max-w-full gap-2 overflow-x-auto pb-1">
          <Link href={conQ('/catalogo')} className={chip(!categoria)}>
            Todo
          </Link>
          {visibles.map((c) => (
            <Link
              key={c.slug}
              href={conQ(urlColeccion(c.slug))}
              className={chip(c.slug === categoria)}
            >
              {c.nombre}
            </Link>
          ))}
        </nav>
        <form id="buscar" action={base} className="flex w-full max-w-md scroll-mt-32 items-center border-b border-neutral-300 focus-within:border-tinta">
          <Search size={16} className="text-neutral-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o SKU"
            className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
          />
          {q && (
            <Link href={base} className="text-xs text-neutral-500 hover:text-tinta">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <p className="mt-10 mb-6 text-xs tracking-wide text-neutral-500">
        {productos.length} {productos.length === 1 ? 'pieza' : 'piezas'}
        {q && <> para “{q}”</>}
      </p>

      {productos.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => (
            <TarjetaProducto key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl text-neutral-500">No encontramos piezas con esa búsqueda.</p>
          <Link href="/catalogo" className="btn-linea mt-8">
            Ver todo el catálogo
          </Link>
        </div>
      )}
    </div>
  )
}
