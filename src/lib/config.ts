// Datos del negocio y reglas de entrega. Lo que cambia por ambiente va en variables
// (.env.local / Vercel); lo demás se edita aquí.

export const sitio = {
  nombre: 'Mía María',
  lema: 'Arte México',
  // Dominio principal (miamaria.com.mx redirige a www en Vercel)
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.miamaria.com.mx').replace(/\/$/, ''),
  descripcion:
    'Joyería de autor en Polanco, CDMX. Collares, aretes, pulseras y anillos en baño de oro, nácar y piedras. Visítanos en Masaryk 998 o pide por WhatsApp con envío a todo México.',
  tienda: {
    direccion: 'Av. Presidente Masaryk 998, Polanco, CDMX',
    corta: 'Masaryk 998',
    calle: 'Av. Presidente Masaryk 998',
    colonia: 'Polanco',
    alcaldia: 'Miguel Hidalgo',
    ciudad: 'Ciudad de México',
    mapa: 'https://maps.google.com/?q=Presidente+Masaryk+998+Polanco+CDMX',
  },
  // Número que recibe los pedidos por WhatsApp: 52 + 10 dígitos, sin espacios.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '5215500000000',
  /** true cuando ya se configuró el número real (se publica en los datos para Google). */
  whatsappReal: !!process.env.NEXT_PUBLIC_WHATSAPP,
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || '',
}

export type MetodoEntrega = 'tienda' | 'cdmx' | 'nacional'

export const ENVIO_GRATIS_DESDE = 2000

export const entregas: Record<MetodoEntrega, { titulo: string; detalle: string; costo: number }> = {
  tienda: { titulo: 'Recoger en tienda', detalle: `Sin costo · ${sitio.tienda.corta}`, costo: 0 },
  cdmx: { titulo: 'Envío en CDMX', detalle: 'Tiempo aprox. de 5 días', costo: 199 },
  nacional: { titulo: 'Envío a todo México', detalle: 'Paquetería nacional', costo: 399 },
}

/** Costo de envío: gratis en compras mayores a $2,000 (la recogida en tienda siempre es gratis). */
export function costoEnvio(metodo: MetodoEntrega, subtotal: number) {
  if (metodo === 'tienda' || subtotal > ENVIO_GRATIS_DESDE) return 0
  return entregas[metodo].costo
}

export const estatusPedido = {
  pendiente: { label: 'Pendiente de pago', color: 'bg-amber-100 text-amber-900' },
  pagado: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-900' },
  enviado: { label: 'Enviado', color: 'bg-sky-100 text-sky-900' },
  entregado: { label: 'Entregado', color: 'bg-neutral-200 text-neutral-900' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-900' },
} as const

export type EstatusPedido = keyof typeof estatusPedido

/** Estatus en los que el pedido ya descontó inventario. */
export const estatusConStock: EstatusPedido[] = ['pagado', 'enviado', 'entregado']
