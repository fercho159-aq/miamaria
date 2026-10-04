import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { sitio } from '@/lib/config'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  metadataBase: new URL(sitio.url),
  title: { default: 'Mía María · Joyería de autor en Polanco, CDMX', template: '%s · Mía María' },
  description: sitio.descripcion,
  applicationName: 'Mía María',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Mía María · Arte México',
    images: [{ url: '/images/og-miamaria.jpg', width: 1200, height: 630, alt: 'Mía María · Arte México' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/og-miamaria.jpg'] },
  robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 } },
  // Search Console: si se verifica por etiqueta HTML en vez de DNS
  verification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } : undefined,
}

export const viewport: Viewport = { themeColor: '#0d0d0d' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-MX" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
