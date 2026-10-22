// Corrige nombres y descripciones de productos desde un archivo de db/correcciones.
//   node scripts/corregir-textos.mjs db/correcciones/2026-10-22-nombres.json            → solo muestra los cambios
//   node scripts/corregir-textos.mjs db/correcciones/2026-10-22-nombres.json --aplicar  → los guarda
// Cada entrada lleva la clave de la tienda ("SKU" o "SKU~id") y el nombre actual: si el
// producto ya cambió de nombre, se omite en vez de sobrescribirlo.
import './env.mjs'
import fs from 'node:fs'
import { Pool } from '@neondatabase/serverless'

const [archivo, bandera] = process.argv.slice(2)
if (!archivo) {
  console.error('Uso: node scripts/corregir-textos.mjs <archivo.json> [--aplicar]')
  process.exit(1)
}
const aplicar = bandera === '--aplicar'
const entradas = JSON.parse(fs.readFileSync(archivo, 'utf8'))
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

let cambiados = 0
let omitidos = 0
for (const e of entradas) {
  const conId = e.clave.match(/^(.*)~(\d{1,9})$/)
  const { rows } = conId
    ? await pool.query('SELECT id, nombre FROM productos WHERE id = $1 AND sku = $2', [Number(conId[2]), conId[1]])
    : await pool.query('SELECT id, nombre FROM productos_catalogo WHERE sku = $1 AND en_tienda ORDER BY id LIMIT 1', [e.clave])
  const p = rows[0]
  if (!p || p.nombre !== e.nombre_actual) {
    console.log(`OMITIDO  ${e.clave}: se esperaba "${e.nombre_actual}", hay "${p?.nombre ?? '(no existe)'}"`)
    omitidos++
    continue
  }
  console.log(`${aplicar ? 'CAMBIADO' : 'CAMBIARÍA'} ${e.clave}: "${p.nombre}" → "${e.nombre}"`)
  if (aplicar) {
    await pool.query('UPDATE productos SET nombre = $1, descripcion = $2, updated_at = NOW() WHERE id = $3', [e.nombre, e.descripcion, p.id])
  }
  cambiados++
}
await pool.end()
console.log(`\n${cambiados} ${aplicar ? 'cambiados' : 'por cambiar'}, ${omitidos} omitidos.${aplicar ? '' : ' Agrega --aplicar para guardar.'}`)
