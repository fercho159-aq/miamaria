import 'server-only'
import { entregas, sitio, type MetodoEntrega } from './config'
import { precio } from './format'

export interface PedidoCorreo {
  folio: string
  clienteNombre: string
  clienteTel: string
  clienteEmail: string | null
  entrega: MetodoEntrega
  direccion: string | null
  notas: string | null
  items: { sku: string; nombre: string; precio: number; cantidad: number }[]
  subtotal: number
  envio: number
  total: number
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function html(p: PedidoCorreo, adminUrl: string) {
  const filas = p.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.nombre)}<br><span style="color:#888;font-size:12px">${esc(i.sku)}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${i.cantidad}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${precio(i.precio * i.cantidad)}</td>
      </tr>`,
    )
    .join('')
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <div style="background:#0d0d0d;color:#cba666;padding:20px 24px;letter-spacing:3px;font-size:13px">MÍA MARÍA · NUEVA PRE-ORDEN</div>
    <div style="padding:24px;border:1px solid #eee;border-top:0">
      <h2 style="margin:0 0 4px;font-weight:400">Pedido ${esc(p.folio)}</h2>
      <p style="margin:0 0 20px;color:#666">El cliente se comunicará por WhatsApp para confirmar el pago.</p>
      <p style="margin:0;line-height:1.6">
        <b>${esc(p.clienteNombre)}</b><br>
        Tel: <a href="https://wa.me/52${esc(p.clienteTel.replace(/\D/g, '').slice(-10))}">${esc(p.clienteTel)}</a><br>
        ${p.clienteEmail ? `Correo: ${esc(p.clienteEmail)}<br>` : ''}
        Entrega: ${esc(entregas[p.entrega].titulo)}<br>
        ${p.direccion ? `Dirección: ${esc(p.direccion)}<br>` : ''}
        ${p.notas ? `Notas: ${esc(p.notas)}` : ''}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px">
        <tr style="color:#888;font-size:12px;text-align:left"><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Importe</th></tr>
        ${filas}
        <tr><td colspan="2" style="padding-top:12px">Subtotal</td><td style="padding-top:12px;text-align:right">${precio(p.subtotal)}</td></tr>
        <tr><td colspan="2">Envío</td><td style="text-align:right">${p.envio ? precio(p.envio) : 'Gratis'}</td></tr>
        <tr><td colspan="2" style="padding-top:8px;font-size:16px"><b>Total</b></td><td style="padding-top:8px;text-align:right;font-size:16px"><b>${precio(p.total)}</b></td></tr>
      </table>
      <p style="margin-top:28px"><a href="${adminUrl}" style="background:#0d0d0d;color:#fff;padding:12px 20px;text-decoration:none;font-size:13px;letter-spacing:1px">VER EN EL PANEL</a></p>
    </div>
  </div>`
}

/**
 * Avisa por correo de una nueva pre-orden. Usa Resend (RESEND_API_KEY) y manda a
 * PEDIDOS_EMAIL. Sin llave, solo lo registra en consola: nunca bloquea el pedido.
 */
export async function avisarNuevoPedido(p: PedidoCorreo, pedidoId: number) {
  const to = process.env.PEDIDOS_EMAIL
  const key = process.env.RESEND_API_KEY
  if (!to || !key) {
    console.log(`[correo] Pedido ${p.folio} (sin RESEND_API_KEY/PEDIDOS_EMAIL: no se envió aviso)`)
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Mía María <pedidos@miamaria.com.mx>',
        to: to.split(',').map((s) => s.trim()),
        reply_to: p.clienteEmail || undefined,
        subject: `Nueva pre-orden ${p.folio} · ${p.clienteNombre} · ${precio(p.total)}`,
        html: html(p, `${sitio.url}/admin/pedidos/${pedidoId}`),
      }),
    })
    if (!res.ok) console.error('[correo] Resend respondió', res.status, await res.text())
  } catch (e) {
    console.error('[correo] No se pudo enviar el aviso', e)
  }
}
