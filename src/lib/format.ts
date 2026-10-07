const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

export const precio = (n: number | string) => mxn.format(Number(n))

/** Precio de catálogo: los productos sin precio se muestran "a consultar". */
export const precioCatalogo = (n: number | null) => (n == null ? 'Precio a consultar' : precio(n))

const fecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City',
})

export const fechaHora = (d: string | Date) => fecha.format(new Date(d))

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
