'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export interface ItemCarrito {
  sku: string
  nombre: string
  precio: number
  imagenUrl: string | null
  stock: number
  cantidad: number
}

interface CarritoCtx {
  items: ItemCarrito[]
  piezas: number
  subtotal: number
  listo: boolean
  abierto: boolean
  setAbierto: (v: boolean) => void
  agregar: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void
  cambiarCantidad: (sku: string, cantidad: number) => void
  quitar: (sku: string) => void
  limitar: (ajustes: { sku: string; disponible: number }[]) => void
  vaciar: () => void
}

const Ctx = createContext<CarritoCtx | null>(null)
const KEY = 'miamaria-carrito-v1'

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([])
  const [listo, setListo] = useState(false)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al montar
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setListo(true)
  }, [])

  useEffect(() => {
    if (!listo) return
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {}
  }, [items, listo])

  const agregar = useCallback<CarritoCtx['agregar']>((item, cantidad = 1) => {
    setItems((prev) => {
      const actual = prev.find((i) => i.sku === item.sku)
      if (actual) {
        return prev.map((i) =>
          i.sku === item.sku ? { ...i, ...item, cantidad: Math.min(i.cantidad + cantidad, item.stock) } : i,
        )
      }
      return [...prev, { ...item, cantidad: Math.min(cantidad, item.stock) }]
    })
    setAbierto(true)
  }, [])

  const cambiarCantidad = useCallback((sku: string, cantidad: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.sku === sku ? { ...i, cantidad: Math.max(0, Math.min(cantidad, i.stock)) } : i))
        .filter((i) => i.cantidad > 0),
    )
  }, [])

  const quitar = useCallback((sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku)), [])

  const limitar = useCallback((ajustes: { sku: string; disponible: number }[]) => {
    const m = new Map(ajustes.map((a) => [a.sku, a.disponible]))
    setItems((prev) =>
      prev
        .map((i) => (m.has(i.sku) ? { ...i, stock: m.get(i.sku)!, cantidad: Math.min(i.cantidad, m.get(i.sku)!) } : i))
        .filter((i) => i.cantidad > 0),
    )
  }, [])

  const vaciar = useCallback(() => setItems([]), [])

  const value = useMemo<CarritoCtx>(
    () => ({
      items,
      piezas: items.reduce((s, i) => s + i.cantidad, 0),
      subtotal: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
      listo,
      abierto,
      setAbierto,
      agregar,
      cambiarCantidad,
      quitar,
      limitar,
      vaciar,
    }),
    [items, listo, abierto, agregar, cambiarCantidad, quitar, limitar, vaciar],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCarrito() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCarrito fuera de CarritoProvider')
  return ctx
}
