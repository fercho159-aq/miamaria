'use client'

import Link from 'next/link'
import { useActionState, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Check, CornerDownRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { crearCategoria, editarCategoria, eliminarCategoria, guardarGrupo, moverCategoria } from '@/actions/productos'
import type { Categoria } from '@/lib/data'

type Opcion = { id: number; ruta: string }

export function NuevaCategoria({ opciones }: { opciones: Opcion[] }) {
  const [state, action, pending] = useActionState(crearCategoria, undefined)
  return (
    <form action={action} className="space-y-3 bg-white p-5">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <input name="nombre" required placeholder="Nueva categoría, ej. Dijes" className="campo" />
        <select name="parentId" defaultValue="" aria-label="Dentro de" className="campo sm:max-w-56">
          <option value="">Categoría principal</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              Dentro de {o.ruta}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="btn-negro shrink-0 !px-5 !py-2">
          Agregar
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
    </form>
  )
}

export function FilaCategoria({
  categoria: c,
  primera,
  ultima,
  subcategorias,
  madres,
}: {
  categoria: Categoria
  primera: boolean
  ultima: boolean
  /** Cuántas categorías cuelgan de esta (a cualquier profundidad). */
  subcategorias: number
  /** Categorías que pueden ser su madre: todas menos ella y su propia rama. */
  madres: Opcion[]
}) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(c.nombre)
  const [madre, setMadre] = useState(c.parentId ? String(c.parentId) : '')
  const [clave, setClave] = useState(c.sku ?? '')
  const [existencia, setExistencia] = useState(c.existencia == null ? '' : String(c.existencia))
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const boton = 'p-2 text-neutral-400 hover:text-tinta disabled:opacity-25'
  const cancelar = () => {
    setEditando(false)
    setNombre(c.nombre)
    setMadre(c.parentId ? String(c.parentId) : '')
    setClave(c.sku ?? '')
    setExistencia(c.existencia == null ? '' : String(c.existencia))
    setError(null)
  }

  return (
    <li className={`flex flex-wrap items-center gap-2 py-3 pr-4 text-sm ${pending ? 'opacity-50' : ''}`} style={{ paddingLeft: `${1 + c.nivel * 1.5}rem` }}>
      {c.nivel > 0 && <CornerDownRight size={14} className="shrink-0 text-neutral-300" />}
      {editando ? (
        <>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo !w-auto min-w-0 flex-1 !py-1.5" autoFocus />
          <select value={madre} onChange={(e) => setMadre(e.target.value)} aria-label="Dentro de" className="campo !w-auto max-w-48 !py-1.5">
            <option value="">Categoría principal</option>
            {madres.map((o) => (
              <option key={o.id} value={o.id}>
                Dentro de {o.ruta}
              </option>
            ))}
          </select>
          <input
            value={clave}
            onChange={(e) => setClave(e.target.value.toUpperCase())}
            placeholder="Clave SICAR"
            aria-label="Clave SICAR"
            className="campo !w-28 !py-1.5 uppercase"
          />
          <input
            value={existencia}
            onChange={(e) => setExistencia(e.target.value)}
            type="number"
            step={1}
            placeholder="Existencia"
            aria-label="Existencia del grupo"
            disabled={!clave}
            className="campo !w-24 !py-1.5 disabled:opacity-40"
          />
          <button
            type="button"
            className={boton}
            aria-label="Guardar"
            onClick={() =>
              start(async () => {
                const r = await editarCategoria(c.id, nombre, madre ? Number(madre) : null)
                if (r?.error) return setError(r.error)
                const g = await guardarGrupo(c.id, clave, existencia === '' ? null : Number(existencia))
                if (g?.error) return setError(g.error)
                setError(null)
                setEditando(false)
              })
            }
          >
            <Check size={16} />
          </button>
          <button type="button" className={boton} aria-label="Cancelar" onClick={cancelar}>
            <X size={16} />
          </button>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1">
            {c.nombre} <span className="text-xs text-neutral-400">· {c.productos} producto{c.productos === 1 ? '' : 's'}</span>
            {c.sku && (
              <span className="ml-2 inline-block rounded-full bg-marfil px-2 py-0.5 text-xs text-neutral-600" title="Existencia compartida por todos sus modelos">
                {c.sku} · {c.existencia} pza{c.existencia === 1 ? '' : 's'}
              </span>
            )}
          </span>
          {c.sku && (
            <Link href={`/admin/productos/nuevo?categoria=${c.id}`} className={boton} aria-label={`Agregar modelo a ${c.nombre}`} title="Agregar modelo">
              <Plus size={16} />
            </Link>
          )}
          <button type="button" className={boton} aria-label="Subir" disabled={primera} onClick={() => start(() => moverCategoria(c.id, -1))}>
            <ArrowUp size={16} />
          </button>
          <button type="button" className={boton} aria-label="Bajar" disabled={ultima} onClick={() => start(() => moverCategoria(c.id, 1))}>
            <ArrowDown size={16} />
          </button>
          <button type="button" className={boton} aria-label="Editar" onClick={() => setEditando(true)}>
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className={`${boton} hover:!text-red-700`}
            aria-label="Eliminar"
            onClick={() => {
              const destino = c.parentId ? 'pasarán a su categoría madre' : 'quedarán sin categoría'
              const hijas = subcategorias ? ` Sus subcategorías ${c.parentId ? 'suben un nivel' : 'pasan a ser principales'}.` : ''
              if (confirm(`¿Eliminar la categoría “${c.nombre}”? Sus productos ${destino}.${hijas}`)) start(() => eliminarCategoria(c.id))
            }}
          >
            <Trash2 size={15} />
          </button>
        </>
      )}
      {error && <span className="w-full text-xs text-red-700">{error}</span>}
    </li>
  )
}
