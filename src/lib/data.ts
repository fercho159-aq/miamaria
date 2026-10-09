import 'server-only'
import { getDb, type Row } from './db'

export interface Categoria {
  id: number
  nombre: string
  slug: string
  orden: number
  /** Categoría madre; null = categoría principal. */
  parentId: number | null
  /** Profundidad en el árbol: 0 = principal. */
  nivel: number
  /** Nombre con sus madres: "Collares › Plata". */
  ruta: string
  /** Productos visibles de la categoría y de todas sus subcategorías. */
  productos?: number
  /** Foto de un producto de la rama (destacado primero), para menús y portadas. */
  imagen?: string | null
}

export interface Producto {
  id: number
  sku: string
  /**
   * Parte de la dirección en la tienda (/producto/[clave]). Es el SKU; si varios productos lo
   * comparten, solo el primero lo conserva y los demás usan "SKU~id".
   */
  clave: string
  nombre: string
  descripcion: string
  categoriaId: number | null
  categoria: string | null
  categoriaSlug: string | null
  /** null = precio a consultar (se pide por WhatsApp, no entra al carrito) */
  precio: number | null
  stock: number
  imagenUrl: string | null
  /** Segunda foto (ej. la pieza puesta). */
  imagen2Url: string | null
  activo: boolean
  destacado: boolean
}

const claveProducto = (r: Row) => (r.principal === false ? `${r.sku}~${r.id}` : (r.sku as string))

const toProducto = (r: Row): Producto => ({
  id: r.id,
  sku: r.sku,
  clave: claveProducto(r),
  nombre: r.nombre,
  descripcion: r.descripcion,
  categoriaId: r.categoria_id,
  categoria: r.categoria,
  categoriaSlug: r.categoria_slug,
  precio: r.precio == null ? null : Number(r.precio),
  stock: Number(r.stock),
  imagenUrl: r.imagen_url,
  imagen2Url: r.imagen2_url ?? null,
  activo: r.activo,
  destacado: r.destacado,
})

