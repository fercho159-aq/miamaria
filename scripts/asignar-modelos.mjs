// Mete en su subcategoría SICAR los modelos que se subieron sueltos en la categoría principal.
// Solo asigna cuando es claro (por el tipo de pieza en el nombre o por la clave en el SKU, dentro
// de la misma categoría principal). El SKU del modelo pasa a ser la clave del grupo y el código
// con el que se subió queda en codigo_modelo. Lo dudoso se lista y no se toca.
//   node scripts/asignar-modelos.mjs            (muestra la propuesta, no cambia nada)
//   node scripts/asignar-modelos.mjs --aplicar  (aplica)
//   DB_MODE=local … para la base local
import { conectar, local, slugify } from './db-cli.mjs'

const aplicar = process.argv.includes('--aplicar')
const db = await conectar()
const q = (t, p) => db.query(t, p).then((r) => r.rows)
console.log(local ? 'Base LOCAL' : 'Base de PRODUCCIÓN', aplicar ? '— APLICANDO' : '— solo propuesta')

const grupos = await q('select id, nombre, upper(sku) as sku, parent_id from categorias where sku is not null and existencia is not null')
const porNombre = (n) => grupos.find((g) => g.nombre.toLowerCase() === n.toLowerCase())
const modelos = await q(`
  select p.id, p.sku, p.nombre, p.categoria_id, c.parent_id, c.nombre as cat
  from productos p left join categorias c on c.id = p.categoria_id
  where not p.generico and (c.existencia is null or c.id is null)
  order by p.id`)

const norm = (s) => ' ' + slugify(s).replace(/-/g, ' ').replace(/\bear ?c[ou]ffs?\b/g, 'ear cuff') + ' '
const tiene = (t, ...ps) => ps.every((p) => t.includes(` ${p} `)) // palabra completa

/** Grupo por el tipo de pieza que dice el nombre. */
function grupoPorNombre(nombre) {
  const t = norm(nombre)
  if (tiene(t, 'ear cuff')) {
    const largo = tiene(t, 'largo')
    const chico = tiene(t, 'chico')
    if (largo && !chico) return porNombre('Ear Cuff Largo')
    if (chico && !largo) return porNombre('Ear Cuff Chico')
    return null
  }
  if (tiene(t, 'anillo')) {
    if (tiene(t, 'chico')) return porNombre('Anillo Chico')
    if (tiene(t, 'mediano')) return porNombre('Anillo Mediano')
    if (tiene(t, 'maxi')) return porNombre('Anillo Maxi Grande')
    return null
  }
  if (tiene(t, 'pulsera') || tiene(t, 'pulcera')) {
    if (tiene(t, 'caballero')) {
      if (tiene(t, 'grande')) return porNombre('Pulsera Caballero Grande')
      if (tiene(t, 'delgada')) return porNombre('Pulsera Caballero Delgada')
      return null
    }
    if (tiene(t, 'mediana')) return porNombre('Pulsera Mediana')
    if (tiene(t, 'maxi')) return porNombre('Pulsera Maxi Grande')
    return null
  }
  return null
}

/** Grupo por SKU: la clave SICAR más larga que sea prefijo (MMA001.3 → MMA001, MMP011K2 → MMP011). */
function grupoPorSku(sku) {
  const s = sku.toUpperCase().replace(/\s/g, '')
  return grupos.filter((g) => s.startsWith(g.sku)).sort((a, b) => b.sku.length - a.sku.length)[0] ?? null
}

const asignar = []
const dudosos = []
for (const m of modelos) {
  const n = grupoPorNombre(m.nombre)
  let s = grupoPorSku(m.sku)
  // Un SKU que apunta a otra categoría principal no sirve (ej. un ear cuff con clave de collar).
  const madreModelo = m.parent_id ?? m.categoria_id
  if (s && s.parent_id !== madreModelo) s = null
  const g = n && s && n.id !== s.id ? null : (n ?? s)
  if (g && g.parent_id === madreModelo) asignar.push({ m, g, via: n ? 'nombre' : 'sku' })
  else dudosos.push({ m, motivo: n && s && n.id !== s.id ? `nombre dice ${n.nombre}, SKU dice ${s.nombre}` : 'el nombre no dice el tipo' })
}

// Modelos repetidos (mismo nombre en la misma categoría): se reportan, no se borran.
const vistos = new Map()
const repetidos = []
for (const m of modelos) {
  const k = `${m.categoria_id}|${slugify(m.nombre)}`
  if (vistos.has(k)) repetidos.push(`${m.id} repite a ${vistos.get(k)}: ${m.nombre}`)
  else vistos.set(k, m.id)
}

const resumen = new Map()
for (const a of asignar) resumen.set(a.g.nombre, (resumen.get(a.g.nombre) ?? 0) + 1)
console.log(`\nSe asignan ${asignar.length}:`)
for (const [g, n] of resumen) console.log(`  ${g}: ${n}`)
console.log(`\nSin asignar (${dudosos.length}):`)
for (const d of dudosos) console.log(`  ${d.m.id} ${d.m.sku} | ${d.m.nombre} | ${d.m.cat} — ${d.motivo}`)
console.log(`\nPosibles repetidos (${repetidos.length}):`)
for (const r of repetidos) console.log('  ' + r)

if (aplicar) {
  for (const { m, g } of asignar) {
    await db.query(
      `update productos set categoria_id = $1, codigo_modelo = coalesce(codigo_modelo, sku), sku = $2, updated_at = now() where id = $3`,
      [g.id, g.sku, m.id],
    )
  }
  console.log(`\nAplicado: ${asignar.length} modelos movidos a su subcategoría.`)
}
await db.cerrar()
