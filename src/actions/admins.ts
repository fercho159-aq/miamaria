'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import type { FormState } from './productos'

const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(200)

export async function cambiarPassword(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const actual = String(form.get('actual') ?? '')
  const nueva = password.safeParse(String(form.get('nueva') ?? ''))
  if (!nueva.success) return { error: nueva.error.issues[0].message }
  if (nueva.data !== String(form.get('repetir') ?? '')) return { error: 'Las contraseñas nuevas no coinciden' }

  const sql = getDb()
  const [a] = await sql`SELECT password_hash FROM admins WHERE id = ${admin.id}`
  if (!a || !(await bcrypt.compare(actual, a.password_hash))) return { error: 'La contraseña actual no es correcta' }
  await sql`UPDATE admins SET password_hash = ${await bcrypt.hash(nueva.data, 10)} WHERE id = ${admin.id}`
  return { ok: 'Contraseña actualizada' }
}

const nuevoAdmin = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre').max(80),
  email: z.string().trim().toLowerCase().email('Correo no válido'),
  password,
})

export async function crearAdmin(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const parsed = nuevoAdmin.safeParse({ nombre: form.get('nombre'), email: form.get('email'), password: form.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data
  const sql = getDb()
  const [existe] = await sql`SELECT 1 FROM admins WHERE email = ${d.email}`
  if (existe) return { error: 'Ya hay un acceso con ese correo' }
  await sql`INSERT INTO admins (email, password_hash, nombre) VALUES (${d.email}, ${await bcrypt.hash(d.password, 10)}, ${d.nombre})`
  revalidatePath('/admin/accesos')
  return { ok: `Acceso creado para ${d.email}` }
}

/** Activa o desactiva un acceso. Nadie puede desactivarse a sí mismo: así siempre queda uno activo. */
export async function activarAdmin(id: string, activo: boolean) {
  const admin = await requireAdmin()
  if (id === admin.id) return { error: 'No puedes desactivar tu propio acceso' }
  const sql = getDb()
  await sql`UPDATE admins SET activo = ${activo} WHERE id = ${id}`
  revalidatePath('/admin/accesos')
  return { ok: true }
}
