import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { VistaCatalogo } from '@/components/vista-catalogo'
import { getCategorias } from '@/lib/data'
import { descripcionColeccion, migas, urlColeccion } from '@/lib/seo'

async function coleccion(slug: string) {
  const todas = await getCategorias()
  const c = todas.find((x) => x.slug === slug)
  if (!c) return null
  // De la principal a la actual, para las migas.
  const camino = [c]
  while (camino[0].parentId != null) {
    const madre = todas.find((x) => x.id === camino[0].parentId)
    if (!madre) break
    camino.unshift(madre)
  }
  return { ...c, camino }
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
          ...c.camino.map((x) => ({ nombre: x.nombre, ruta: urlColeccion(x.slug) })),
        ])}
      />
      <VistaCatalogo categoria={c.slug} q={typeof q === 'string' ? q : undefined} descripcion={descripcionColeccion(c.nombre)} />
    </>
  )
}
