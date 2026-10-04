'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, MapPin, Menu, MessageCircle, Search, ShoppingBag, X } from 'lucide-react'
import { ENVIO_GRATIS_DESDE, sitio } from '@/lib/config'
import { precio } from '@/lib/format'
import { urlColeccion } from '@/lib/seo'
import { useCarrito } from './carrito/carrito-context'

export interface CategoriaMenu {
  nombre: string
  slug: string
  imagen: string | null
}

// Fotos de la casa para completar el menú cuando una categoría aún no tiene foto.
const FOTOS_CASA = ['/images/aretes-nacar.webp', '/images/anillo-nudo-mano.webp', '/images/brazalete-turquesa.webp', '/images/collar-corazon.webp', '/images/bolsa-empaque.webp']

export function Encabezado({ categorias }: { categorias: CategoriaMenu[] }) {
  const { piezas, setAbierto, listo } = useCarrito()
  const [mega, setMega] = useState(false)
  const [lateral, setLateral] = useState(false)
  const pathname = usePathname()
  const cierre = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra los menús al navegar
    setMega(false)
    setLateral(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMega(false)
        setLateral(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = lateral ? 'hidden' : ''
    return () => document.removeEventListener('keydown', onKey)
  }, [lateral])

  const abrirMega = () => {
    if (cierre.current) clearTimeout(cierre.current)
    setMega(true)
  }
  const cerrarMega = () => {
    cierre.current = setTimeout(() => setMega(false), 180)
  }

  const conFoto = categorias.map((c, i) => ({ ...c, foto: c.imagen ?? FOTOS_CASA[i % FOTOS_CASA.length] }))
  const tarjetas = conFoto.length
    ? conFoto.slice(0, 3)
    : [{ nombre: 'Nuevas piezas', slug: '', imagen: null, foto: FOTOS_CASA[0] }, { nombre: 'Lo más deseado', slug: '', imagen: null, foto: FOTOS_CASA[1] }, { nombre: 'Para regalar', slug: '', imagen: null, foto: FOTOS_CASA[4] }]
  const hrefCat = (slug: string) => (slug ? urlColeccion(slug) : '/catalogo')

  return (
    <header className="sticky top-0 z-40" onMouseLeave={cerrarMega}>
      <div className="bg-oro px-4 py-2 text-center text-[0.68rem] tracking-[0.2em] text-tinta uppercase">
        Envío gratis en compras mayores a {precio(ENVIO_GRATIS_DESDE).replace('.00', '')}
      </div>

      <div className="relative bg-tinta text-white">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <button type="button" className="p-2 lg:hidden" aria-label="Abrir menú" aria-expanded={lateral} onClick={() => setLateral(true)}>
            <Menu size={22} strokeWidth={1.4} />
          </button>

          <Link href="/" className="flex items-center gap-3" aria-label="Mía María, inicio">
            <Image src="/images/logo-simbolo.png" alt="" width={46} height={46} priority className="h-11 w-11 object-contain" />
            <span className="leading-none">
              <span className="block font-serif text-[1.65rem] tracking-wide text-oro">Mía María</span>
              <span className="mt-0.5 block text-[0.52rem] tracking-[0.42em] text-oro-claro/80 uppercase">Arte México</span>
            </span>
          </Link>

          <nav className="hidden h-full items-center gap-9 lg:flex">
            <button
              type="button"
              onMouseEnter={abrirMega}
              onFocus={abrirMega}
              onClick={() => setMega((m) => !m)}
              aria-expanded={mega}
              className={`eyebrow flex h-full items-center gap-1.5 border-b transition duration-500 ${mega ? 'border-oro text-oro' : 'border-transparent text-white/80 hover:text-oro'}`}
            >
              Colecciones <ChevronDown size={13} className={`transition duration-500 ${mega ? 'rotate-180' : ''}`} />
            </button>
            <Link href="/catalogo" onMouseEnter={cerrarMega} className="eyebrow text-white/80 transition duration-500 hover:text-oro">
              Catálogo
            </Link>
            <Link href="/#casa" onMouseEnter={cerrarMega} className="eyebrow text-white/80 transition duration-500 hover:text-oro">
              La casa
            </Link>
            <Link href="/#visitanos" onMouseEnter={cerrarMega} className="eyebrow text-white/80 transition duration-500 hover:text-oro">
              Visítanos
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/catalogo#buscar" className="hidden p-2 text-white/80 hover:text-oro sm:block" aria-label="Buscar">
              <Search size={20} strokeWidth={1.4} />
            </Link>
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="relative p-2 text-white/90 hover:text-oro"
              aria-label={`Carrito, ${piezas} piezas`}
            >
              <ShoppingBag size={22} strokeWidth={1.4} />
              {listo && piezas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-oro px-1 text-[0.65rem] font-medium text-tinta">
                  {piezas}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega menú (escritorio) */}
        <div
          onMouseEnter={abrirMega}
          className={`absolute inset-x-0 top-full hidden border-t border-oro/20 bg-white text-tinta shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] transition-all duration-700 ease-out lg:block ${
            mega ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
          }`}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-12 gap-10 px-6 py-12">
            <div className="col-span-3 flex flex-col">
              <p className="eyebrow mb-6 text-oro-oscuro">Colecciones</p>
              <ul className="space-y-3.5">
                {categorias.map((c) => (
                  <li key={c.slug}>
                    <Link href={hrefCat(c.slug)} className="group flex items-center justify-between font-serif text-2xl transition duration-500 hover:text-oro-oscuro">
                      {c.nombre}
                      <ArrowRight size={16} strokeWidth={1.2} className="-translate-x-2 opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
                {!categorias.length && <li className="font-serif text-xl text-neutral-500">Muy pronto</li>}
              </ul>
              <Link href="/catalogo" className="eyebrow mt-auto inline-flex items-center gap-2 pt-8 text-neutral-600 hover:text-tinta">
                Ver todo el catálogo <ArrowRight size={14} strokeWidth={1.3} />
              </Link>
            </div>

            <div className="col-span-6 grid grid-cols-3 gap-4">
              {tarjetas.map((t, i) => (
                <Link key={t.nombre} href={hrefCat(t.slug)} className="group relative block aspect-[3/4] overflow-hidden bg-tinta">
                  <Image
                    src={t.foto}
                    alt={t.nombre}
                    fill
                    sizes="16vw"
                    className={`object-cover transition duration-[1800ms] ease-out group-hover:scale-110 ${mega ? 'scale-100' : 'scale-105'}`}
                    style={{ transitionDelay: mega ? `${i * 90}ms` : '0ms' }}
                    unoptimized={t.foto.startsWith('/uploads/')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="font-serif text-2xl">{t.nombre}</p>
                    <p className="eyebrow mt-1 text-[0.58rem] text-oro-claro opacity-0 transition duration-700 group-hover:opacity-100">Descubrir</p>
                  </div>
                </Link>
              ))}
            </div>

            <Link href="/#visitanos" className="group relative col-span-3 block overflow-hidden bg-tinta">
              <Image
                src="/images/hero-modelo.webp"
                alt="Visita la tienda Mía María en Masaryk 998"
                fill
                sizes="22vw"
                className="object-cover object-[50%_30%] opacity-80 transition duration-[1800ms] ease-out group-hover:scale-105 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="eyebrow text-oro-claro">Ahora presentes en</p>
                <p className="mt-2 font-serif text-3xl">{sitio.tienda.corta}</p>
                <p className="eyebrow mt-4 inline-flex items-center gap-2 text-[0.6rem] text-white/80">
                  Visítanos <ArrowRight size={12} />
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Menú lateral vertical (celular y tableta) */}
      <div className={`fixed inset-0 z-50 lg:hidden ${lateral ? '' : 'pointer-events-none'}`} aria-hidden={!lateral}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-700 ${lateral ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setLateral(false)}
        />
        <aside
          role="dialog"
          aria-label="Menú"
          className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-tinta text-white transition-[transform,visibility] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            lateral ? 'translate-x-0' : 'invisible -translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <Image src="/images/logo-dorado.png" alt="Mía María" width={781} height={979} className="h-auto w-14" />
            <button type="button" aria-label="Cerrar menú" onClick={() => setLateral(false)} className="p-2 text-white/80">
              <X size={22} strokeWidth={1.3} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-6 [scrollbar-color:rgba(203,166,102,0.35)_transparent] [scrollbar-width:thin]">
            <p className="eyebrow mb-4 text-oro">Colecciones</p>
            <ul className="space-y-3">
              {conFoto.map((c, i) => (
                <li
                  key={c.slug}
                  className={`transition-all duration-700 ease-out ${lateral ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                  style={{ transitionDelay: lateral ? `${150 + i * 70}ms` : '0ms' }}
                >
                  <Link href={hrefCat(c.slug)} className="flex items-center gap-4">
                    <span className="relative h-16 w-14 shrink-0 overflow-hidden bg-carbon">
                      <Image src={c.foto} alt="" fill sizes="56px" className="object-cover" unoptimized={c.foto.startsWith('/uploads/')} />
                    </span>
                    <span className="font-serif text-2xl">{c.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="filete-oro my-8 opacity-50" />

            <ul className="space-y-5">
              {[
                { href: '/', label: 'Inicio' },
                { href: '/catalogo', label: 'Todo el catálogo' },
                { href: '/#casa', label: 'La casa' },
                { href: '/#visitanos', label: 'Visítanos' },
              ].map((e, i) => (
                <li
                  key={e.href}
                  className={`transition-all duration-700 ease-out ${lateral ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                  style={{ transitionDelay: lateral ? `${300 + (conFoto.length + i) * 60}ms` : '0ms' }}
                >
                  <Link href={e.href} className="eyebrow text-white/80">
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-10 space-y-3 border-t border-white/10 pt-6 text-sm text-white/70">
              <a href={sitio.tienda.mapa} target="_blank" rel="noopener" className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-oro" /> {sitio.tienda.direccion}
              </a>
              <a href={`https://wa.me/${sitio.whatsapp}`} target="_blank" rel="noopener" className="flex items-center gap-3">
                <MessageCircle size={16} className="text-oro" /> Escríbenos por WhatsApp
              </a>
            </div>
          </nav>

        </aside>
      </div>
    </header>
  )
}
