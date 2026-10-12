// Convierte cada clave del reporte SICAR en una subcategoría (grupo) dentro de su categoría
// principal, con su existencia; el producto que la representaba queda como su tarjeta genérica.
// Se puede correr más de una vez: lo que ya está convertido no se toca.
//   node scripts/reestructurar-grupos.mjs db/datos/inventario-2026-10-05.json            (producción)
//   DB_MODE=local node scripts/reestructurar-grupos.mjs db/datos/inventario-2026-10-05.json
import fs from 'node:fs'
import { conectar, local, slugLibre } from './db-cli.mjs'

const archivo = process.argv[2]
if (!archivo) {
  console.error('Uso: node scripts/reestructurar-grupos.mjs ruta/al/inventario.json')
  process.exit(1)
}
const { productos } = JSON.parse(fs.readFileSync(archivo, 'utf8'))
const db = await conectar()
console.log(local ? 'Base LOCAL' : 'Base de PRODUCCIÓN')

let creados = 0
let yaEstaban = 0
const ordenEnMadre = new Map()
for (const p of productos) {
  const clave = p.sku.toUpperCase()
  const madre = (await db.query('select id from categorias where lower(nombre) = lower($1) and parent_id is null', [p.categoria])).rows[0]
  if (!madre) throw new Error(`No existe la categoría principal "${p.categoria}"`)
  const orden = (ordenEnMadre.get(madre.id) ?? 0) + 1
  ordenEnMadre.set(madre.id, orden)

  let grupo = (await db.query('select id from categorias where upper(sku) = $1', [clave])).rows[0]
  if (grupo) {
    yaEstaban++
  } else {
    // Existencia actual del producto que representaba la clave (o la del reporte si no está).
    const actual = (await db.query('select stock from productos where upper(sku) = $1 order by id limit 1', [clave])).rows[0]
    const existencia = actual ? Number(actual.stock) : p.existencia
    const slug = await slugLibre(db, p.nombre, madre.id)
    grupo = (
      await db.query(
        `insert into categorias (nombre, slug, parent_id, orden, sku, existencia)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [p.nombre, slug, madre.id, orden, clave, existencia],
      )
    ).rows[0]
    creados++
  }
  // El producto que hoy representa la clave pasa a ser la tarjeta genérica de su subcategoría.
  await db.query(
    `update productos set categoria_id = $1, generico = true, updated_at = now()
     where upper(sku) = $2 and categoria_id is distinct from $1 and generico = false
       and id = (select min(id) from productos where upper(sku) = $2)`,
    [grupo.id, clave],
  )
}

const r = (
  await db.query(`
    select count(*) filter (where existencia is not null) as grupos, coalesce(sum(existencia), 0) as piezas,
           (select count(*) from productos where generico) as genericos
    from categorias`)
).rows[0]
console.log(`Subcategorías nuevas: ${creados} (ya estaban: ${yaEstaban}). Total grupos: ${r.grupos}, piezas: ${r.piezas}, tarjetas genéricas: ${r.genericos}`)
await db.cerrar()
