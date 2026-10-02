'use client'

import { useState, useTransition } from 'react'
import { ajustarStockRapido } from '@/actions/productos'

/** Cambia la existencia desde la lista, sin abrir el producto. */
export function StockRapido({ id, stock }: { id: number; stock: number }) {
  const [valor, setValor] = useState(String(stock))
  const [pending, start] = useTransition()
  const cambiado = valor !== String(stock)

  const guardar = () => {
    const n = Number(valor)
    if (!cambiado || !Number.isInteger(n)) return setValor(String(stock))
    start(() => ajustarStockRapido(id, n))
  }

  return (
    <input
      type="number"
      step={1}
      value={valor}
      disabled={pending}
      onChange={(e) => setValor(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
      aria-label="Existencia"
      className={`w-20 border px-2 py-1 text-sm outline-none focus:border-tinta ${
        stock <= 0 ? 'border-red-200 text-red-700' : stock <= 2 ? 'border-amber-200 text-amber-800' : 'border-neutral-200'
      } ${pending ? 'opacity-50' : ''}`}
    />
  )
}
