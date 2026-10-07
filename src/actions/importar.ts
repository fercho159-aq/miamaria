'use server'

import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { slugify } from '@/lib/format'

export type ImportResult =
  | { ok: true; creados: number; actualizados: number; categoriasNuevas: string[]; omitidos: string[] }
  | { ok: false; error: string }
  | undefined

// Encabezados aceptados (sin acentos ni mayúsculas) para cada campo.
const COLUMNAS: Record<string, string[]> = {
  sku: ['sku', 'clave', 'codigo', 'código'],
  nombre: ['nombre', 'producto', 'nombre del producto'],
  descripcion: ['descripcion', 'descripción', 'detalle'],
  categoria: ['categoria', 'categoría', 'tipo', 'linea', 'línea'],
  precio: ['precio', 'precio venta', 'precio de venta', 'pvp', 'precio publico', 'precio público'],
  stock: ['stock', 'existencia', 'existencias', 'inventario', 'cantidad', 'piezas'],
}

const norm = (s: unknown) => slugify(String(s ?? '')).replace(/-/g, ' ')

function precioDe(v: unknown) {
  if (typeof v === 'number') return v
  const n = Number(String(v ?? '').replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

/**
 * Carga el inventario desde el Excel de Mía María (SKU, nombre, descripción, categoría,
 * precio y existencia; precio vacío = a consultar). Si el SKU ya existe se actualiza; si no, se crea.
 */
export async function importarExcel(_: ImportResult, form: FormData): Promise<ImportResult> {
  await requireAdmin()
  const file = form.get('archivo')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Elige el archivo de Excel' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'El archivo pesa más de 5 MB' }

  let filas: Record<string, unknown>[]
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    let wb: XLSX.WorkBook
    if (/\.(csv|txt)$/i.test(file.name)) {
      // CSV: UTF-8 y, si no lo es (Excel en Windows), Windows-1252. Así no se pierden los acentos.
      let texto = new TextDecoder('utf-8').decode(bytes)
      if (texto.includes('�')) texto = new TextDecoder('windows-1252').decode(bytes)
      wb = XLSX.read(texto.replace(/^﻿/, ''), { type: 'string' })
    } else {
      wb = XLSX.read(bytes, { type: 'array' })
    }
    filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' })
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo. Debe ser .xlsx, .xls o .csv' }
  }
  if (!filas.length) return { ok: false, error: 'La primera hoja del archivo está vacía' }

  // Relaciona los encabezados del archivo con nuestros campos.
  const mapa: Record<string, string> = {}
  for (const h of Object.keys(filas[0])) {
    const n = norm(h)
    for (const [campo, alias] of Object.entries(COLUMNAS)) {
      if (!mapa[campo] && alias.map(norm).includes(n)) mapa[campo] = h
    }
  }
  const faltan = ['sku', 'nombre'].filter((c) => !mapa[c])
  if (faltan.length) {
    return { ok: false, error: `No encontré las columnas: ${faltan.join(', ')}. Revisa los encabezados de la primera fila.` }
  }

  const sql = getDb()
  const cats = await sql`SELECT id, nombre, slug FROM categorias`
  const catPorSlug = new Map(cats.map((c) => [c.slug as string, c.id as number]))
  const categoriasNuevas: string[] = []
  const omitidos: string[] = []
  let creados = 0
  let actualizados = 0

  for (const [n, fila] of filas.entries()) {
    const linea = n + 2
    const sku = String(fila[mapa.sku] ?? '').trim().toUpperCase()
    const nombre = String(fila[mapa.nombre] ?? '').trim()
    // Precio vacío o sin columna = "a consultar" (al actualizar se conserva el que ya tenía)
    const precioCrudo = mapa.precio ? fila[mapa.precio] : ''
    const precio = precioCrudo === '' || precioCrudo == null ? null : precioDe(precioCrudo)
    if (!sku && !nombre) continue
    if (!sku || !nombre || (precio !== null && (!Number.isFinite(precio) || precio < 0))) {
      omitidos.push(`Fila ${linea}: ${!sku ? 'sin SKU' : !nombre ? 'sin nombre' : 'precio no válido'}`)
      continue
    }
    const descripcion = mapa.descripcion ? String(fila[mapa.descripcion] ?? '').trim() : ''

    let categoriaId: number | null = null
    const catNombre = mapa.categoria ? String(fila[mapa.categoria] ?? '').trim() : ''
    if (catNombre) {
      const slug = slugify(catNombre)
      if (!catPorSlug.has(slug)) {
        const [c] = await sql`
          INSERT INTO categorias (nombre, slug, orden)
          VALUES (${catNombre}, ${slug}, (SELECT COALESCE(MAX(orden), 0) + 1 FROM categorias)) RETURNING id
        `
        catPorSlug.set(slug, c.id)
        categoriasNuevas.push(catNombre)
      }
      categoriaId = catPorSlug.get(slug)!
    }

    const stockCrudo = mapa.stock ? fila[mapa.stock] : ''
    const stock = stockCrudo === '' || stockCrudo == null ? null : Math.trunc(Number(stockCrudo))
    if (stock !== null && !Number.isFinite(stock)) {
      omitidos.push(`Fila ${linea} (${sku}): existencia no válida`)
      continue
    }

    const [r] = await sql`
      INSERT INTO productos (sku, nombre, descripcion, categoria_id, precio, stock)
      VALUES (${sku}, ${nombre}, ${descripcion}, ${categoriaId}, ${precio}, ${stock ?? 0})
      ON CONFLICT (sku) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        descripcion = CASE WHEN ${!!mapa.descripcion} THEN EXCLUDED.descripcion ELSE productos.descripcion END,
        categoria_id = COALESCE(EXCLUDED.categoria_id, productos.categoria_id),
        precio = CASE WHEN ${precio !== null} THEN EXCLUDED.precio ELSE productos.precio END,
        stock = CASE WHEN ${stock !== null} THEN EXCLUDED.stock ELSE productos.stock END,
        updated_at = NOW()
      RETURNING (xmax = 0) AS nuevo
    `
    if (r.nuevo) creados++
    else actualizados++
  }

  revalidatePath('/', 'layout')
  return { ok: true, creados, actualizados, categoriasNuevas, omitidos }
}
