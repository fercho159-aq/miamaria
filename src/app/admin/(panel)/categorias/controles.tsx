'use client'

import { useActionState, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Trash2, X } from 'lucide-react'
import { crearCategoria, eliminarCategoria, moverCategoria, renombrarCategoria } from '@/actions/productos'
import type { Categoria } from '@/lib/data'

export function NuevaCategoria() {
  const [state, action, pending] = useActionState(crearCategoria, undefined)
  return (
    <form action={action} className="bg-white p-5">
      <div className="flex gap-2">
        <input name="nombre" required placeholder="Nueva categoría, ej. Dijes" className="campo" />
        <button type="submit" disabled={pending} className="btn-negro shrink-0 !px-5 !py-2">
          Agregar
        </button>
      </div>
      {state?.error && <p className="mt-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-sm text-emerald-700">{state.ok}</p>}
    </form>
  )
}

export function FilaCategoria({ categoria: c, primera, ultima }: { categoria: Categoria; primera: boolean; ultima: boolean }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(c.nombre)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const boton = 'p-2 text-neutral-400 hover:text-tinta disabled:opacity-25'

  return (
    <li className={`flex items-center gap-2 px-4 py-3 text-sm ${pending ? 'opacity-50' : ''}`}>
      {editando ? (
        <>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo !py-1.5" autoFocus />
          <button
            type="button"
            className={boton}
            aria-label="Guardar"
            onClick={() =>
              start(async () => {
                const r = await renombrarCategoria(c.id, nombre)
                if (r?.error) setError(r.error)
                else {
                  setError(null)
                  setEditando(false)
                }
              })
            }
          >
            <Check size={16} />
          </button>
          <button type="button" className={boton} aria-label="Cancelar" onClick={() => (setEditando(false), setNombre(c.nombre), setError(null))}>
            <X size={16} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1">
            {c.nombre} <span className="text-xs text-neutral-400">· {c.productos} producto{c.productos === 1 ? '' : 's'}</span>
          </span>
          <button type="button" className={boton} aria-label="Subir" disabled={primera} onClick={() => start(() => moverCategoria(c.id, -1))}>
            <ArrowUp size={16} />
          </button>
          <button type="button" className={boton} aria-label="Bajar" disabled={ultima} onClick={() => start(() => moverCategoria(c.id, 1))}>
            <ArrowDown size={16} />
          </button>
          <button type="button" className={boton} aria-label="Renombrar" onClick={() => setEditando(true)}>
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className={`${boton} hover:!text-red-700`}
            aria-label="Eliminar"
            onClick={() => {
              if (confirm(`¿Eliminar la categoría “${c.nombre}”? Sus productos quedarán sin categoría.`)) start(() => eliminarCategoria(c.id))
            }}
          >
            <Trash2 size={15} />
          </button>
        </>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </li>
  )
}
