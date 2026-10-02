'use server'

import { redirect } from 'next/navigation'
import { authenticate, logout } from '@/lib/auth'

export async function login(_: { error?: string } | undefined, form: FormData) {
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')
  if (!email || !password) return { error: 'Escribe tu correo y contraseña' }
  const res = await authenticate(email, password)
  if (res.error) return { error: res.error }
  redirect('/admin')
}

export async function salir() {
  await logout()
  redirect('/admin/login')
}
