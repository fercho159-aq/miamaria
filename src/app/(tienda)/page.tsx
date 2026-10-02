import Image from 'next/image'
import Link from 'next/link'
import { MapPin, MessageCircle, Package, Store, Truck } from 'lucide-react'
import { TarjetaProducto } from '@/components/tarjeta-producto'
import { ENVIO_GRATIS_DESDE, entregas, sitio } from '@/lib/config'
import { getCategorias, getProductos } from '@/lib/data'
import { precio } from '@/lib/format'

export default async function Inicio() {
  const [destacados, categorias] = await Promise.all([getProductos({ destacados: true }), getCategorias()])
  const conProductos = categorias.filter((c) => (c.productos ?? 0) > 0)
  const vitrina = destacados.length ? destacados.slice(0, 8) : (await getProductos()).slice(0, 8)

  return (
    <>
      {/* Portada: foto + mensaje de la tienda en Masaryk */}
      <section className="grid bg-marfil md:grid-cols-2">
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[640px]">
          <Image
            src="/images/hero-modelo.webp"
            alt="Modelo con collares en capas y dije de corazón Mía María"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[50%_25%]"
          />
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center md:py-10">
          <Image src="/images/logo-dorado.png" alt="Mía María · Arte México" width={781} height={979} priority className="aparecer h-auto w-28 sm:w-32" />
          <h1 className="aparecer mt-10 font-serif text-[2.1rem] leading-[1.12] tracking-wide uppercase sm:text-5xl" style={{ animationDelay: '.1s' }}>
            Ahora presentes en
            <br />
            Masaryk 998
          </h1>
          <p className="aparecer mt-4 font-serif text-2xl tracking-wide text-neutral-700 uppercase sm:text-3xl" style={{ animationDelay: '.2s' }}>
            Conoce nuestros productos
          </p>
          <div className="aparecer mt-10 flex flex-wrap justify-center gap-3" style={{ animationDelay: '.3s' }}>
            <Link href="/catalogo" className="btn-negro">
              Ver catálogo
            </Link>
            <a href={sitio.tienda.mapa} target="_blank" rel="noopener" className="btn-linea">
              Cómo llegar
            </a>
          </div>
        </div>
      </section>

      {/* Categorías */}
      {conProductos.length > 0 && (
        <section className="border-b border-hueso bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-10 gap-y-3 px-6 py-7">
            {conProductos.map((c) => (
              <Link key={c.slug} href={`/catalogo?categoria=${c.slug}`} className="eyebrow text-neutral-600 transition hover:text-oro-oscuro">
                {c.nombre}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Selección */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <p className="eyebrow text-oro-oscuro">Selección de la casa</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Piezas destacadas</h2>
          <div className="filete-oro mx-auto mt-6 w-40" />
        </div>
        {vitrina.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {vitrina.map((p) => (
              <TarjetaProducto key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <p className="text-center text-neutral-500">Muy pronto nuevas piezas.</p>
        )}
        <div className="mt-14 text-center">
          <Link href="/catalogo" className="btn-linea">
            Ver todo el catálogo
          </Link>
        </div>
      </section>

      {/* Cómo comprar */}
      <section className="bg-tinta text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="eyebrow text-oro">Así de fácil</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Cómo comprar</h2>
          </div>
          <ol className="grid gap-10 text-center sm:grid-cols-3">
            {[
              { icon: Package, t: 'Elige tus piezas', d: 'Agrega al carrito las piezas que te enamoren.' },
              { icon: MessageCircle, t: 'Envía tu pedido', d: 'Al finalizar, tu pedido se envía por WhatsApp con todo el detalle.' },
              { icon: Truck, t: 'Recíbelo', d: 'Confirmamos tu pago y lo preparas para recoger o te lo enviamos.' },
            ].map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="flex flex-col items-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-oro/50 text-oro">
                  <Icon size={22} strokeWidth={1.3} />
                </span>
                <p className="eyebrow mt-5 text-oro-claro">Paso {i + 1}</p>
                <h3 className="mt-2 font-serif text-2xl">{t}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/65">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Entregas */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="eyebrow text-oro-oscuro">Entregas</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Opciones de entrega</h2>
        </div>
        <div className="grid gap-px overflow-hidden border border-hueso bg-hueso sm:grid-cols-2 lg:grid-cols-4">
          {(Object.values(entregas) as (typeof entregas)[keyof typeof entregas][]).map((e, i) => {
            const Icon = [Store, Truck, Truck][i]
            return (
              <div key={e.titulo} className="bg-white p-8 text-center">
                <Icon className="mx-auto text-oro-oscuro" size={26} strokeWidth={1.2} />
                <h3 className="mt-4 font-serif text-2xl">{e.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-500">{e.detalle}</p>
                <p className="eyebrow mt-4">{e.costo ? precio(e.costo) : 'Gratis'}</p>
              </div>
            )
          })}
          <div className="bg-tinta p-8 text-center text-white">
            <span className="font-serif text-4xl text-oro">Gratis</span>
            <h3 className="mt-3 font-serif text-2xl">Envío sin costo</h3>
            <p className="mt-1 text-sm text-white/60">En compras mayores a {precio(ENVIO_GRATIS_DESDE)}</p>
            <p className="eyebrow mt-4 text-oro-claro">Automático</p>
          </div>
        </div>
      </section>

      {/* Visítanos */}
      <section id="visitanos" className="grid scroll-mt-28 bg-marfil md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[520px]">
          <Image src="/images/bolsa-empaque.webp" alt="Bolsa de regalo negra con el logo dorado de Mía María" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center px-8 py-16 sm:px-16">
          <p className="eyebrow text-oro-oscuro">Visítanos</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Nuestra tienda en Polanco</h2>
          <p className="mt-6 max-w-md leading-relaxed text-neutral-600">
            Conoce cada pieza en persona. Cada compra se entrega en nuestro empaque de regalo, lista para sorprender.
          </p>
          <p className="mt-6 flex items-start gap-3 text-sm">
            <MapPin size={18} className="mt-0.5 shrink-0 text-oro-oscuro" />
            {sitio.tienda.direccion}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={sitio.tienda.mapa} target="_blank" rel="noopener" className="btn-negro">
              Abrir en mapas
            </a>
            <a href={`https://wa.me/${sitio.whatsapp}`} target="_blank" rel="noopener" className="btn-linea">
              Escríbenos
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
