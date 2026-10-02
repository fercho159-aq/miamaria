'use client'

import { Children, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

/**
 * Carrusel horizontal con flechas y deslizamiento táctil. Avanza solo una tarjeta
 * cada `intervalo` ms, despacio; se detiene cuando el cliente interactúa.
 */
export function CarruselHorizontal({
  children,
  intervalo = 6000,
  ancho = 'w-[72%] sm:w-[44%] lg:w-[calc(25%-18px)]',
}: {
  children: React.ReactNode
  intervalo?: number
  ancho?: string
}) {
  const pista = useRef<HTMLDivElement>(null)
  const [pausa, setPausa] = useState(false)
  const [bordes, setBordes] = useState({ inicio: true })

  const paso = () => {
    const el = pista.current
    const card = el?.firstElementChild as HTMLElement | null
    return card ? card.offsetWidth + 24 : 300
  }

  const mover = (dir: 1 | -1) => {
    const el = pista.current
    if (!el) return
    const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
    if (dir === 1 && alFinal) el.scrollTo({ left: 0, behavior: 'smooth' })
    else el.scrollBy({ left: dir * paso(), behavior: 'smooth' })
  }

  const moverRef = useRef(mover)
  useEffect(() => {
    moverRef.current = mover
  })

  useEffect(() => {
    if (pausa || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => moverRef.current(1), intervalo)
    return () => clearInterval(t)
  }, [pausa, intervalo])

  const actualizar = () => {
    const el = pista.current
    if (!el) return
    setBordes({ inicio: el.scrollLeft < 8 })
  }

  const flecha =
    'flex h-12 w-12 items-center justify-center rounded-full border border-tinta/20 text-tinta transition duration-500 hover:border-tinta hover:bg-tinta hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-tinta'

  return (
    <div onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} onTouchStart={() => setPausa(true)}>
      <div
        ref={pista}
        onScroll={actualizar}
        className="sin-barra flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth"
      >
        {Children.map(children, (c) => (
          <div className={`shrink-0 snap-start ${ancho}`}>{c}</div>
        ))}
      </div>
      <div className="mt-10 flex justify-center gap-3">
        <button type="button" aria-label="Anterior" className={flecha} disabled={bordes.inicio} onClick={() => mover(-1)}>
          <ArrowLeft size={18} strokeWidth={1.3} />
        </button>
        <button type="button" aria-label="Siguiente" className={flecha} onClick={() => mover(1)}>
          <ArrowRight size={18} strokeWidth={1.3} />
        </button>
      </div>
    </div>
  )
}
