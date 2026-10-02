'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCarrito, type ItemCarrito } from './carrito-context'

export function BotonAgregar({
  producto,
  variante = 'completo',
}: {
  producto: Omit<ItemCarrito, 'cantidad'>
  variante?: 'completo' | 'compacto'
}) {
  const { agregar, items } = useCarrito()
  const [cantidad, setCantidad] = useState(1)
  const enCarrito = items.find((i) => i.sku === producto.sku)?.cantidad ?? 0
  const disponible = producto.stock - enCarrito
  const agotado = producto.stock <= 0

  if (variante === 'compacto') {
    return (
      <button
        type="button"
        disabled={disponible <= 0}
        onClick={() => agregar(producto, 1)}
        className="eyebrow w-full border border-tinta/80 py-2.5 text-[0.62rem] transition hover:bg-tinta hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent"
      >
        {agotado ? 'Agotado' : disponible <= 0 ? 'En tu carrito' : 'Agregar'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {!agotado && (
        <div className="flex items-center gap-4">
          <span className="eyebrow text-neutral-500">Cantidad</span>
          <div className="flex items-center border border-neutral-300">
            <button
              type="button"
              aria-label="Menos"
              className="p-2.5 disabled:opacity-30"
              disabled={cantidad <= 1}
              onClick={() => setCantidad((c) => c - 1)}
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm">{cantidad}</span>
            <button
              type="button"
              aria-label="Más"
              className="p-2.5 disabled:opacity-30"
              disabled={cantidad >= disponible}
              onClick={() => setCantidad((c) => c + 1)}
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-xs text-neutral-500">
            {producto.stock <= 3 ? `Solo ${producto.stock} disponible${producto.stock === 1 ? '' : 's'}` : 'Disponible'}
          </span>
        </div>
      )}
      <button
        type="button"
        className="btn-negro w-full"
        disabled={disponible <= 0}
        onClick={() => {
          agregar(producto, Math.min(cantidad, disponible))
          setCantidad(1)
        }}
      >
        <ShoppingBag size={15} strokeWidth={1.5} />
        {agotado ? 'Agotado' : disponible <= 0 ? 'Ya tienes todas en tu carrito' : 'Agregar al carrito'}
      </button>
    </div>
  )
}
