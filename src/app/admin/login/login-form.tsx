'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { login } from '@/actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)
  return (
    <form action={action} className="mt-8 space-y-4 bg-white p-8">
      <label className="block">
        <span className="mb-1.5 block text-sm">Correo</span>
        <input name="email" type="email" required autoComplete="username" className="campo" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm">Contraseña</span>
        <input name="password" type="password" required autoComplete="current-password" className="campo" />
      </label>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-negro w-full">
        {pending && <Loader2 size={15} className="animate-spin" />} Entrar
      </button>
    </form>
  )
}
