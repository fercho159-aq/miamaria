import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, MessageCircle, Package, Store, Truck } from 'lucide-react'
import { CarruselHorizontal } from '@/components/carruseles/carrusel-horizontal'
import { GaleriaVertical, MarquesinaTexto, TiraImagenes, type ImagenGaleria } from '@/components/carruseles/marquesinas'
import { CarruselPortada, type DiapositivaPortada } from '@/components/carruseles/portada'
import { JsonLd } from '@/components/json-ld'
import { TarjetaProducto } from '@/components/tarjeta-producto'
import { ENVIO_GRATIS_DESDE, entregas, sitio } from '@/lib/config'
import { getCategorias, getProductos } from '@/lib/data'
import { precio } from '@/lib/format'
import { datosSitio, datosTienda, urlColeccion } from '@/lib/seo'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/', type: 'website', locale: 'es_MX', siteName: 'Mía María · Arte México', images: [{ url: '/images/og-miamaria.jpg', width: 1200, height: 630 }] },
}

const portada: DiapositivaPortada[] = [
  {
    imagen: '/images/hero-modelo.webp',
    alt: 'Modelo con collares en capas y dije de corazón Mía María',
    posicion: '50% 22%',
    titulo: ['Ahora presentes en', 'Masaryk 998'],
    subtitulo: 'Conoce nuestros productos',
    cta: { href: '/catalogo', label: 'Ver catálogo' },
    cta2: { href: sitio.tienda.mapa, label: 'Cómo llegar', externo: true },
  },
  {
    imagen: '/images/aretes-nacar.webp',
    alt: 'Aretes largos de nácar con hoja de oro',
    posicion: '50% 45%',
    eyebrow: 'Colección de autor',
    titulo: ['Piezas que', 'se heredan'],
    subtitulo: 'Nácar, oro y paciencia',
    cta: { href: '/catalogo', label: 'Descubrir' },
  },
  {
    imagen: '/images/anillo-nudo-mano.webp',
    alt: 'Mano con anillo de nudo dorado con pavé',
    posicion: '50% 60%',
    eyebrow: 'Anillos',
    titulo: ['Esculturas', 'para tus manos'],
    subtitulo: 'Oro pulido y pavé',
    cta: { href: '/catalogo', label: 'Ver anillos' },
  },
  {
    imagen: '/images/brazalete-turquesa.webp',
    alt: 'Brazalete dorado con medallón de sol y turquesa',
    posicion: '50% 55%',
    eyebrow: 'Arte México',
    titulo: ['El sol', 'en tu muñeca'],
    subtitulo: 'Brazaletes con alma mexicana',
    cta: { href: '/catalogo', label: 'Ver brazaletes' },
  },
  {
    imagen: '/images/bolsa-empaque.webp',
    alt: 'Bolsa de regalo negra con el logo dorado de Mía María',
    posicion: '50% 50%',
    eyebrow: 'Para regalar',
    titulo: ['Cada pieza llega', 'lista para sorprender'],
    subtitulo: 'En nuestro empaque de regalo',
    cta: { href: '/catalogo', label: 'Elegir un regalo' },
  },
]

const fotosCasa: ImagenGaleria[] = [
  { src: '/images/aretes-nacar.webp', alt: 'Aretes de nácar con hoja de oro' },
  { src: '/images/anillo-nudo-mano.webp', alt: 'Anillo de nudo dorado puesto' },
  { src: '/images/anillo-nudo.webp', alt: 'Anillo de nudo dorado con pavé' },
  { src: '/images/hero-modelo.webp', alt: 'Modelo con collares Mía María' },
  { src: '/images/brazalete-turquesa.webp', alt: 'Brazalete con turquesa' },
  { src: '/images/bolsa-empaque.webp', alt: 'Empaque de regalo Mía María' },
  { src: '/images/collar-corazon.webp', alt: 'Collar con dije de corazón pavé' },
]

