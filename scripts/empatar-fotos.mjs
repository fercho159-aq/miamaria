// Exporta los productos publicados (id, nombre, subcategoría y foto) a _fotos/_productos.json
// para que scripts/empatar_fotos.py los compare con las fotos de Drive.
import fs from 'node:fs'
import { conectar } from './db-cli.mjs'

const db = await conectar()
const { rows } = await db.query(`
  select p.id, p.nombre, p.sku, p.codigo_modelo, p.imagen_url as imagen, g.nombre as grupo
  from productos p left join categorias g on g.id = p.categoria_id and g.existencia is not null
  where p.imagen_url like 'https://%' order by p.id`)
fs.mkdirSync('../_fotos', { recursive: true })
fs.writeFileSync('../_fotos/_productos.json', JSON.stringify(rows, null, 1))
console.log('Productos exportados:', rows.length)
await db.cerrar()
