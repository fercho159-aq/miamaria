import type { MetadataRoute } from 'next'
import { sitio } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/carrito'] }],
    sitemap: `${sitio.url}/sitemap.xml`,
    host: sitio.url,
  }
}
