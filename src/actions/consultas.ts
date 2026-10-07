'use server'

import { getDb } from '@/lib/db'

/**
 * Registra que alguien abrió WhatsApp para preguntar por un producto. Es pública (la llama
 * la tienda), así que solo acepta SKUs de productos visibles y nunca falla hacia el cliente.
 */
export async function registrarConsulta(sku: string) {
  if (typeof sku !== 'string' || !sku || sku.length > 60) return
  try {
    const sql = getDb()
    await sql`
      INSERT INTO consultas (producto_id, sku, nombre)
      SELECT id, sku, nombre FROM productos WHERE sku = ${sku} AND activo LIMIT 1
    `
  } catch (e) {
    console.error('[consultas] No se pudo registrar', e)
  }
}
