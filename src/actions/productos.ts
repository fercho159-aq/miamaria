'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { guardarImagen } from '@/lib/storage'
import { existeHermana, slugCategoria } from '@/lib/categorias'

export type FormState = { error?: string; ok?: string } | undefined

const productoSchema = z.object({
  // Vacío = toma la clave de su subcategoría SICAR (si la tiene)
  sku: z.string().trim().max(60).transform((s) => s.toUpperCase()),
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(160),
  descripcion: z.string().trim().max(2000).default(''),
  categoriaId: z.coerce.number().int().positive().nullable(),
  // vacío = precio a consultar
  precio: z.coerce.number({ message: 'Precio no válido' }).min(0, 'Precio no válido').nullable(),
  stock: z.coerce.number({ message: 'Existencia no válida' }).int('La existencia debe ser un número entero'),
  activo: z.boolean(),
  destacado: z.boolean(),
})

function leer(form: FormData) {
  return productoSchema.safeParse({
    // En un modelo de grupo el campo no se envía: el SKU sale de la subcategoría
    sku: form.get('sku') ?? '',
    nombre: form.get('nombre'),
    descripcion: form.get('descripcion') ?? '',
    categoriaId: form.get('categoriaId') ? form.get('categoriaId') : null,
    precio: form.get('precio') ? form.get('precio') : null,
    stock: form.get('stock'),
    activo: form.get('activo') === 'on',
    destacado: form.get('destacado') === 'on',
  })
}

function revalidar() {
  revalidatePath('/', 'layout')
}

export async function guardarProducto(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const parsed = leer(form)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data
  const id = form.get('id') ? Number(form.get('id')) : null
  const sql = getDb()

  // Modelo de un grupo SICAR: el SKU es la clave del grupo y la existencia es la del grupo.
  const [grupo] = d.categoriaId
    ? await sql`SELECT sku, existencia FROM categorias WHERE id = ${d.categoriaId} AND existencia IS NOT NULL`
    : []
  if (grupo?.sku) d.sku = String(grupo.sku).toUpperCase()
  if (!d.sku) return { error: 'El SKU es obligatorio' }
  if (grupo) {
    const [previo] = id ? await sql`SELECT stock FROM productos WHERE id = ${id}` : []
    d.stock = previo ? Number(previo.stock) : 0
  }

  // undefined = no cambia, null = se quita, texto = foto nueva
  const leerFoto = async (campo: string, quitar: string) => {
    const foto = form.get(campo)
    if (form.get(quitar) === 'on') return null
    if (foto instanceof File && foto.size > 0) return guardarImagen(foto, d.sku)
    return undefined
  }
  let imagenUrl: string | null | undefined
  let imagen2Url: string | null | undefined
  try {
    imagenUrl = await leerFoto('foto', 'quitarFoto')
    imagen2Url = await leerFoto('foto2', 'quitarFoto2')
  } catch (e) {
    return { error: (e as Error).message }
  }

  let nuevoId = id
  if (id) {
    await sql`
      UPDATE productos SET sku = ${d.sku}, nombre = ${d.nombre}, descripcion = ${d.descripcion},
        categoria_id = ${d.categoriaId}, precio = ${d.precio}, stock = ${d.stock},
        activo = ${d.activo}, destacado = ${d.destacado}, updated_at = NOW()
      WHERE id = ${id}
    `
    if (imagenUrl !== undefined) await sql`UPDATE productos SET imagen_url = ${imagenUrl} WHERE id = ${id}`
    if (imagen2Url !== undefined) await sql`UPDATE productos SET imagen2_url = ${imagen2Url} WHERE id = ${id}`
  } else {
    const [row] = await sql`
      INSERT INTO productos (sku, nombre, descripcion, categoria_id, precio, stock, activo, destacado, imagen_url, imagen2_url)
      VALUES (${d.sku}, ${d.nombre}, ${d.descripcion}, ${d.categoriaId}, ${d.precio}, ${d.stock},
              ${d.activo}, ${d.destacado}, ${imagenUrl ?? null}, ${imagen2Url ?? null})
      RETURNING id
    `
    nuevoId = row.id
  }
  revalidar()
  if (!id) redirect(`/admin/productos/${nuevoId}?creado=1`)
  return { ok: 'Cambios guardados' }
}

export async function eliminarProducto(id: number) {
  await requireAdmin()
  const sql = getDb()
  // Si ya aparece en pedidos, se desactiva para conservar el historial.
  const [usado] = await sql`SELECT 1 FROM pedido_items WHERE producto_id = ${id} LIMIT 1`
  if (usado) await sql`UPDATE productos SET activo = FALSE, updated_at = NOW() WHERE id = ${id}`
  else await sql`DELETE FROM productos WHERE id = ${id}`
  revalidar()
  redirect('/admin/productos')
}

/** Cambia la existencia desde la lista. Si el producto es de un grupo SICAR, cambia la del grupo. */
export async function ajustarStockRapido(id: number, stock: number) {
  await requireAdmin()
  if (!Number.isInteger(stock)) return
  const sql = getDb()
  const [g] = await sql`
    SELECT c.id FROM productos p JOIN categorias c ON c.id = p.categoria_id AND c.existencia IS NOT NULL WHERE p.id = ${id}
  `
  if (g) await sql`UPDATE categorias SET existencia = ${stock} WHERE id = ${g.id}`
  else await sql`UPDATE productos SET stock = ${stock}, updated_at = NOW() WHERE id = ${id}`
  revalidar()
}

