import { entregas, sitio, type MetodoEntrega } from './config'
import { precio } from './format'

export interface PedidoWhatsApp {
  folio: string
  clienteNombre: string
  entrega: MetodoEntrega
  direccion?: string | null
  notas?: string | null
  items: { sku: string; nombre: string; precio: number; cantidad: number }[]
  subtotal: number
  envio: number
  total: number
}

/** Mensaje que el cliente envía a la tienda al terminar su pre-orden. */
export function mensajePedido(p: PedidoWhatsApp) {
  const lineas = [
    `Hola Mía María, quiero confirmar mi pedido *${p.folio}*`,
    '',
    ...p.items.map((i) => `• ${i.cantidad} × ${i.nombre} (${i.sku}) — ${precio(i.precio * i.cantidad)}`),
    '',
    `Subtotal: ${precio(p.subtotal)}`,
    `Entrega: ${entregas[p.entrega].titulo} — ${p.envio ? precio(p.envio) : 'Gratis'}`,
    `*Total: ${precio(p.total)}*`,
    '',
    `Nombre: ${p.clienteNombre}`,
  ]
  if (p.direccion) lineas.push(`Dirección: ${p.direccion}`)
  if (p.notas) lineas.push(`Notas: ${p.notas}`)
  return lineas.join('\n')
}

export const urlWhatsApp = (texto: string, numero = sitio.whatsapp) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
