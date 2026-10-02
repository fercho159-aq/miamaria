'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface DiapositivaPortada {
  imagen: string
  alt: string
  posicion?: string
  eyebrow?: string
  titulo: string[]
  subtitulo?: string
  cta: { href: string; label: string }
  cta2?: { href: string; label: string; externo?: boolean }
}

const DURACION = 7500

/** Portada a dos columnas: foto con zoom lento y texto que cambia con fundido. */
export function CarruselPortada({ diapositivas }: { diapositivas: DiapositivaPortada[] }) {
  const [actual, setActual] = useState(0)
  const [pausa, setPausa] = useState(false)
  const total = diapositivas.length

  const ir = useCallback((i: number) => setActual(((i % total) + total) % total), [total])

  useEffect(() => {
    if (pausa || total < 2) return
    const t = setTimeout(() => ir(actual + 1), DURACION)
    return () => clearTimeout(t)
  }, [actual, pausa, total, ir])

  return (
    <section
      className="relative grid bg-marfil md:grid-cols-2"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      aria-roledescription="carrusel"
    >
      {/* Fotos */}
      <div className="relative aspect-[4/5] overflow-hidden bg-tinta md:aspect-auto md:min-h-[680px]">
        {diapositivas.map((d, i) => (
          <div
            key={d.imagen}
            className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${i === actual ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== actual}
          >
            <Image
              key={i === actual ? `on-${actual}` : 'off'}
              src={d.imagen}
              alt={d.alt}
              fill
              priority={i === 0}
              quality={85}
              sizes="(min-width: 768px) 50vw, 100vw"
              className={`object-cover ${i === actual ? 'ken-burns' : ''}`}
              style={{ objectPosition: d.posicion ?? '50% 30%' }}
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>

      {/* Texto */}
      <div className="relative flex min-h-[460px] flex-col items-center justify-center px-6 py-16 text-center md:py-10">
        <Image src="/images/logo-dorado.png" alt="Mía María · Arte México" width={781} height={979} priority className="h-auto w-24 sm:w-28" />
        <div className="relative mt-10 grid w-full place-items-center">
          {diapositivas.map((d, i) => (
            <div
              key={d.imagen}
              className={`col-start-1 row-start-1 flex flex-col items-center transition-all duration-[1400ms] ease-out ${
                i === actual ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
              }`}
              aria-hidden={i !== actual}
            >
              {d.eyebrow && <p className="eyebrow mb-5 text-oro-oscuro">{d.eyebrow}</p>}
              <h2 className="font-serif text-[2.1rem] leading-[1.12] tracking-wide uppercase sm:text-5xl">
                {d.titulo.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </h2>
              {d.subtitulo && (
                <p className="mt-4 font-serif text-xl tracking-wide text-neutral-700 uppercase sm:text-[1.7rem]">{d.subtitulo}</p>
              )}
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href={d.cta.href} className="btn-negro" tabIndex={i === actual ? 0 : -1}>
                  {d.cta.label}
                </Link>
                {d.cta2 && (
                  <a
                    href={d.cta2.href}
                    className="btn-linea"
                    tabIndex={i === actual ? 0 : -1}
                    {...(d.cta2.externo ? { target: '_blank', rel: 'noopener' } : {})}
                  >
                    {d.cta2.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {total > 1 && (
          <div className="mt-12 flex items-center gap-3">
            {diapositivas.map((d, i) => (
              <button
                key={d.imagen}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                className="relative h-5 w-10"
              >
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-neutral-300" />
                {i === actual && (
                  <span
                    key={`${actual}-${pausa}`}
                    className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-tinta ${pausa ? '' : 'barra-progreso'}`}
                    style={{ ['--duracion' as string]: `${DURACION}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(actual - 1)}
            aria-label="Anterior"
            className="absolute top-[38%] left-5 flex h-12 w-12 items-center justify-center rounded-full bg-tinta/70 text-white backdrop-blur transition hover:bg-tinta md:top-1/2 md:left-8 md:-translate-y-1/2"
          >
            <ChevronLeft size={20} strokeWidth={1.4} />
          </button>
          <button
            type="button"
            onClick={() => ir(actual + 1)}
            aria-label="Siguiente"
            className="absolute top-[38%] right-5 flex h-12 w-12 items-center justify-center rounded-full bg-tinta/70 text-white backdrop-blur transition hover:bg-tinta md:top-1/2 md:right-8 md:-translate-y-1/2"
          >
            <ChevronRight size={20} strokeWidth={1.4} />
          </button>
        </>
      )}
    </section>
  )
}
