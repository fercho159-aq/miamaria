import Image from 'next/image'
import Link from 'next/link'

/** Franja de texto en movimiento lento (dorado sobre negro). */
export function MarquesinaTexto({ frases, duracion = 55 }: { frases: string[]; duracion?: number }) {
  const linea = (oculta?: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={oculta}>
      {frases.map((f) => (
        <span key={f} className="flex items-center">
          <span className="px-8 font-serif text-xl tracking-[0.18em] text-oro-claro uppercase sm:text-2xl">{f}</span>
          <span className="text-oro">✦</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className="overflow-hidden border-y border-oro/25 bg-tinta py-5">
      <div className="marquesina-x flex w-max" style={{ ['--duracion' as string]: `${duracion}s` }}>
        {linea()}
        {linea(true)}
        {linea(true)}
        {linea(true)}
      </div>
    </div>
  )
}

export interface ImagenGaleria {
  src: string
  alt: string
  href?: string
}

/** Columnas de fotos que suben y bajan muy despacio, en sentidos opuestos. */
export function GaleriaVertical({ imagenes, columnas = 3 }: { imagenes: ImagenGaleria[]; columnas?: 2 | 3 }) {
  const cols = Array.from({ length: columnas }, (_, c) => {
    // cada columna arranca en otra foto para que no se repitan lado a lado
    const rot = [...imagenes.slice((c * 2) % imagenes.length), ...imagenes.slice(0, (c * 2) % imagenes.length)]
    return rot
  })
  const velocidades = [80, 105, 92]

  return (
    <div className={`pausa-hover mascara-y grid h-[560px] gap-3 overflow-hidden sm:h-[680px] sm:gap-4 ${columnas === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}`}>
      {cols.map((col, c) => (
        <div key={c} className={`overflow-hidden ${c === 2 ? 'hidden lg:block' : ''}`}>
          <div
            className={`marquesina-y flex flex-col gap-3 sm:gap-4 ${c % 2 ? 'reversa' : ''}`}
            style={{ ['--duracion' as string]: `${velocidades[c]}s` }}
          >
            {[...col, ...col].map((img, i) => (
              <Celda key={`${img.src}-${i}`} img={img} oculta={i >= col.length} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Tira horizontal de fotos que avanza lentamente (se pausa al pasar el mouse). */
export function TiraImagenes({ imagenes, duracion = 90 }: { imagenes: ImagenGaleria[]; duracion?: number }) {
  const serie = [...imagenes, ...imagenes]
  return (
    <div className="pausa-hover mascara-x overflow-hidden">
      <div className="marquesina-x reversa flex w-max gap-3 sm:gap-4" style={{ ['--duracion' as string]: `${duracion}s` }}>
        {[...serie, ...serie].map((img, i) => (
          <div key={`${img.src}-${i}`} className="w-56 shrink-0 sm:w-72">
            <Celda img={img} oculta={i >= imagenes.length} cuadrada />
          </div>
        ))}
      </div>
    </div>
  )
}

function Celda({ img, oculta, cuadrada }: { img: ImagenGaleria; oculta?: boolean; cuadrada?: boolean }) {
  const contenido = (
    <div className={`group relative overflow-hidden bg-tinta ${cuadrada ? 'aspect-square' : 'aspect-[4/5]'}`}>
      <Image
        src={img.src}
        alt={oculta ? '' : img.alt}
        fill
        sizes="(min-width: 1024px) 22vw, 45vw"
        className="object-cover transition duration-[1600ms] ease-out group-hover:scale-105"
        unoptimized={img.src.startsWith('/uploads/')}
      />
      <div className="absolute inset-0 bg-black/0 transition duration-700 group-hover:bg-black/15" />
    </div>
  )
  return img.href ? (
    <Link href={img.href} tabIndex={oculta ? -1 : 0} aria-hidden={oculta}>
      {contenido}
    </Link>
  ) : (
    <div aria-hidden={oculta}>{contenido}</div>
  )
}
