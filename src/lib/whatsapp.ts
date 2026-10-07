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

/** Mensaje de la tienda al cliente según el estatus del pedido (botón del panel). */
export function mensajeEstatus(p: {
  folio: string
  clienteNombre: string
  estatus: string
  entrega: string
  total: number
  paqueteria?: string | null
  guiaEnvio?: string | null
}) {
  const hola = `Hola ${p.clienteNombre.trim().split(/\s+/)[0]}, te escribimos de Mía María`
  const enTienda = p.entrega === 'tienda'
  switch (p.estatus) {
    case 'pendiente':
      return `${hola} sobre tu pedido *${p.folio}* por ${precio(p.total)}. ¿Te compartimos los datos para el pago?`
    case 'pagado':
      return `${hola}. Confirmamos el pago de tu pedido *${p.folio}*, ¡gracias! ${
        enTienda
          ? `Te avisamos en cuanto esté listo para recoger en ${sitio.tienda.corta}.`
          : 'Lo estamos preparando y te compartimos la guía en cuanto salga.'
      }`
    case 'enviado': {
      if (enTienda) return `${hola}. Tu pedido *${p.folio}* ya está listo para recoger en ${sitio.tienda.direccion}.`
      const guia = [p.paqueteria, p.guiaEnvio && `guía ${p.guiaEnvio}`].filter(Boolean).join(', ')
      return `${hola}. Tu pedido *${p.folio}* ya va en camino${guia ? ` (${guia})` : ''}.`
    }
    case 'entregado':
      return `${hola}. Esperamos que disfrutes tu pedido *${p.folio}*. ¡Gracias por elegir Mía María!`
    case 'cancelado':
      return `${hola}. Tu pedido *${p.folio}* fue cancelado. Si quieres retomarlo, escríbenos y con gusto te ayudamos.`
    default:
      return `${hola} sobre tu pedido ${p.folio}.`
  }
}

export const urlWhatsApp = (texto: string, numero = sitio.whatsapp) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