export async function getCategorias(): Promise<Categoria[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT c.id, c.nombre, c.slug, c.orden, c.parent_id,
           (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id AND p.activo) AS productos,
           (SELECT p.imagen_url FROM productos p
             WHERE p.categoria_id = c.id AND p.activo AND p.imagen_url IS NOT NULL
             ORDER BY p.destacado DESC, p.created_at DESC LIMIT 1) AS imagen
    FROM categorias c ORDER BY c.orden, c.nombre
  `
  // Se arma el árbol: cada madre seguida de sus hijas, con conteo y foto de toda la rama.
  const ids = new Set(rows.map((r) => r.id as number))
  const hijas = new Map<number | null, Row[]>()
  for (const r of rows) {
    const madre = r.parent_id != null && ids.has(r.parent_id) ? (r.parent_id as number) : null
    hijas.set(madre, [...(hijas.get(madre) ?? []), r])
  }
  const lista: Categoria[] = []
  const vistas = new Set<number>()
  const recorrer = (r: Row, nivel: number, rutaMadre: string | null, parentId: number | null): Categoria => {
    vistas.add(r.id)
    const c: Categoria = {
      id: r.id,
      nombre: r.nombre,
      slug: r.slug,
      orden: r.orden,
      parentId,
      nivel,
      ruta: rutaMadre ? `${rutaMadre} › ${r.nombre}` : r.nombre,
      productos: Number(r.productos),
      imagen: r.imagen ?? null,
    }
    lista.push(c)
    for (const h of hijas.get(r.id) ?? []) {
      if (vistas.has(h.id)) continue
      const hija = recorrer(h, nivel + 1, c.ruta, c.id)
      c.productos = (c.productos ?? 0) + (hija.productos ?? 0)
      c.imagen ??= hija.imagen
    }
    return c
  }
  for (const r of hijas.get(null) ?? []) recorrer(r, 0, null, null)
  // Por si quedara un ciclo en los datos: esas categorías se muestran como principales.
  for (const r of rows) if (!vistas.has(r.id)) recorrer(r, 0, null, null)
  return lista
}

/** Catálogo público: solo productos activos. Una categoría incluye los de sus subcategorías. */
export async function getProductos(opts: { categoria?: string; q?: string; destacados?: boolean } = {}) {
  const sql = getDb()
  const q = opts.q?.trim() ? `%${opts.q.trim()}%` : null
  const rows = await sql`
    WITH RECURSIVE rama AS (
      SELECT id FROM categorias WHERE slug = ${opts.categoria ?? null}
      UNION
      SELECT c.id FROM categorias c JOIN rama r ON c.parent_id = r.id
    )
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug,
           NOT EXISTS (SELECT 1 FROM productos x WHERE x.sku = p.sku AND x.id < p.id) AS principal
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.activo
      AND (${opts.categoria ?? null}::text IS NULL OR p.categoria_id IN (SELECT id FROM rama))
      AND (${q}::text IS NULL OR p.nombre ILIKE ${q} OR p.sku ILIKE ${q} OR p.descripcion ILIKE ${q})
      AND (${opts.destacados ?? false} = FALSE OR p.destacado)
    ORDER BY (p.stock > 0) DESC, p.destacado DESC, p.created_at DESC
  `
  return rows.map(toProducto)
}

/** Producto de la tienda por su clave de dirección: "SKU" o, si el SKU se repite, "SKU~id". */
export async function getProducto(clave: string) {
  const sql = getDb()
  const conId = clave.match(/^(.*)~(\d{1,9})$/)
  const sku = conId ? conId[1] : clave
  const id = conId ? Number(conId[2]) : null
  const rows = await sql`
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug,
           NOT EXISTS (SELECT 1 FROM productos x WHERE x.sku = p.sku AND x.id < p.id) AS principal
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.sku = ${sku} AND p.activo AND (${id}::int IS NULL OR p.id = ${id})
    ORDER BY p.id LIMIT 1
  `
  return rows[0] ? toProducto(rows[0]) : null
}

/** Panel: todos los productos, incluidos los inactivos. */
export async function getProductosAdmin(q?: string) {
  const sql = getDb()
  const like = q?.trim() ? `%${q.trim()}%` : null
  const rows = await sql`
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug,
           NOT EXISTS (SELECT 1 FROM productos x WHERE x.sku = p.sku AND x.id < p.id) AS principal
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE (${like}::text IS NULL OR p.nombre ILIKE ${like} OR p.sku ILIKE ${like})
    ORDER BY p.created_at DESC, p.id DESC
  `
  return rows.map(toProducto)
}

export async function getProductoAdmin(id: number) {
  const sql = getDb()
  const rows = await sql`
    SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug,
           NOT EXISTS (SELECT 1 FROM productos x WHERE x.sku = p.sku AND x.id < p.id) AS principal
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

/** `q` busca por folio, nombre o teléfono del cliente. */
export async function getPedidos(estatus?: string, q?: string): Promise<PedidoResumen[]> {
  const sql = getDb()
  const like = q?.trim() ? `%${q.trim()}%` : null
  // Teléfono: se compara solo con dígitos, para encontrar "55 1234 5678" o "+52 55…".
  const digitos = q?.replace(/\D/g, '') ?? ''
  const tel = digitos.length >= 4 ? `%${digitos}%` : null
  const rows = await sql`
    SELECT p.id, p.folio, p.cliente_nombre, p.cliente_tel, p.entrega, p.total, p.estatus, p.created_at,
           (SELECT COALESCE(SUM(cantidad), 0) FROM pedido_items i WHERE i.pedido_id = p.id) AS piezas
    FROM pedidos p
    WHERE (${estatus ?? null}::text IS NULL OR p.estatus = ${estatus ?? null})
      AND (${like}::text IS NULL OR p.folio ILIKE ${like} OR p.cliente_nombre ILIKE ${like}
           OR (${tel}::text IS NOT NULL AND regexp_replace(p.cliente_tel, '[^0-9]', '', 'g') LIKE ${tel}))
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
  const eventos = await sql`
    SELECT id, admin_nombre, descripcion, created_at FROM pedido_eventos
    WHERE pedido_id = ${id} ORDER BY created_at DESC, id DESC
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
    formaPago: p.forma_pago as string | null,
    paqueteria: p.paqueteria as string | null,
    guiaEnvio: p.guia_envio as string | null,
    subtotal: Number(p.subtotal),
    envio: Number(p.envio),
    total: Number(p.total),
    estatus: p.estatus as string,
    stockDescontado: p.stock_descontado as boolean,
    createdAt: String(p.created_at),
    items: items.map((i) => ({
      id: i.id as number,
      sku: i.sku as string,
      nombre: i.nombre as string,
      precio: Number(i.precio),
      cantidad: Number(i.cantidad),
      stockActual: i.stock_actual == null ? null : Number(i.stock_actual),
      imagenUrl: i.imagen_url as string | null,
    })),
    eventos: eventos.map((e) => ({
      id: e.id as number,
      admin: e.admin_nombre as string,
      descripcion: e.descripcion as string,
      createdAt: String(e.created_at),
    })),
  }
}