export default async function Inicio() {
  const [todos, categorias] = await Promise.all([getProductos(), getCategorias()])
  const destacados = todos.filter((p) => p.destacado)
  const vitrina = (destacados.length >= 4 ? destacados : todos).slice(0, 12)
  const colecciones = categorias.filter((c) => (c.productos ?? 0) > 0)

  // Galerías: fotos de la casa + fotos de productos (sin repetir).
  const deProductos: ImagenGaleria[] = todos
    .filter((p) => p.imagenUrl)
    .map((p) => ({ src: p.imagenUrl!, alt: p.nombre, href: `/producto/${encodeURIComponent(p.sku)}` }))
  const vistas = new Set<string>()
  const galeria = [...deProductos, ...fotosCasa].filter((g) => !vistas.has(g.src) && vistas.add(g.src))

  return (
    <>
      <JsonLd data={datosTienda()} />
      <JsonLd data={datosSitio()} />
      <h1 className="sr-only">Mía María · Joyería de autor en Polanco, Ciudad de México</h1>
      <CarruselPortada diapositivas={portada} />

      <MarquesinaTexto frases={['Arte México', 'Joyería de autor', `Ahora en ${sitio.tienda.corta}`, 'Hecho para brillar', 'Envíos a todo México']} />

      {/* Selección: carrusel horizontal */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mb-14 flex flex-col items-center text-center">
          <p className="eyebrow text-oro-oscuro">Selección de la casa</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-6xl">Piezas destacadas</h2>
          <div className="filete-oro mt-6 w-40" />
        </div>
        {vitrina.length ? (
          <CarruselHorizontal>
            {vitrina.map((p) => (
              <TarjetaProducto key={p.id} p={p} />
            ))}
          </CarruselHorizontal>
        ) : (
          <p className="text-center font-serif text-2xl text-neutral-500">Muy pronto nuevas piezas.</p>
        )}
      </section>

      {/* Colecciones */}
      {colecciones.length > 0 && (
        <section className="bg-tinta py-24 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <p className="eyebrow text-oro">Explora</p>
              <h2 className="mt-3 font-serif text-4xl sm:text-6xl">Colecciones</h2>
            </div>
            <div className={`grid gap-4 sm:gap-5 ${colecciones.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {colecciones.slice(0, 8).map((c, i) => (
                <Link key={c.slug} href={urlColeccion(c.slug)} className="group relative block aspect-[3/4] overflow-hidden bg-carbon">
                  <Image
                    src={c.imagen ?? fotosCasa[i % fotosCasa.length].src}
                    alt={c.nombre}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover opacity-90 transition duration-[2200ms] ease-out group-hover:scale-110 group-hover:opacity-100"
                    unoptimized={c.imagen?.startsWith('/uploads/')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                    <p className="font-serif text-2xl sm:text-3xl">{c.nombre}</p>
                    <p className="eyebrow mt-2 flex items-center gap-2 text-[0.58rem] text-oro-claro">
                      {c.productos} {c.productos === 1 ? 'pieza' : 'piezas'}
                      <ArrowRight size={12} className="-translate-x-1 opacity-0 transition duration-700 group-hover:translate-x-0 group-hover:opacity-100" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* La casa: galería vertical */}
      <section id="casa" className="scroll-mt-28 bg-marfil">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[5fr_7fr]">
          <div className="lg:pr-6">
            <p className="eyebrow text-oro-oscuro">La casa</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-6xl">
              Arte que se
              <br />
              lleva puesto
            </h2>
            <div className="mt-8 h-px w-32 bg-oro" />
            <p className="mt-8 max-w-md text-lg leading-relaxed text-neutral-600">
              En Mía María cada pieza se elige por su carácter: metales con baño de oro, nácar, piedras y formas inspiradas en
              México. Joyería para usar todos los días y para guardar para siempre.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-negro">
                Ver catálogo
              </Link>
              <Link href="#visitanos" className="btn-linea">
                Visítanos
              </Link>
            </div>
          </div>
          <GaleriaVertical imagenes={galeria} />
        </div>
      </section>

      {/* Cómo comprar */}
      <section className="bg-tinta text-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <p className="eyebrow text-oro">Así de fácil</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-6xl">Cómo comprar</h2>
          </div>
          <ol className="grid gap-12 text-center sm:grid-cols-3">
            {[
              { icon: Package, t: 'Elige tus piezas', d: 'Agrega al carrito las piezas que te enamoren.' },
              { icon: MessageCircle, t: 'Envía tu pedido', d: 'Al finalizar, tu pedido llega por WhatsApp con todo el detalle.' },
              { icon: Truck, t: 'Recíbelo', d: 'Confirmamos tu pago y lo recoges en tienda o te lo enviamos.' },
            ].map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="flex flex-col items-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-oro/40 text-oro">
                  <Icon size={22} strokeWidth={1.2} />
                </span>
                <p className="eyebrow mt-6 text-oro-claro">Paso {i + 1}</p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl">{t}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/60">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Entregas */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="eyebrow text-oro-oscuro">Entregas</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-6xl">Opciones de entrega</h2>
        </div>
        <div className="grid gap-px overflow-hidden border border-hueso bg-hueso sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(entregas).map((e, i) => {
            const Icon = [Store, Truck, Truck][i]
            return (
              <div key={e.titulo} className="bg-white p-9 text-center">
                <Icon className="mx-auto text-oro-oscuro" size={26} strokeWidth={1.1} />
                <h3 className="mt-5 font-serif text-2xl">{e.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-500">{e.detalle}</p>
                <p className="eyebrow mt-5">{e.costo ? precio(e.costo) : 'Gratis'}</p>
              </div>
            )
          })}
          <div className="bg-tinta p-9 text-center text-white">
            <span className="font-serif text-4xl text-oro">Gratis</span>
            <h3 className="mt-3 font-serif text-2xl">Envío sin costo</h3>
            <p className="mt-1 text-sm text-white/60">En compras mayores a {precio(ENVIO_GRATIS_DESDE)}</p>
            <p className="eyebrow mt-5 text-oro-claro">Automático</p>
          </div>
        </div>
      </section>

      {/* Tira horizontal de fotos */}
      <section className="pb-24">
        <div className="mb-10 text-center">
          <p className="eyebrow text-oro-oscuro">#MíaMaría</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-5xl">Brilla a tu manera</h2>
        </div>
        <TiraImagenes imagenes={galeria} />
      </section>

      {/* Visítanos */}
      <section id="visitanos" className="grid scroll-mt-28 bg-marfil md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[560px]">
          <Image src="/images/bolsa-empaque.webp" alt="Bolsa de regalo negra con el logo dorado de Mía María" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center px-8 py-16 sm:px-16">
          <p className="eyebrow text-oro-oscuro">Visítanos</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-6xl">Nuestra tienda en Polanco</h2>
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
