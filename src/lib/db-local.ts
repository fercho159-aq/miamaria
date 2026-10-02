import fs from 'node:fs'
import path from 'node:path'
import { PGlite, types } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import type { Row } from './db'

type Global = typeof globalThis & { __miamariaPglite?: Promise<PGlite> }

// Mismos tipos que el driver de Neon: NUMERIC y BIGINT como texto.
const parsers = {
  [types.NUMERIC]: (v: string) => v,
  [types.INT8]: (v: string) => v,
}

/**
 * Base local de desarrollo (DB_MODE=local). Aplica db/migrations y, la primera vez,
 * carga db/seed/demo.sql. Para empezar de cero: `npm run dev:local -- --reset`.
 */
function open(): Promise<PGlite> {
  const g = globalThis as Global
  g.__miamariaPglite ??= (async () => {
    const root = process.cwd()
    const db = await PGlite.create(path.join(root, '.pglite'), { extensions: { pgcrypto } })
    await db.exec("SET TIME ZONE 'America/Mexico_City'")
    await db.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW())')
    const done = new Set((await db.query<{ name: string }>('select name from local_migrations')).rows.map((r) => r.name))
    const fresh = done.size === 0
    const dir = path.join(root, 'db', 'migrations')
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(file)) continue
      console.log('[base local] migración', file)
      await db.exec(fs.readFileSync(path.join(dir, file), 'utf8'))
      await db.query('insert into local_migrations (name) values ($1)', [file])
    }
    if (fresh) {
      console.log('[base local] datos de demostración')
      await db.exec(fs.readFileSync(path.join(root, 'db', 'seed', 'demo.sql'), 'utf8'))
    }
    return db
  })()
  g.__miamariaPglite.catch(() => {
    g.__miamariaPglite = undefined
  })
  return g.__miamariaPglite
}

export async function queryLocal(text: string, params: unknown[]): Promise<Row[]> {
  const db = await open()
  const res = await db.query<Row>(text, params, { parsers })
  return res.rows
}
