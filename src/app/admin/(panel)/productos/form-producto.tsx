'use client'

import Image from 'next/image'
import { startTransition, useActionState, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { eliminarProducto, guardarProducto } from '@/actions/productos'
import type { Categoria, Producto } from '@/lib/data'

export function FormProducto({ producto, categorias, creado }: { producto?: Producto; categorias: Categoria[]; creado?: boolean }) {
  const [state, action, pending] = useActionState(guardarProducto, creado ? { ok: 'Producto creado' } : undefined)
  const [preview, setPreview] = useState<string | null>(producto?.imagenUrl ?? null)
  const [quitar, setQuitar] = useState(false)

  return (
    <form
      // Sin `action={}` para que un error no borre lo capturado (React reinicia el formulario).
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => action(data))
      }}
      className="grid gap-6 lg:grid-cols-[1fr_300px]"
    >
      {producto && <input type="hidden" name="id" value={producto.id} />}
      <div className="space-y-5 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <label>
            <span className="mb-1.5 block text-sm">SKU *</span>
            <input name="sku" required defaultValue={producto?.sku} className="campo uppercase" />
          </label>
          <label>
            <span className="mb-1.5 block text-sm">Nombre *</span>
            <input name="nombre" required defaultValue={producto?.nombre} className="campo" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm">Descripción</span>
          <textarea name="descripcion" rows={5} defaultValue={producto?.descripcion} className="campo" />
        </label>
        <div className="grid gap-5 sm:grid-cols-3">
          <label>
            <span className="mb-1.5 block text-sm">Categoría</span>
            <select name="categoriaId" defaultValue={producto?.categoriaId ?? ''} className="campo">
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm">Precio (MXN) *</span>
            <input name="precio" required type="number" min={0} step="0.01" defaultValue={producto?.precio} className="campo" />
          </label>
          <label>
            <span className="mb-1.5 block text-sm">Existencia *</span>
            <input name="stock" required type="number" step={1} defaultValue={producto?.stock ?? 1} className="campo" />
          </label>
        </div>
        <div className="flex flex-wrap gap-8 pt-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="activo" defaultChecked={producto?.activo ?? true} className="h-4 w-4 accent-tinta" />
            Visible en la tienda
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="destacado" defaultChecked={producto?.destacado ?? false} className="h-4 w-4 accent-tinta" />
            Destacado en inicio
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-5">
          <p className="mb-3 text-sm">Foto</p>
          <label className="relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden border border-dashed border-neutral-300 bg-marfil text-neutral-400 hover:border-tinta">
            {preview && !quitar ? (
              <Image src={preview} alt="" fill sizes="300px" className="object-cover" unoptimized />
            ) : (
              <span className="flex flex-col items-center gap-2 text-xs">
                <ImagePlus size={28} strokeWidth={1.2} /> Elegir foto
              </span>
            )}
            <input
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  setPreview(URL.createObjectURL(f))
                  setQuitar(false)
                }
              }}
            />
          </label>
          <p className="mt-2 text-xs text-neutral-500">JPG, PNG o WEBP, hasta 5 MB. Ideal vertical 4:5.</p>
          {producto?.imagenUrl && (
            <label className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
              <input type="checkbox" name="quitarFoto" checked={quitar} onChange={(e) => setQuitar(e.target.checked)} />
              Quitar foto
            </label>
          )}
        </div>

        {state?.error && <p className="border-l-2 border-red-700 bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
        {state?.ok && <p className="border-l-2 border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-800">{state.ok}</p>}

        <button type="submit" disabled={pending} className="btn-negro w-full">
          {pending && <Loader2 size={15} className="animate-spin" />}
          {producto ? 'Guardar cambios' : 'Crear producto'}
        </button>
        {producto && (
          <button
            type="button"
            className="w-full py-2 text-xs text-red-700 hover:underline"
            onClick={() => {
              if (confirm(`¿Eliminar “${producto.nombre}”? Si ya tiene pedidos, solo se ocultará de la tienda.`)) {
                eliminarProducto(producto.id)
              }
            }}
          >
            Eliminar producto
          </button>
        )}
      </div>
    </form>
  )
}
