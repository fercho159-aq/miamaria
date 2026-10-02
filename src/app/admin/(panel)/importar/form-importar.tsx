'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { importarExcel } from '@/actions/importar'

export function FormImportar() {
  const [state, action, pending] = useActionState(importarExcel, undefined)
  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap items-center gap-3 bg-white p-6">
        <input
          type="file"
          name="archivo"
          required
          accept=".xlsx,.xls,.csv"
          className="flex-1 text-sm file:mr-4 file:border-0 file:bg-marfil file:px-4 file:py-2.5 file:text-sm"
        />
        <button type="submit" disabled={pending} className="btn-negro !py-2.5">
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Importar
        </button>
      </form>

      {state && !state.ok && <p className="border-l-2 border-red-700 bg-red-50 p-4 text-sm text-red-800">{state.error}</p>}
      {state?.ok && (
        <div className="space-y-2 border-l-2 border-emerald-700 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>
            <b>Listo.</b> {state.creados} producto{state.creados === 1 ? '' : 's'} nuevo{state.creados === 1 ? '' : 's'} y{' '}
            {state.actualizados} actualizado{state.actualizados === 1 ? '' : 's'}.
          </p>
          {state.categoriasNuevas.length > 0 && <p>Categorías nuevas: {state.categoriasNuevas.join(', ')}.</p>}
          {state.omitidos.length > 0 && (
            <div className="text-amber-900">
              <p>Filas que no se importaron:</p>
              <ul className="list-disc pl-5">
                {state.omitidos.slice(0, 30).map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/admin/productos" className="inline-block pt-1 underline">
            Ver productos
          </Link>
        </div>
      )}
    </div>
  )
}
