'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { ENVIO_GRATIS_DESDE } from '@/lib/config'
import { precio } from '@/lib/format'
import { FotoProducto } from '../foto-producto'
import { useCarrito } from './carrito-context'

/** Panel lateral que se abre al agregar un producto. */
export function CajonCarrito() {
  const { items, subtotal, abierto, setAbierto, cambiarCantidad, quitar } = useCarrito()
  const falta = ENVIO_GRATIS_DESDE - subtotal

  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [abierto, setAbierto])

  return (
    <div className={`fixed inset-0 z-50 ${abierto ? '' : 'pointer-events-none'}`} aria-hidden={!abierto}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setAbierto(false)}
      />
      <aside
        role="dialog"
        aria-label="Tu carrito"
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white transition-[transform,visibility] duration-300 ${abierto ? 'translate-x-0 shadow-2xl' : 'invisible translate-x-full'}`}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
          <h2 className="font-serif text-2xl">Tu carrito</h2>
          <button type="button" aria-label="Cerrar" onClick={() => setAbierto(false)} className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="font-serif text-xl text-neutral-500">Tu carrito está vacío</p>
            <Link href="/catalogo" className="btn-negro" onClick={() => setAbierto(false)}>
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-marfil px-6 py-3 text-center text-xs tracking-wide text-neutral-700">
              {falta > 0 ? (
                <>
                  Agrega más de <b>{precio(falta)}</b> y tu envío es gratis
                </>
              ) : (
                <>Tu pedido tiene <b>envío gratis</b></>
              )}
            </div>
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4 py-5">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-tinta">
                    <FotoProducto src={i.imagenUrl} alt={i.nombre} sizes="80px" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="font-serif text-lg leading-tight">{i.nombre}</p>
                      <button type="button" aria-label={`Quitar ${i.nombre}`} onClick={() => quitar(i.id)} className="self-start text-neutral-400 hover:text-tinta">
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500">{i.sku}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-neutral-200">
                        <button type="button" aria-label="Menos" className="p-1.5" onClick={() => cambiarCantidad(i.id, i.cantidad - 1)}>
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-sm">{i.cantidad}</span>
                        <button
                          type="button"
                          aria-label="Más"
                          className="p-1.5 disabled:opacity-30"
                          disabled={i.cantidad >= i.stock}
                          onClick={() => cambiarCantidad(i.id, i.cantidad + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-sm">{precio(i.precio * i.cantidad)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="space-y-4 border-t border-neutral-200 px-6 py-5">
              <div className="flex justify-between text-sm">
                <span className="eyebrow">Subtotal</span>
                <span className="font-medium">{precio(subtotal)}</span>
              </div>
              <p className="text-xs text-neutral-500">El envío se calcula en el siguiente paso.</p>
              <Link href="/carrito" className="btn-negro w-full" onClick={() => setAbierto(false)}>
                Finalizar pedido
              </Link>
              <button type="button" className="eyebrow w-full text-center text-neutral-500 underline-offset-4 hover:underline" onClick={() => setAbierto(false)}>
                Seguir comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
