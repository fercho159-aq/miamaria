// Aplica db/migrations a la base de producción (Neon).
//   npm run db:migrar
import './env.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW())')
const done = new Set((await pool.query('select name from schema_migrations')).rows.map((r) => r.name))
for (const file of fs.readdirSync('db/migrations').filter((f) => f.endsWith('.sql')).sort()) {
  if (done.has(file)) continue
  console.log('Aplicando', file)
  await pool.query(fs.readFileSync(path.join('db/migrations', file), 'utf8'))
  await pool.query('insert into schema_migrations (name) values ($1)', [file])
}
await pool.end()
console.log('Base al día.')
