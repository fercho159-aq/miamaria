// Asignación de los 28 modelos que no se pudieron ubicar por nombre, identificados comparando su
// foto publicada con las fotos de Drive (carpetas por tipo de pieza). 12/10/2026.
//   node scripts/asignar-por-foto.mjs [--aplicar]
import { conectar } from './db-cli.mjs'

const ASIGNACION = {
  'Prendedor de Fiesta': [46, 48, 50], // Fany/Prendedores: flor, pluma, hoja
  'Pulsera Caballero Delgada': [112, 113, 114, 115, 116, 117], // Luis/Pulsera de caballero delgada
  'Pulsera Mediana': [45, 47, 49, 51], // Fany/Pulcera mediana: dragón, cobra, corazones, ondulada
  'Anillo Chico': [52, 53, 54, 55], // Fany/Anillo chico: acolchado, hebilla, moño, sol
  'Ear Cuff Chico': [77, 78, 79, 101, 102, 103, 104, 105, 106, 107, 108], // ear cuffs chicos (Fany y otros)
}

const aplicar = process.argv.includes('--aplicar')
const db = await conectar()
let total = 0
for (const [grupo, ids] of Object.entries(ASIGNACION)) {
  const g = (await db.query('select id, upper(sku) as sku from categorias where lower(nombre) = lower($1) and existencia is not null', [grupo])).rows[0]
  if (!g) throw new Error(`No existe la subcategoría ${grupo}`)
  const prods = (await db.query('select id, nombre, sku from productos where id = any($1::int[]) order by id', [ids])).rows
  if (prods.length !== ids.length) throw new Error(`${grupo}: faltan productos (${prods.length}/${ids.length})`)
  console.log(`${grupo} (${g.sku}): ${prods.map((p) => p.nombre).join(' · ')}`)
  if (aplicar) {
    await db.query(
      `update productos set categoria_id = $1, codigo_modelo = coalesce(codigo_modelo, sku), sku = $2, updated_at = now()
       where id = any($3::int[])`,
      [g.id, g.sku, ids],
    )
  }
  total += ids.length
}
console.log(aplicar ? `Aplicado: ${total} modelos.` : `Propuesta: ${total} modelos (usa --aplicar).`)
await db.cerrar()
