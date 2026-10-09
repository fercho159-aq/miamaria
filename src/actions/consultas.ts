'use server'

import { getDb } from '@/lib/db'

/**
 * Registra que alguien abrió WhatsApp para preguntar por un producto. Es pública (la llama
 * la tienda), así que solo acepta productos visibles y nunca falla hacia el cliente.
 */
export async function registrarConsulta(productoId: number) {
  if (!Number.isInteger(productoId) || productoId <= 0) return
  try {
    const sql = getDb()
    await sql`
      INSERT INTO consultas (producto_id, sku, nombre)
      SELECT id, sku, nombre FROM productos WHERE id = ${productoId} AND activo
    `
  } catch (e) {
    console.error('[consultas] No se pudo registrar', e)
  }
}
