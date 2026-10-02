// Crea (o cambia la contraseña de) un administrador en la base de producción.
//   npm run admin:crear -- correo@dominio.com "Contraseña segura" "Nombre"
import './env.mjs'
import bcrypt from 'bcryptjs'
import { Pool } from '@neondatabase/serverless'

const [email, password, nombre = 'Administrador'] = process.argv.slice(2)
if (!email || !password || password.length < 8) {
  console.error('Uso: npm run admin:crear -- correo contraseña(8+ caracteres) [nombre]')
  process.exit(1)
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
await pool.query(
  `insert into admins (email, password_hash, nombre) values ($1, $2, $3)
   on conflict (email) do update set password_hash = excluded.password_hash, nombre = excluded.nombre, activo = true`,
  [email.toLowerCase().trim(), await bcrypt.hash(password, 10), nombre],
)
await pool.end()
console.log('Administrador listo:', email)
