'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, FileSpreadsheet, Gem, LayoutDashboard, LogOut, ShoppingBag, Tags } from 'lucide-react'
import { salir } from '@/actions/auth'

const enlaces = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard, exacto: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/productos', label: 'Productos', icon: Gem },
  { href: '/admin/categorias', label: 'Categorías', icon: Tags },
  { href: '/admin/importar', label: 'Importar Excel', icon: FileSpreadsheet },
]

export function NavPanel({ nombre, pendientes }: { nombre: string; pendientes: number }) {
  const pathname = usePathname()
  return (
    <aside className="bg-tinta text-white/80 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image src="/images/logo-simbolo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <p className="font-serif text-xl text-oro">Mía María</p>
          <p className="text-[0.65rem] tracking-[0.2em] text-white/40 uppercase">Panel</p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
        {enlaces.map(({ href, label, icon: Icon, exacto }) => {
          const activo = exacto ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm whitespace-nowrap transition ${
                activo ? 'bg-white/10 text-oro' : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} strokeWidth={1.5} />
              {label}
              {href === '/admin/pedidos' && pendientes > 0 && (
                <span className="ml-auto rounded-full bg-oro px-2 text-xs font-medium text-tinta">{pendientes}</span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto flex gap-1 border-t border-white/10 p-3 lg:block lg:space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-white/5">
          <ExternalLink size={16} strokeWidth={1.5} /> Ver tienda
        </Link>
        <form action={salir}>
          <button type="submit" className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm hover:bg-white/5">
            <LogOut size={16} strokeWidth={1.5} /> Salir
          </button>
        </form>
        <p className="hidden truncate px-3 pt-2 text-xs text-white/35 lg:block">{nombre}</p>
      </div>
    </aside>
  )
}
