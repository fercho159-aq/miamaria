'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { ENVIO_GRATIS_DESDE } from '@/lib/config'
import { precio } from '@/lib/format'
import { useCarrito } from './carrito/carrito-context'

export function Encabezado({ categorias }: { categorias: { nombre: string; slug: string }[] }) {
  const { piezas, setAbierto, listo } = useCarrito()
  const [menu, setMenu] = useState(false)
  const pathname = usePathname()

  // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra el menú al navegar
  useEffect(() => setMenu(false), [pathname])

  const enlaces = [
    { href: '/catalogo', label: 'Catálogo' },
    ...categorias.slice(0, 5).map((c) => ({ href: `/catalogo?categoria=${c.slug}`, label: c.nombre })),
    { href: '/#visitanos', label: 'Visítanos' },
  ]

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-oro px-4 py-2 text-center text-[0.68rem] tracking-[0.2em] text-tinta uppercase">
        Envío gratis en compras mayores a {precio(ENVIO_GRATIS_DESDE).replace('.00', '')}
      </div>
      <div className="bg-tinta text-white">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <button type="button" className="p-2 lg:hidden" aria-label="Menú" onClick={() => setMenu((m) => !m)}>
            {menu ? <X size={22} strokeWidth={1.4} /> : <Menu size={22} strokeWidth={1.4} />}
          </button>

          <Link href="/" className="flex items-center gap-3" aria-label="Mía María, inicio">
            <Image src="/images/logo-simbolo.png" alt="" width={46} height={46} priority className="h-11 w-11 object-contain" />
            <span className="leading-none">
              <span className="block font-serif text-[1.65rem] tracking-wide text-oro">Mía María</span>
              <span className="mt-0.5 block text-[0.52rem] tracking-[0.42em] text-oro-claro/80 uppercase">Arte México</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {enlaces.map((e) => (
              <Link key={e.href} href={e.href} className="eyebrow text-white/80 transition hover:text-oro">
                {e.label}
              </Link>
            ))}
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
        {menu && (
          <nav className="border-t border-white/10 px-6 pb-6 lg:hidden">
            {enlaces.map((e) => (
              <Link key={e.href} href={e.href} className="eyebrow block border-b border-white/10 py-4 text-white/85">
                {e.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
