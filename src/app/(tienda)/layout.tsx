import { CarritoProvider } from '@/components/carrito/carrito-context'
import { CajonCarrito } from '@/components/carrito/cajon-carrito'
import { Encabezado } from '@/components/encabezado'
import { Pie } from '@/components/pie'
import { getCategorias } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function TiendaLayout({ children }: LayoutProps<'/'>) {
  const categorias = (await getCategorias()).filter((c) => (c.productos ?? 0) > 0)
  const nav = categorias.map(({ nombre, slug }) => ({ nombre, slug }))
  return (
    <CarritoProvider>
      <Encabezado categorias={nav} />
      <main className="flex-1">{children}</main>
      <Pie categorias={nav} />
      <CajonCarrito />
    </CarritoProvider>
  )
}
