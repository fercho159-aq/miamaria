'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { costoEnvio, estatusConStock, estatusPedido, formasPago, type EstatusPedido } from '@/lib/config'
import { avisarNuevoPedido } from '@/lib/email'
import { mensajePedido } from '@/lib/whatsapp'

const pedidoSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre').max(120),
    telefono: z
      .string()
      .trim()
      .transform((s) => s.replace(/[^\d+]/g, ''))
      .refine((s) => s.replace(/\D/g, '').length >= 10, 'Escribe un teléfono de 10 dígitos'),
    email: z.union([z.literal(''), z.string().trim().email('Correo no válido')]).optional(),
    entrega: z.enum(['tienda', 'cdmx', 'nacional']),
    direccion: z.string().trim().max(400).optional(),
    notas: z.string().trim().max(500).optional(),
    items: z
      .array(z.object({ id: z.number().int().positive(), cantidad: z.number().int().min(1).max(50) }))
      .min(1, 'Tu carrito está vacío')
      .max(60),
  })
  .refine((d) => d.entrega === 'tienda' || (d.direccion && d.direccion.length >= 10), {
    message: 'Escribe la dirección completa de envío',
    path: ['direccion'],
  })

export type PedidoInput = z.input<typeof pedidoSchema>

export type CrearPedidoResult =
  | { ok: true; folio: string; mensaje: string }
  | { ok: false; error: string; ajustes?: { id: number; disponible: number }[] }

/**
 * Crea la pre-orden desde el carrito. Precios y existencias se toman de la base (no del
 * navegador). Regresa el texto del WhatsApp para que el cliente lo envíe a la tienda.
 */
export async function crearPedido(input: PedidoInput): Promise<CrearPedidoResult> {
  const parsed = pedidoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const d = parsed.data
  const sql = getDb()

  // Agrupa por producto por si llegó repetido. Se identifica por id: el SKU puede repetirse.
  const cantidades = new Map<number, number>()
  for (const i of d.items) cantidades.set(i.id, (cantidades.get(i.id) ?? 0) + i.cantidad)
  const ids = [...cantidades.keys()]

  // stock = existencia efectiva: la del grupo SICAR si el producto pertenece a uno.
  const productos = await sql`
    SELECT id, sku, nombre, precio, stock, grupo_id FROM productos_catalogo
    WHERE activo AND precio IS NOT NULL AND id = ANY(${ids}::int[])
  `
  const porId = new Map(productos.map((p) => [p.id as number, p]))

  // Los modelos de un mismo grupo comparten existencia: se valida por "bolsa" (grupo o producto).
  const ajustes: { id: number; disponible: number }[] = []
  const restante = new Map<string, number>()
  for (const [id, cant] of cantidades) {
    const p = porId.get(id)
    if (!p) {
      ajustes.push({ id, disponible: 0 })
      continue
    }
    const bolsa = p.grupo_id != null ? `g${p.grupo_id}` : `p${id}`
    const quedan = restante.get(bolsa) ?? Math.max(0, Number(p.stock))
    if (quedan < cant) ajustes.push({ id, disponible: quedan })
    restante.set(bolsa, Math.max(0, quedan - cant))
  }
  if (ajustes.length) {
    return {
      ok: false,
      error: 'Algunas piezas ya no tienen la existencia que pediste. Ajustamos tu carrito; revísalo antes de continuar.',
      ajustes,
    }
  }

  const items = ids.map((id) => {
    const p = porId.get(id)!
    return { productoId: id, sku: p.sku as string, nombre: p.nombre as string, precio: Number(p.precio), cantidad: cantidades.get(id)! }
  })
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const envio = costoEnvio(d.entrega, subtotal)
  const total = subtotal + envio
  const direccion = d.entrega === 'tienda' ? null : d.direccion || null

  const [{ id }] = await sql`SELECT nextval('pedidos_id_seq')::int AS id`
  const folio = `MM-${1000 + Number(id)}`
  await sql`
    INSERT INTO pedidos (id, folio, cliente_nombre, cliente_tel, cliente_email, entrega, direccion, notas, subtotal, envio, total)
    VALUES (${id}, ${folio}, ${d.nombre}, ${d.telefono}, ${d.email || null}, ${d.entrega}, ${direccion}, ${d.notas || null},
            ${subtotal}, ${envio}, ${total})
  `
  for (const i of items) {
    await sql`
      INSERT INTO pedido_items (pedido_id, producto_id, sku, nombre, precio, cantidad)
      VALUES (${id}, ${i.productoId}, ${i.sku}, ${i.nombre}, ${i.precio}, ${i.cantidad})
    `
  }

  const resumen = {
    folio,
    clienteNombre: d.nombre,
    entrega: d.entrega,
    direccion,
    notas: d.notas || null,
    items,
    subtotal,
    envio,
    total,
  }
  await avisarNuevoPedido({ ...resumen, clienteTel: d.telefono, clienteEmail: d.email || null }, Number(id))
  revalidatePath('/admin', 'layout')

  return { ok: true, folio, mensaje: mensajePedido(resumen) }
}

