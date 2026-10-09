// Carga (o actualiza por SKU + nombre) un inventario en JSON a la base de producción.
//   npm run inventario:cargar -- db/datos/inventario-2026-10-05.json
// No toca el precio de productos que ya lo tengan si el archivo trae precio null.
import './env.mjs'
import fs from 'node:fs'
import { Pool } from '@neondatabase/serverless'

const archivo = process.argv[2]
if (!archivo) {
  console.error('Uso: npm run inventario:cargar -- ruta/al/inventario.json')
  process.exit(1)
}
const { productos } = JSON.parse(fs.readFileSync(archivo, 'utf8'))
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const orden = ['Collares', 'Aretes', 'Anillos', 'Pulseras', 'Prendedores']

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const cats = new Map()
for (const nombre of [...new Set(productos.map((p) => p.categoria))]) {
  const { rows } = await pool.query(
    `insert into categorias (nombre, slug, orden) values ($1, $2, $3)
     on conflict (slug) do update set nombre = excluded.nombre returning id`,
    [nombre, slug(nombre), orden.indexOf(nombre) + 1 || 99],
  )
  cats.set(nombre, rows[0].id)
}
// El SKU puede repetirse: un producto se reconoce por SKU + nombre (o por SKU si solo hay uno).
let nuevos = 0
for (const p of productos) {
  const { rows: existentes } = await pool.query('select id, nombre from productos where sku = $1 order by id', [p.sku])
  const destino = existentes.find((e) => e.nombre.toLowerCase() === p.nombre.toLowerCase()) ?? (existentes.length === 1 ? existentes[0] : null)
  if (destino) {
    await pool.query(
      `update productos set
         nombre = $2, descripcion = $3, categoria_id = $4, precio = coalesce($5, precio), stock = $6,
         imagen_url = coalesce(imagen_url, $7), imagen2_url = coalesce(imagen2_url, $8), updated_at = now()
       where id = $1`,
      [destino.id, p.nombre, p.descripcion, cats.get(p.categoria), p.precio, p.existencia, p.imagen, p.imagen2],
    )
  } else {
    await pool.query(
      `insert into productos (sku, nombre, descripcion, categoria_id, precio, stock, imagen_url, imagen2_url, destacado, activo)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
      [p.sku, p.nombre, p.descripcion, cats.get(p.categoria), p.precio, p.existencia, p.imagen, p.imagen2, p.destacado],
    )
    nuevos++
  }
}
await pool.end()
console.log(`Listo: ${nuevos} nuevos, ${productos.length - nuevos} actualizados, ${cats.size} categorías.`)
