'use client'

import { useActionState, useState, useTransition } from 'react'
import { activarAdmin, cambiarPassword, crearAdmin } from '@/actions/admins'
import type { AdminFila } from '@/lib/data'

function Mensajes({ state }: { state: { error?: string; ok?: string } | undefined }) {
  return (
    <>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
    </>
  )
}

export function CambiarPassword({ email }: { email: string }) {
  const [state, action, pending] = useActionState(cambiarPassword, undefined)
  return (
    <form action={action} className="space-y-4 bg-white p-5">
      {/* Para que el gestor de contraseñas del navegador sepa de qué cuenta es. */}
      <input type="email" name="email" value={email} readOnly autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden />
      <label className="block">
        <span className="mb-1.5 block text-sm">Contraseña actual</span>
        <input name="actual" type="password" required autoComplete="current-password" className="campo" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm">Nueva contraseña</span>
          <input name="nueva" type="password" required minLength={8} autoComplete="new-password" className="campo" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm">Repetir nueva contraseña</span>
          <input name="repetir" type="password" required minLength={8} autoComplete="new-password" className="campo" />
        </label>
      </div>
      <Mensajes state={state} />
      <button type="submit" disabled={pending} className="btn-negro !px-5 !py-2">
        Cambiar contraseña
      </button>
    </form>
  )
}

export function FilaAdmin({ admin: a, soyYo }: { admin: AdminFila; soyYo: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <li className={`flex flex-wrap items-center gap-3 px-5 py-3 text-sm ${pending ? 'opacity-50' : ''}`}>
      <span className="min-w-0 flex-1">
        {a.nombre} {soyYo && <span className="text-xs text-neutral-400">(tú)</span>}
        <span className="block truncate text-xs text-neutral-400">{a.email}</span>
      </span>
      <span className={`text-xs ${a.activo ? 'text-emerald-700' : 'text-neutral-400'}`}>{a.activo ? 'Activo' : 'Desactivado'}</span>
      {!soyYo && (
        <button
          type="button"
          disabled={pending}
          className="text-xs underline-offset-4 hover:underline"
          onClick={() => {
            if (a.activo && !confirm(`¿Desactivar el acceso de ${a.nombre}? Ya no podrá entrar al panel.`)) return
            start(async () => {
              const r = await activarAdmin(a.id, !a.activo)
              setError(r?.error ?? null)
            })
          }}
        >
          {a.activo ? 'Desactivar' : 'Reactivar'}
        </button>
      )}
      {error && <span className="w-full text-xs text-red-700">{error}</span>}
    </li>
  )
}

export function NuevoAdmin() {
  const [state, action, pending] = useActionState(crearAdmin, undefined)
  return (
    <form action={action} className="space-y-4 bg-white p-5">
      <p className="text-sm font-medium">Dar acceso a otra persona</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm">Nombre</span>
          <input name="nombre" required className="campo" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm">Correo</span>
          <input name="email" type="email" required autoComplete="off" className="campo" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm">Contraseña inicial (8 caracteres o más)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="campo" />
      </label>
      <p className="text-xs text-neutral-500">Compártela en persona; después puede cambiarla en esta misma sección.</p>
      <Mensajes state={state} />
      <button type="submit" disabled={pending} className="btn-negro !px-5 !py-2">
        Crear acceso
      </button>
    </form>
  )
}
