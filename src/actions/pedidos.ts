'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { costoEnvio, estatusConStock, estatusPedido, type EstatusPedido } from '@/lib/config'
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
      .array(z.object({ sku: z.string().min(1), cantidad: z.number().int().min(1).max(50) }))
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
  | { ok: false; error: string; ajustes?: { sku: string; disponible: number }[] }

/**
 * Crea la pre-orden desde el carrito. Precios y existencias se toman de la base (no del
 * navegador). Regresa el texto del WhatsApp para que el cliente lo envíe a la tienda.
 */
export async function crearPedido(input: PedidoInput): Promise<CrearPedidoResult> {
  const parsed = pedidoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const d = parsed.data
  const sql = getDb()

  // Agrupa por SKU por si llegó repetido.
  const cantidades = new Map<string, number>()
  for (const i of d.items) cantidades.set(i.sku, (cantidades.get(i.sku) ?? 0) + i.cantidad)
  const skus = [...cantidades.keys()]

  const productos = await sql`
    SELECT id, sku, nombre, precio, stock FROM productos WHERE activo AND sku = ANY(${skus})
  `
  const porSku = new Map(productos.map((p) => [p.sku as string, p]))

  const ajustes: { sku: string; disponible: number }[] = []
  for (const [sku, cant] of cantidades) {
    const p = porSku.get(sku)
    const disponible = p ? Number(p.stock) : 0
    if (disponible < cant) ajustes.push({ sku, disponible })
  }
  if (ajustes.length) {
    return {
      ok: false,
      error: 'Algunas piezas ya no tienen la existencia que pediste. Ajustamos tu carrito; revísalo antes de continuar.',
      ajustes,
    }
  }

  const items = skus.map((sku) => {
    const p = porSku.get(sku)!
    return { productoId: p.id as number, sku, nombre: p.nombre as string, precio: Number(p.precio), cantidad: cantidades.get(sku)! }
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

/**
 * Cambia el estatus de un pedido. Al pasar a pagado/enviado/entregado descuenta el
 * inventario (una sola vez); al cancelar un pedido que ya lo había descontado, lo regresa.
 */
export async function cambiarEstatus(pedidoId: number, estatus: EstatusPedido) {
  await requireAdmin()
  if (!(estatus in estatusPedido)) return { ok: false, error: 'Estatus no válido' }
  const sql = getDb()
  const descuenta = estatusConStock.includes(estatus)

  if (descuenta) {
    // Una sola sentencia: marca y descuenta, solo si aún no se había descontado.
    await sql`
      WITH marcado AS (
        UPDATE pedidos SET stock_descontado = TRUE WHERE id = ${pedidoId} AND NOT stock_descontado RETURNING id
      )
      UPDATE productos p SET stock = p.stock - i.cantidad, updated_at = NOW()
      FROM pedido_items i, marcado m
      WHERE i.pedido_id = m.id AND i.producto_id = p.id
    `
  } else {
    // pendiente o cancelado: si ya se había descontado, regresa las piezas.
    await sql`
      WITH marcado AS (
        UPDATE pedidos SET stock_descontado = FALSE WHERE id = ${pedidoId} AND stock_descontado RETURNING id
      )
      UPDATE productos p SET stock = p.stock + i.cantidad, updated_at = NOW()
      FROM pedido_items i, marcado m
      WHERE i.pedido_id = m.id AND i.producto_id = p.id
    `
  }
  await sql`UPDATE pedidos SET estatus = ${estatus}, updated_at = NOW() WHERE id = ${pedidoId}`

  revalidatePath('/admin', 'layout')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function guardarNotaInterna(pedidoId: number, nota: string) {
  await requireAdmin()
  const sql = getDb()
  await sql`UPDATE pedidos SET nota_interna = ${nota.trim().slice(0, 1000) || null}, updated_at = NOW() WHERE id = ${pedidoId}`
  revalidatePath(`/admin/pedidos/${pedidoId}`)
  return { ok: true }
}
