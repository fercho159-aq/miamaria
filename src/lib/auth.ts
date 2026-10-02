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

export async function getAdmin() {
  const s = await getSession()
  if (!s.isLoggedIn || !s.adminId) return null
  return { id: s.adminId, email: s.email!, nombre: s.nombre! }
}

/** Para páginas y server actions del panel: exige sesión iniciada. */
export async function requireAdmin() {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
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
