// Conexión para scripts de línea de comandos.
//   DB_MODE=local → la base local de demostración (.pglite), con sus migraciones al día.
//   (por omisión)  → la base de producción (DATABASE_URL de .env.local).
import fs from 'node:fs'
import path from 'node:path'

export const local = process.env.DB_MODE === 'local'

export async function conectar() {
  if (local) {
    const { PGlite } = await import('@electric-sql/pglite')
    const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto')
    const db = await PGlite.create('.pglite', { extensions: { pgcrypto } })
    await db.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW())')
    const hechas = new Set((await db.query('select name from local_migrations')).rows.map((r) => r.name))
    for (const f of fs.readdirSync('db/migrations').filter((f) => f.endsWith('.sql')).sort()) {
      if (hechas.has(f)) continue
      await db.exec(fs.readFileSync(path.join('db/migrations', f), 'utf8'))
      await db.query('insert into local_migrations (name) values ($1)', [f])
    }
    return { query: (t, p) => db.query(t, p), cerrar: () => db.close() }
  }
  await import('./env.mjs')
  const { Pool } = await import('@neondatabase/serverless')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return { query: (t, p) => pool.query(t, p), cerrar: () => pool.end() }
}

export const slugify = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Slug libre para una categoría (mismo criterio que src/lib/categorias.ts). */
export async function slugLibre(db, nombre, parentId) {
  const libre = async (s) => !(await db.query('select 1 from categorias where slug = $1', [s])).rows.length
  const base = slugify(nombre) || 'categoria'
  if (await libre(base)) return base
  let cand = base
  if (parentId) {
    const m = (await db.query('select slug from categorias where id = $1', [parentId])).rows[0]
    if (m) cand = `${m.slug}-${base}`
    if (await libre(cand)) return cand
  }
  for (let n = 2; ; n++) if (await libre(`${cand}-${n}`)) return `${cand}-${n}`
}
