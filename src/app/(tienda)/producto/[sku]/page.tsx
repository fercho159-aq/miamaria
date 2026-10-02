import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Gift, MessageCircle, Store, Truck } from 'lucide-react'
import { BotonAgregar } from '@/components/carrito/boton-agregar'
import { GaleriaProducto } from '@/components/galeria-producto'
import { TarjetaProducto } from '@/components/tarjeta-producto'
import { ENVIO_GRATIS_DESDE, sitio } from '@/lib/config'
import { getProducto, getProductos } from '@/lib/data'
import { precio } from '@/lib/format'
import { urlWhatsApp } from '@/lib/whatsapp'

export async function generateMetadata({ params }: PageProps<'/producto/[sku]'>): Promise<Metadata> {
  const p = await getProducto(decodeURIComponent((await params).sku))
  if (!p) return { title: 'Producto no encontrado' }
  return {
    title: p.nombre,
    description: p.descripcion || `${p.nombre} · ${precio(p.precio)}`,
    openGraph: p.imagenUrl ? { images: [p.imagenUrl] } : undefined,
  }
}

export default async function ProductoPage({ params }: PageProps<'/producto/[sku]'>) {
  const p = await getProducto(decodeURIComponent((await params).sku))
  if (!p) notFound()
  const relacionados = p.categoriaSlug
    ? (await getProductos({ categoria: p.categoriaSlug })).filter((r) => r.id !== p.id).slice(0, 4)
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6">
      <nav className="mb-8 text-xs text-neutral-500">
        <Link href={p.categoriaSlug ? `/catalogo?categoria=${p.categoriaSlug}` : '/catalogo'} className="inline-flex items-center gap-1 hover:text-tinta">
          <ChevronLeft size={14} /> {p.categoria ?? 'Catálogo'}
        </Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        <GaleriaProducto nombre={p.nombre} fotos={[p.imagenUrl, p.imagen2Url].filter((f): f is string => !!f)} />

        <div className="md:py-6">
          {p.categoria && <p className="eyebrow text-oro-oscuro">{p.categoria}</p>}
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{p.nombre}</h1>
          <p className="mt-4 text-2xl tracking-wide">{precio(p.precio)}</p>
          <p className="mt-1 text-xs text-neutral-500">SKU {p.sku}</p>
          <div className="filete-oro my-8" />
          {p.descripcion && <p className="leading-relaxed whitespace-pre-line text-neutral-700">{p.descripcion}</p>}

          <div className="mt-8">
            <BotonAgregar producto={{ sku: p.sku, nombre: p.nombre, precio: p.precio, imagenUrl: p.imagenUrl, stock: p.stock }} />
          </div>
          <a
            href={urlWhatsApp(`Hola Mía María, me interesa la pieza ${p.nombre} (${p.sku}).`)}
            target="_blank"
            rel="noopener"
            className="eyebrow mt-4 inline-flex items-center gap-2 text-neutral-600 hover:text-tinta"
          >
            <MessageCircle size={15} /> Preguntar por WhatsApp
          </a>

          <ul className="mt-10 space-y-4 border-t border-hueso pt-8 text-sm text-neutral-600">
            <li className="flex gap-3">
              <Store size={18} className="shrink-0 text-oro-oscuro" strokeWidth={1.4} /> Recógelo gratis en {sitio.tienda.corta}
            </li>
            <li className="flex gap-3">
              <Truck size={18} className="shrink-0 text-oro-oscuro" strokeWidth={1.4} /> Envío gratis en compras mayores a {precio(ENVIO_GRATIS_DESDE)}
            </li>
            <li className="flex gap-3">
              <Gift size={18} className="shrink-0 text-oro-oscuro" strokeWidth={1.4} /> Se entrega en empaque de regalo Mía María
            </li>
          </ul>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-10 text-center font-serif text-3xl sm:text-4xl">También te puede gustar</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {relacionados.map((r) => (
              <TarjetaProducto key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
