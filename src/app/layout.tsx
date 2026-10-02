import type { Metadata } from 'next'
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
  title: { default: 'Mía María · Arte México', template: '%s · Mía María' },
  description: `Joyería Mía María. Collares, aretes, pulseras y anillos. Visítanos en ${sitio.tienda.corta} o pide por WhatsApp con envío a todo México.`,
  openGraph: { images: ['/images/hero-modelo.webp'], locale: 'es_MX', type: 'website' },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-MX" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
