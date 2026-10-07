import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { VistaCatalogo } from '@/components/vista-catalogo'
import { urlColeccion } from '@/lib/seo'

export async function generateMetadata({ searchParams }: PageProps<'/catalogo'>): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: 'Catálogo de joyería',
    description:
      'Collares, aretes, pulseras, anillos y ear cuffs Mía María. Joyería de autor en plata, acero y chapa de oro. Recoge en Masaryk 998, Polanco, o recibe en todo México.',
    alternates: { canonical: '/catalogo' },
    // Los resultados de búsqueda no se indexan
    robots: q ? { index: false, follow: true } : undefined,
  }
}

export default async function Catalogo({ searchParams }: PageProps<'/catalogo'>) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q : undefined
  // Ligas viejas ?categoria=… → página propia de la colección
  if (typeof sp.categoria === 'string' && sp.categoria) {
    permanentRedirect(urlColeccion(sp.categoria) + (q ? `?q=${encodeURIComponent(q)}` : ''))
  }
  return <VistaCatalogo q={q} />
}
