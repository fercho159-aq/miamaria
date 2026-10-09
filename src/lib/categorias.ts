import 'server-only'
import type { Sql } from './db'
import { slugify } from './format'

/**
 * Slug único para una categoría (es su dirección en la tienda: /coleccion/[slug]).
 * Si el nombre ya está tomado en otra rama se antepone el de la categoría madre: "collares-plata".
 */
export async function slugCategoria(sql: Sql, nombre: string, parentId: number | null, exceptoId: number | null = null) {
  const libre = async (slug: string) => {
    const [r] = await sql`SELECT 1 FROM categorias WHERE slug = ${slug} AND id IS DISTINCT FROM ${exceptoId}::int LIMIT 1`
    return !r
  }
  const base = slugify(nombre) || 'categoria'
  if (await libre(base)) return base
  let candidato = base
  if (parentId) {
    const [madre] = await sql`SELECT slug FROM categorias WHERE id = ${parentId}`
    if (madre) candidato = `${madre.slug}-${base}`
    if (await libre(candidato)) return candidato
  }
  for (let n = 2; ; n++) {
    if (await libre(`${candidato}-${n}`)) return `${candidato}-${n}`
  }
}

/** ¿Ya hay una categoría hermana (misma madre) con ese nombre? */
export async function existeHermana(sql: Sql, nombre: string, parentId: number | null, exceptoId: number | null = null) {
  const [r] = await sql`
    SELECT 1 FROM categorias
    WHERE lower(nombre) = lower(${nombre}) AND parent_id IS NOT DISTINCT FROM ${parentId}::int
      AND id IS DISTINCT FROM ${exceptoId}::int
    LIMIT 1
  `
  return !!r
}
