import { sitio } from './config'

export const abs = (ruta: string) => (ruta.startsWith('http') ? ruta : `${sitio.url}${ruta.startsWith('/') ? '' : '/'}${ruta}`)

export const urlColeccion = (slug: string) => `/coleccion/${slug}`
export const urlProducto = (sku: string) => `/producto/${encodeURIComponent(sku)}`

export const descripcionColeccion = (nombre: string) =>
  `${nombre} Mía María: joyería de autor en plata, acero y chapa de oro. Pide por WhatsApp y recoge en Masaryk 998, Polanco, o recibe en todo México.`

/** Datos de la tienda física (JewelryStore) para Google. */
export function datosTienda() {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${sitio.url}/#tienda`,
    name: 'Mía María · Arte México',
    url: sitio.url,
    logo: abs('/images/logo-dorado.png'),
    image: [abs('/images/og-miamaria.jpg'), abs('/images/hero-modelo.webp')],
    description: sitio.descripcion,
    priceRange: '$$',
    currenciesAccepted: 'MXN',
    address: {
      '@type': 'PostalAddress',
      streetAddress: sitio.tienda.calle,
      addressLocality: sitio.tienda.ciudad,
      addressRegion: 'CDMX',
      addressCountry: 'MX',
    },
    areaServed: 'MX',
    ...(sitio.whatsappReal ? { telephone: `+${sitio.whatsapp}` } : {}),
    ...(sitio.instagram ? { sameAs: [sitio.instagram] } : {}),
  }
}

export function datosSitio() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${sitio.url}/#sitio`,
    name: 'Mía María',
    url: sitio.url,
    inLanguage: 'es-MX',
    publisher: { '@id': `${sitio.url}/#tienda` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${sitio.url}/catalogo?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function migas(items: { nombre: string; ruta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ nombre: 'Inicio', ruta: '/' }, ...items].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nombre,
      item: abs(it.ruta),
    })),
  }
}

export function datosProducto(p: {
  sku: string
  nombre: string
  descripcion: string
  precio: number | null
  stock: number
  imagenUrl: string | null
  imagen2Url: string | null
  categoria: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    sku: p.sku,
    description: p.descripcion || `${p.nombre} de Mía María, joyería de autor.`,
    image: [p.imagenUrl, p.imagen2Url].filter(Boolean).map((u) => abs(u!)),
    brand: { '@type': 'Brand', name: 'Mía María' },
    ...(p.categoria ? { category: p.categoria } : {}),
    // Sin precio publicado no se declara oferta (Google la exige con precio)
    ...(p.precio == null ? {} : { offers: {
      '@type': 'Offer',
      url: abs(urlProducto(p.sku)),
      priceCurrency: 'MXN',
      price: p.precio.toFixed(2),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${sitio.url}/#tienda` },
    } }),
  }
}