/** Anota en el historial del pedido qué cambió y quién lo hizo. */
async function registrarEvento(pedidoId: number, admin: { id: string; nombre: string }, descripcion: string) {
  const sql = getDb()
  await sql`
    INSERT INTO pedido_eventos (pedido_id, admin_id, admin_nombre, descripcion)
    VALUES (${pedidoId}, ${admin.id}, ${admin.nombre}, ${descripcion})
  `
}

/**
 * Cambia el estatus de un pedido. Al pasar a pagado/enviado/entregado descuenta el
 * inventario (una sola vez); al cancelar un pedido que ya lo había descontado, lo regresa.
 */
export async function cambiarEstatus(pedidoId: number, estatus: EstatusPedido) {
  const admin = await requireAdmin()
  if (!(estatus in estatusPedido)) return { ok: false, error: 'Estatus no válido' }
  const sql = getDb()
  const [previo] = await sql`SELECT estatus FROM pedidos WHERE id = ${pedidoId}`
  if (!previo) return { ok: false, error: 'El pedido no existe' }
  if (previo.estatus === estatus) return { ok: true }
  const descuenta = estatusConStock.includes(estatus)

  // Una sola sentencia: marca el pedido y mueve la existencia, solo una vez. Los productos de
  // un grupo SICAR mueven la existencia del grupo; los demás, la suya propia.
  const signo = descuenta ? -1 : 1
  await sql`
    WITH marcado AS (
      UPDATE pedidos SET stock_descontado = ${descuenta}
      WHERE id = ${pedidoId} AND stock_descontado = ${!descuenta}
      RETURNING id
    ),
    movs AS (
      SELECT i.producto_id, i.cantidad * ${signo}::int AS delta, g.id AS grupo_id
      FROM pedido_items i
      JOIN marcado m ON i.pedido_id = m.id
      LEFT JOIN productos p ON p.id = i.producto_id
      LEFT JOIN categorias g ON g.id = p.categoria_id AND g.existencia IS NOT NULL
    ),
    propios AS (
      UPDATE productos p SET stock = p.stock + x.delta, updated_at = NOW()
      FROM (SELECT producto_id, SUM(delta) AS delta FROM movs WHERE grupo_id IS NULL GROUP BY producto_id) x
      WHERE p.id = x.producto_id
      RETURNING p.id
    )
    UPDATE categorias g SET existencia = g.existencia + x.delta
    FROM (SELECT grupo_id, SUM(delta) AS delta FROM movs WHERE grupo_id IS NOT NULL GROUP BY grupo_id) x
    WHERE g.id = x.grupo_id
  `
  await sql`UPDATE pedidos SET estatus = ${estatus}, updated_at = NOW() WHERE id = ${pedidoId}`
  const etiqueta = (e: string) => estatusPedido[e as EstatusPedido]?.label ?? e
  await registrarEvento(pedidoId, admin, `Estatus: ${etiqueta(previo.estatus)} → ${etiqueta(estatus)}`)

  revalidatePath('/admin', 'layout')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function guardarNotaInterna(pedidoId: number, nota: string) {
  const admin = await requireAdmin()
  const sql = getDb()
  const filas = await sql`
    UPDATE pedidos SET nota_interna = ${nota.trim().slice(0, 1000) || null}, updated_at = NOW() WHERE id = ${pedidoId} RETURNING id
  `
  if (filas.length) await registrarEvento(pedidoId, admin, 'Actualizó la nota interna')
  revalidatePath(`/admin/pedidos/${pedidoId}`)
  return { ok: true }
}

/** Guarda forma de pago, paquetería y guía, y anota en el historial lo que cambió. */
export async function guardarPagoEnvio(pedidoId: number, datos: { formaPago: string; paqueteria: string; guiaEnvio: string }) {
  const admin = await requireAdmin()
  const formaPago = (formasPago as readonly string[]).includes(datos.formaPago) ? datos.formaPago : null
  const paqueteria = String(datos.paqueteria ?? '').trim().slice(0, 80) || null
  const guiaEnvio = String(datos.guiaEnvio ?? '').trim().slice(0, 80) || null
  const sql = getDb()
  const [previo] = await sql`SELECT forma_pago, paqueteria, guia_envio FROM pedidos WHERE id = ${pedidoId}`
  if (!previo) return { ok: false, error: 'El pedido no existe' }

  const cambios = (
    [
      ['Forma de pago', previo.forma_pago, formaPago],
      ['Paquetería', previo.paqueteria, paqueteria],
      ['Guía', previo.guia_envio, guiaEnvio],
    ] as [string, string | null, string | null][]
  )
    .filter(([, antes, ahora]) => (antes ?? null) !== ahora)
    .map(([campo, , ahora]) => `${campo}: ${ahora ?? 'sin dato'}`)
  if (!cambios.length) return { ok: true }

  await sql`
    UPDATE pedidos SET forma_pago = ${formaPago}, paqueteria = ${paqueteria}, guia_envio = ${guiaEnvio}, updated_at = NOW()
    WHERE id = ${pedidoId}
  `
  await registrarEvento(pedidoId, admin, cambios.join(' · '))
  revalidatePath(`/admin/pedidos/${pedidoId}`)
  return { ok: true }
}
