'use server'

import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { slugCategoria } from '@/lib/categorias'
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
 * precio y existencia; precio vacío = a consultar). Si el producto ya existe se actualiza; si no, se crea.
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
  // Categorías por madre + nombre. En el archivo una subcategoría se escribe "Collares > Plata".
  const cats = await sql`SELECT id, nombre, parent_id FROM categorias ORDER BY id`
  const llave = (parentId: number | null, nombre: string) => `${parentId ?? 0}|${nombre.toLowerCase()}`
  const catPorLlave = new Map<string, number>()
  const catPorNombre = new Map<string, number>()
  for (const c of cats) {
    catPorLlave.set(llave(c.parent_id, c.nombre), c.id)
    if (!catPorNombre.has(c.nombre.toLowerCase())) catPorNombre.set(c.nombre.toLowerCase(), c.id)
  }
  const categoriasNuevas: string[] = []
  async function categoriaDe(texto: string) {
    const partes = texto.split('>').map((t) => t.trim()).filter(Boolean)
    // Un solo nombre que ya existe como subcategoría: se usa esa.
    if (partes.length === 1 && !catPorLlave.has(llave(null, partes[0])) && catPorNombre.has(partes[0].toLowerCase())) {
      return catPorNombre.get(partes[0].toLowerCase())!
    }
    let parentId: number | null = null
    for (const [n, nombre] of partes.entries()) {
      let id = catPorLlave.get(llave(parentId, nombre))
      if (!id) {
        const slug = await slugCategoria(sql, nombre, parentId)
        const [c] = await sql`
          INSERT INTO categorias (nombre, slug, parent_id, orden)
          VALUES (${nombre}, ${slug}, ${parentId}, (SELECT COALESCE(MAX(orden), 0) + 1 FROM categorias)) RETURNING id
        `
        id = c.id as number
        catPorLlave.set(llave(parentId, nombre), id)
        if (!catPorNombre.has(nombre.toLowerCase())) catPorNombre.set(nombre.toLowerCase(), id)
        categoriasNuevas.push(partes.slice(0, n + 1).join(' › '))
      }
      parentId = id
    }
    return parentId
  }

  // Cuántas veces viene cada SKU en el archivo: si se repite, las filas se distinguen por nombre.
  const skuDe = (fila: Record<string, unknown>) => String(fila[mapa.sku] ?? '').trim().toUpperCase()
  const vecesEnArchivo = new Map<string, number>()
  for (const fila of filas) vecesEnArchivo.set(skuDe(fila), (vecesEnArchivo.get(skuDe(fila)) ?? 0) + 1)

  const omitidos: string[] = []
  let creados = 0
  let actualizados = 0

  for (const [n, fila] of filas.entries()) {
    const linea = n + 2
    const sku = skuDe(fila)
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

    const stockCrudo = mapa.stock ? fila[mapa.stock] : ''
    const stock = stockCrudo === '' || stockCrudo == null ? null : Math.trunc(Number(stockCrudo))
    if (stock !== null && !Number.isFinite(stock)) {
      omitidos.push(`Fila ${linea} (${sku}): existencia no válida`)
      continue
    }

    const catTexto = mapa.categoria ? String(fila[mapa.categoria] ?? '').trim() : ''
    const categoriaId = catTexto ? await categoriaDe(catTexto) : null

    // El SKU puede repetirse: se actualiza el producto con el mismo SKU y nombre. Si el SKU es
    // único (en la base y en el archivo) se actualiza ese aunque cambie el nombre; si no, se crea.
    const existentes = await sql`SELECT id, nombre FROM productos WHERE sku = ${sku} ORDER BY id`
    const igual = existentes.find((e) => (e.nombre as string).toLowerCase() === nombre.toLowerCase())
    const destino = igual ?? (existentes.length === 1 && vecesEnArchivo.get(sku) === 1 ? existentes[0] : null)

    if (destino) {
      await sql`
        UPDATE productos SET
          nombre = ${nombre},
          descripcion = CASE WHEN ${!!mapa.descripcion} THEN ${descripcion} ELSE descripcion END,
          categoria_id = COALESCE(${categoriaId}::int, categoria_id),
          precio = CASE WHEN ${precio !== null} THEN ${precio}::numeric ELSE precio END,
          stock = CASE WHEN ${stock !== null} THEN ${stock}::int ELSE stock END,
          updated_at = NOW()
        WHERE id = ${destino.id}
      `
      actualizados++
    } else {
      await sql`
        INSERT INTO productos (sku, nombre, descripcion, categoria_id, precio, stock)
        VALUES (${sku}, ${nombre}, ${descripcion}, ${categoriaId}, ${precio}, ${stock ?? 0})
      `
      creados++
    }
  }

  revalidatePath('/', 'layout')
  return { ok: true, creados, actualizados, categoriasNuevas, omitidos }
}
