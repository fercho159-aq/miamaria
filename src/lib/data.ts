import 'server-only'
import { getDb, type Row } from './db'

export interface Categoria {
  id: number
  nombre: string
  slug: string
  orden: number
  productos?: number
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion: string
  categoriaId: number | null
  categoria: string | null
  categoriaSlug: string | null
  precio: number
  stock: number
  imagenUrl: string | null
  activo: boolean
  destacado: boolean
}

const toProducto = (r: Row): Producto => ({
  id: r.id,
  sku: r.sku,
  nombre: r.nombre,
  descripcion: r.descripcion,
  categoriaId: r.categoria_id,
  categoria: r.categoria,
  categoriaSlug: r.categoria_slug,
  precio: Number(r.precio),
  stock: Number(r.stock),
  imagenUrl: r.imagen_url,
  activo: r.activo,
  destacado: r.destacado,
})

export async function getCategorias(): Promise<Categoria[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT c.id, c.nombre, c.slug, c.orden,
           (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id AND p.activo) AS productos
    FROM categorias c ORDER BY c.orden, c.nombre
  `
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, slug: r.slug, orden: r.orden, productos: Number(r.productos) }))
}

/** Catálogo público: solo productos activos. */
export async function getProductos(opts: { categoria?: string; q?: string; destacados?: boolean } = {}) {
  const sql = getDb()
  const q = opts.q?.trim() ? `%${opts.q.trim()}%` : null
  const rows = await sql`
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.activo
      AND (${opts.categoria ?? null}::text IS NULL OR c.slug = ${opts.categoria ?? null})
      AND (${q}::text IS NULL OR p.nombre ILIKE ${q} OR p.sku ILIKE ${q} OR p.descripcion ILIKE ${q})
      AND (${opts.destacados ?? false} = FALSE OR p.destacado)
    ORDER BY (p.stock > 0) DESC, p.destacado DESC, p.created_at DESC
  `
  return rows.map(toProducto)
}

export async function getProducto(sku: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.sku = ${sku} AND p.activo LIMIT 1
  `
  return rows[0] ? toProducto(rows[0]) : null
}

/** Panel: todos los productos, incluidos los inactivos. */
export async function getProductosAdmin(q?: string) {
  const sql = getDb()
  const like = q?.trim() ? `%${q.trim()}%` : null
  const rows = await sql`
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE (${like}::text IS NULL OR p.nombre ILIKE ${like} OR p.sku ILIKE ${like})
    ORDER BY p.created_at DESC, p.id DESC
  `
  return rows.map(toProducto)
}

export async function getProductoAdmin(id: number) {
  const sql = getDb()
  const rows = await sql`
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.id = ${id} LIMIT 1
  `
  return rows[0] ? toProducto(rows[0]) : null
}

export interface PedidoResumen {
  id: number
  folio: string
  clienteNombre: string
  clienteTel: string
  entrega: string
  total: number
  estatus: string
  createdAt: string
  piezas: number
}

export async function getPedidos(estatus?: string): Promise<PedidoResumen[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT p.id, p.folio, p.cliente_nombre, p.cliente_tel, p.entrega, p.total, p.estatus, p.created_at,
           (SELECT COALESCE(SUM(cantidad), 0) FROM pedido_items i WHERE i.pedido_id = p.id) AS piezas
    FROM pedidos p
    WHERE (${estatus ?? null}::text IS NULL OR p.estatus = ${estatus ?? null})
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT 300
  `
  return rows.map((r) => ({
    id: r.id,
    folio: r.folio,
    clienteNombre: r.cliente_nombre,
    clienteTel: r.cliente_tel,
    entrega: r.entrega,
    total: Number(r.total),
    estatus: r.estatus,
    createdAt: String(r.created_at),
    piezas: Number(r.piezas),
  }))
}

export async function getPedido(id: number) {
  const sql = getDb()
  const [p] = await sql`SELECT * FROM pedidos WHERE id = ${id}`
  if (!p) return null
  const items = await sql`
    SELECT i.*, pr.stock AS stock_actual, pr.imagen_url
    FROM pedido_items i LEFT JOIN productos pr ON pr.id = i.producto_id
    WHERE i.pedido_id = ${id} ORDER BY i.id
  `
  return {
    id: p.id as number,
    folio: p.folio as string,
    clienteNombre: p.cliente_nombre as string,
    clienteTel: p.cliente_tel as string,
    clienteEmail: p.cliente_email as string | null,
    entrega: p.entrega as string,
    direccion: p.direccion as string | null,
    notas: p.notas as string | null,
    notaInterna: p.nota_interna as string | null,
    subtotal: Number(p.subtotal),
    envio: Number(p.envio),
    total: Number(p.total),
    estatus: p.estatus as string,
    stockDescontado: p.stock_descontado as boolean,
    createdAt: String(p.created_at),
    items: items.map((i) => ({
      sku: i.sku as string,
      nombre: i.nombre as string,
      precio: Number(i.precio),
      cantidad: Number(i.cantidad),
      stockActual: i.stock_actual == null ? null : Number(i.stock_actual),
      imagenUrl: i.imagen_url as string | null,
    })),
  }
}

export async function getResumen() {
  const sql = getDb()
  const [r] = await sql`
    SELECT
      (SELECT COUNT(*) FROM pedidos WHERE estatus = 'pendiente') AS pendientes,
      (SELECT COUNT(*) FROM pedidos WHERE estatus IN ('pagado','enviado','entregado')
         AND created_at >= date_trunc('month', NOW())) AS vendidos_mes,
      (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE estatus IN ('pagado','enviado','entregado')
         AND created_at >= date_trunc('month', NOW())) AS ventas_mes,
      (SELECT COUNT(*) FROM productos WHERE activo) AS productos,
      (SELECT COUNT(*) FROM productos WHERE activo AND stock <= 2) AS stock_bajo
  `
  return {
    pendientes: Number(r.pendientes),
    vendidosMes: Number(r.vendidos_mes),
    ventasMes: Number(r.ventas_mes),
    productos: Number(r.productos),
    stockBajo: Number(r.stock_bajo),
  }
}
