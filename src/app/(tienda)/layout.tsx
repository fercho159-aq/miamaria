import { CarritoProvider } from '@/components/carrito/carrito-context'
import { CajonCarrito } from '@/components/carrito/cajon-carrito'
import { Encabezado } from '@/components/encabezado'
import { Pie } from '@/components/pie'
import { getCategorias } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function TiendaLayout({ children }: LayoutProps<'/'>) {
  // El menú muestra las categorías principales; las subcategorías aparecen dentro de cada colección.
  const categorias = (await getCategorias()).filter((c) => c.parentId === null && (c.productos ?? 0) > 0)
  const nav = categorias.map(({ nombre, slug }) => ({ nombre, slug }))
  const menu = categorias.map(({ nombre, slug, imagen }) => ({ nombre, slug, imagen: imagen ?? null }))
  return (
    <CarritoProvider>
      <Encabezado categorias={menu} />
      <main className="flex-1">{children}</main>
      <Pie categorias={nav} />
      <CajonCarrito />
    </CarritoProvider>
  )
}
