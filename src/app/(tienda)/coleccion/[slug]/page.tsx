import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { VistaCatalogo } from '@/components/vista-catalogo'
import { getCategorias } from '@/lib/data'
import { descripcionColeccion, migas, urlColeccion } from '@/lib/seo'

async function coleccion(slug: string) {
  return (await getCategorias()).find((c) => c.slug === slug) ?? null
}

export async function generateMetadata({ params, searchParams }: PageProps<'/coleccion/[slug]'>): Promise<Metadata> {
  const c = await coleccion((await params).slug)
  if (!c) return { title: 'Colección no encontrada' }
  const { q } = await searchParams
  return {
    title: `${c.nombre} de autor`,
    description: descripcionColeccion(c.nombre),
    alternates: { canonical: urlColeccion(c.slug) },
    openGraph: c.imagen ? { images: [c.imagen] } : undefined,
    robots: q ? { index: false, follow: true } : undefined,
  }
}

export default async function ColeccionPage({ params, searchParams }: PageProps<'/coleccion/[slug]'>) {
  const c = await coleccion((await params).slug)
  if (!c) notFound()
  const { q } = await searchParams
  return (
    <>
      <JsonLd
        data={migas([
          { nombre: 'Catálogo', ruta: '/catalogo' },
          { nombre: c.nombre, ruta: urlColeccion(c.slug) },
        ])}
      />
      <VistaCatalogo categoria={c.slug} q={typeof q === 'string' ? q : undefined} descripcion={descripcionColeccion(c.nombre)} />
    </>
  )
}