/** Consultas por WhatsApp desde la tienda: resumen por producto y las más recientes. */
export async function getConsultas() {
  const sql = getDb()
  const porProducto = await sql`
    SELECT c.sku, MAX(c.nombre) AS nombre, c.producto_id,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE c.created_at >= NOW() - INTERVAL '7 days') AS semana,
           MAX(c.created_at) AS ultima,
           (SELECT p.precio IS NULL FROM productos p WHERE p.id = c.producto_id) AS sin_precio
    FROM consultas c
    WHERE c.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY c.producto_id, c.sku ORDER BY total DESC, ultima DESC LIMIT 100
  `
  const recientes = await sql`SELECT id, sku, nombre, created_at FROM consultas ORDER BY created_at DESC, id DESC LIMIT 30`
  return {
    porProducto: porProducto.map((r) => ({
      sku: r.sku as string,
      nombre: r.nombre as string,
      productoId: r.producto_id as number | null,
      total: Number(r.total),
      semana: Number(r.semana),
      ultima: String(r.ultima),
      sinPrecio: r.sin_precio === true,
    })),
    recientes: recientes.map((r) => ({ id: r.id as number, sku: r.sku as string, nombre: r.nombre as string, createdAt: String(r.created_at) })),
  }
}

export interface AdminFila {
  id: string
  email: string
  nombre: string
  activo: boolean
  createdAt: string
}

export async function getAdmins(): Promise<AdminFila[]> {
  const sql = getDb()
  const rows = await sql`SELECT id, email, nombre, activo, created_at FROM admins ORDER BY created_at, email`
  return rows.map((r) => ({ id: r.id, email: r.email, nombre: r.nombre, activo: r.activo, createdAt: String(r.created_at) }))
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

/** Páginas públicas para el sitemap: productos activos y colecciones con productos. */
export async function getUrlsSitemap() {
  const sql = getDb()
  const productos = await sql`
    SELECT p.id, p.sku, p.updated_at, p.imagen_url, p.imagen2_url,
           NOT EXISTS (SELECT 1 FROM productos x WHERE x.sku = p.sku AND x.id < p.id) AS principal
    FROM productos p WHERE p.activo ORDER BY p.updated_at DESC
  `
  const colecciones = await sql`
    WITH RECURSIVE rama AS (
      SELECT id AS raiz, id FROM categorias
      UNION
      SELECT r.raiz, c.id FROM categorias c JOIN rama r ON c.parent_id = r.id
    )
    SELECT c.slug, MAX(p.updated_at) AS updated_at
    FROM categorias c JOIN rama r ON r.raiz = c.id JOIN productos p ON p.categoria_id = r.id AND p.activo
    GROUP BY c.slug
  `
  return {
    productos: productos.map((p) => ({
      clave: claveProducto(p),
      actualizado: new Date(p.updated_at),
      imagenes: [p.imagen_url, p.imagen2_url].filter(Boolean) as string[],
    })),
    colecciones: colecciones.map((c) => ({ slug: c.slug as string, actualizado: new Date(c.updated_at) })),
  }
}
