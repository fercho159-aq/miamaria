import type { MetadataRoute } from 'next'
import { getUrlsSitemap } from '@/lib/data'
import { abs, urlColeccion, urlProducto } from '@/lib/seo'

// Se genera en cada visita para incluir productos nuevos sin volver a publicar.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { productos, colecciones } = await getUrlsSitemap()
  const ultimo = productos[0]?.actualizado ?? new Date()
  return [
    { url: abs('/'), lastModified: ultimo, changeFrequency: 'weekly', priority: 1, images: [abs('/images/hero-modelo.webp')] },
    { url: abs('/catalogo'), lastModified: ultimo, changeFrequency: 'daily', priority: 0.9 },
    ...colecciones.map((c) => ({
      url: abs(urlColeccion(c.slug)),
      lastModified: c.actualizado,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...productos.map((p) => ({
      url: abs(urlProducto(p.clave)),
      lastModified: p.actualizado,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: p.imagenes.map(abs),
    })),
  ]
}
