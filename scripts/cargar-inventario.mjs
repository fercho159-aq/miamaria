// Carga (o actualiza por SKU) un inventario en JSON a la base de producción.
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
let nuevos = 0
for (const p of productos) {
  const { rows } = await pool.query(
    `insert into productos (sku, nombre, descripcion, categoria_id, precio, stock, imagen_url, imagen2_url, destacado, activo)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
     on conflict (sku) do update set
       nombre = excluded.nombre, descripcion = excluded.descripcion, categoria_id = excluded.categoria_id,
       precio = coalesce(excluded.precio, productos.precio), stock = excluded.stock,
       imagen_url = coalesce(productos.imagen_url, excluded.imagen_url),
       imagen2_url = coalesce(productos.imagen2_url, excluded.imagen2_url),
       updated_at = now()
     returning (xmax = 0) as nuevo`,
    [p.sku, p.nombre, p.descripcion, cats.get(p.categoria), p.precio, p.existencia, p.imagen, p.imagen2, p.destacado],
  )
  if (rows[0].nuevo) nuevos++
}
await pool.end()
console.log(`Listo: ${nuevos} nuevos, ${productos.length - nuevos} actualizados, ${cats.size} categorías.`)