/**
 * Clave SICAR y existencia de una subcategoría. Con clave, la subcategoría es un "grupo": sus
 * modelos usan esa clave como SKU y comparten la existencia. Clave vacía = deja de ser grupo.
 */
export async function guardarGrupo(id: number, sku: string, existencia: number | null) {
  await requireAdmin()
  const clave = sku.trim().toUpperCase().slice(0, 60) || null
  if (clave && (existencia == null || !Number.isInteger(existencia))) return { error: 'Escribe la existencia (número entero)' }
  const sql = getDb()
  if (clave) {
    const [otra] = await sql`SELECT nombre FROM categorias WHERE upper(sku) = ${clave} AND id <> ${id}`
    if (otra) return { error: `La clave ${clave} ya es de “${otra.nombre}”` }
  }
  await sql`UPDATE categorias SET sku = ${clave}, existencia = ${clave ? existencia : null} WHERE id = ${id}`
  // Los modelos del grupo llevan su clave como SKU.
  if (clave) await sql`UPDATE productos SET sku = ${clave}, updated_at = NOW() WHERE categoria_id = ${id} AND sku <> ${clave}`
  revalidar()
  return { ok: true }
}

// ---------- Categorías ----------

const idCategoria = (v: unknown) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** La categoría y todas sus subcategorías (para no meter una categoría dentro de su propia rama). */
async function ramaDe(id: number) {
  const sql = getDb()
  const rows = await sql`
    WITH RECURSIVE rama AS (
      SELECT id FROM categorias WHERE id = ${id}
      UNION
      SELECT c.id FROM categorias c JOIN rama r ON c.parent_id = r.id
    )
    SELECT id FROM rama
  `
  return rows.map((r) => r.id as number)
}

export async function crearCategoria(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const nombre = String(form.get('nombre') ?? '').trim()
  if (nombre.length < 2) return { error: 'Escribe el nombre de la categoría' }
  const parentId = idCategoria(form.get('parentId'))
  const sql = getDb()
  if (parentId) {
    const [madre] = await sql`SELECT 1 FROM categorias WHERE id = ${parentId}`
    if (!madre) return { error: 'La categoría madre ya no existe' }
  }
  if (await existeHermana(sql, nombre, parentId)) return { error: 'Esa categoría ya existe ahí' }
  const slug = await slugCategoria(sql, nombre, parentId)
  await sql`
    INSERT INTO categorias (nombre, slug, parent_id, orden)
    VALUES (${nombre}, ${slug}, ${parentId}, (SELECT COALESCE(MAX(orden), 0) + 1 FROM categorias))
  `
  revalidar()
  return { ok: `Categoría “${nombre}” creada` }
}

/** Cambia el nombre y/o la categoría madre (null = categoría principal). */
export async function editarCategoria(id: number, nombre: string, parentId: number | null) {
  await requireAdmin()
  nombre = nombre.trim()
  if (nombre.length < 2) return { error: 'Nombre muy corto' }
  parentId = idCategoria(parentId)
  const sql = getDb()
  const [actual] = await sql`SELECT nombre, parent_id FROM categorias WHERE id = ${id}`
  if (!actual) return { error: 'La categoría ya no existe' }
  if (parentId && (await ramaDe(id)).includes(parentId)) return { error: 'No puede quedar dentro de sí misma ni de una de sus subcategorías' }
  if (await existeHermana(sql, nombre, parentId, id)) return { error: 'Esa categoría ya existe ahí' }

  if (actual.nombre !== nombre) {
    await sql`UPDATE categorias SET nombre = ${nombre}, slug = ${await slugCategoria(sql, nombre, parentId, id)} WHERE id = ${id}`
  }
  if ((actual.parent_id ?? null) !== parentId) {
    // Al cambiar de madre queda al final de sus nuevas hermanas.
    await sql`
      UPDATE categorias SET parent_id = ${parentId}, orden = (SELECT COALESCE(MAX(orden), 0) + 1 FROM categorias) WHERE id = ${id}
    `
  }
  revalidar()
  return { ok: true }
}

/** Sube o baja la categoría entre sus hermanas (las de la misma madre). */
export async function moverCategoria(id: number, dir: -1 | 1) {
  await requireAdmin()
  const sql = getDb()
  const cats = await sql`
    SELECT id FROM categorias
    WHERE parent_id IS NOT DISTINCT FROM (SELECT parent_id FROM categorias WHERE id = ${id})
    ORDER BY orden, nombre
  `
  const ids = cats.map((c) => c.id as number)
  const i = ids.indexOf(id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= ids.length) return
  ;[ids[i], ids[j]] = [ids[j], ids[i]]
  for (const [orden, cid] of ids.entries()) await sql`UPDATE categorias SET orden = ${orden + 1} WHERE id = ${cid}`
  revalidar()
}

/** Elimina la categoría: sus subcategorías y productos suben a la categoría madre (o quedan sin categoría). */
export async function eliminarCategoria(id: number) {
  await requireAdmin()
  const sql = getDb()
  const [c] = await sql`SELECT parent_id FROM categorias WHERE id = ${id}`
  if (!c) return
  await sql`UPDATE categorias SET parent_id = ${c.parent_id} WHERE parent_id = ${id}`
  await sql`UPDATE productos SET categoria_id = ${c.parent_id}, updated_at = NOW() WHERE categoria_id = ${id}`
  await sql`DELETE FROM categorias WHERE id = ${id}`
  revalidar()
}
