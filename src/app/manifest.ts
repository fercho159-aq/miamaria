import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mía María · Arte México',
    short_name: 'Mía María',
    description: 'Joyería de autor en Polanco, CDMX.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d0d',
    theme_color: '#0d0d0d',
    lang: 'es-MX',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
  }
}
