import { neon } from '@neondatabase/serverless'

export type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>

/**
 * De dónde salen los datos:
 * - neon:  DATABASE_URL (producción).
 * - local: DB_MODE=local. PGlite (Postgres dentro de Node) guardado en .pglite/,
 *          con datos de demostración. Nunca toca la base real.
 * NUMERIC y BIGINT llegan como texto en ambos modos: se convierten con Number() al leerlos.
 */
export const dbMode: 'neon' | 'local' = process.env.DB_MODE === 'local' ? 'local' : 'neon'

let neonSql: Sql | null = null

export function getDb(): Sql {
  if (dbMode === 'local') {
    return async (strings, ...values) => {
      const { queryLocal } = await import('./db-local')
      const text = strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ''), '')
      return queryLocal(text, values)
    }
  }
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (o usa DB_MODE=local).')
  neonSql ??= neon(process.env.DATABASE_URL) as unknown as Sql
  return neonSql
}
