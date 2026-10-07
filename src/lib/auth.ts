import 'server-only'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { getDb } from './db'
import { sessionOptions, type SessionData } from './session'

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions())
}

/** Administrador de la sesión, solo si sigue activo en la base. */
export async function getAdmin() {
  const s = await getSession()
  if (!s.isLoggedIn || !s.adminId) return null
  const sql = getDb()
  const [a] = await sql`SELECT id, email, nombre FROM admins WHERE id = ${s.adminId} AND activo LIMIT 1`
  if (!a) return null
  return { id: a.id as string, email: a.email as string, nombre: a.nombre as string }
}

/** Para páginas y server actions del panel: exige sesión iniciada. */
export async function requireAdmin() {
  const admin = await getAdmin()
  // /admin/salir borra la cookie: una sesión de un acceso desactivado no puede quedarse en un ciclo con el login.
  if (!admin) redirect('/admin/salir')
  return admin
}

export async function authenticate(email: string, password: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT id, email, password_hash, nombre, activo FROM admins
    WHERE email = ${email.toLowerCase().trim()} LIMIT 1
  `
  const admin = rows[0]
  if (!admin || !admin.activo || !(await bcrypt.compare(password, admin.password_hash))) {
    return { error: 'Correo o contraseña incorrectos' }
  }
  const s = await getSession()
  s.adminId = admin.id
  s.email = admin.email
  s.nombre = admin.nombre
  s.isLoggedIn = true
  await s.save()
  return { ok: true }
}

export async function logout() {
  const s = await getSession()
  s.destroy()
}
