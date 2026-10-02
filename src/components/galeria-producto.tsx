'use client'

import { useState } from 'react'
import { FotoProducto } from './foto-producto'

/** Foto grande con fundido lento entre vistas; miniaturas verticales a un lado. */
export function GaleriaProducto({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [actual, setActual] = useState(0)

  if (fotos.length <= 1) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden bg-tinta">
        <FotoProducto src={fotos[0] ?? null} alt={nombre} sizes="(min-width: 768px) 50vw, 100vw" priority />
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <div className="flex gap-3 sm:w-20 sm:flex-col">
        {fotos.map((f, i) => (
          <button
            key={f}
            type="button"
            onClick={() => setActual(i)}
            aria-label={`Ver foto ${i + 1}`}
            className={`relative aspect-[4/5] w-20 overflow-hidden bg-tinta transition duration-700 ${
              i === actual ? 'opacity-100 ring-1 ring-oro ring-offset-2' : 'opacity-50 hover:opacity-90'
            }`}
          >
            <FotoProducto src={f} alt="" sizes="80px" />
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-tinta">
        {fotos.map((f, i) => (
          <div
            key={f}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${i === actual ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== actual}
          >
            <FotoProducto
              src={f}
              alt={i === 0 ? nombre : `${nombre}, otra vista`}
              sizes="(min-width: 768px) 45vw, 100vw"
              priority={i === 0}
              className={`transition duration-[2200ms] ease-out ${i === actual ? 'scale-100' : 'scale-105'}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
