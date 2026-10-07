import Link from 'next/link'
import type { Producto } from '@/lib/data'
import { precioCatalogo } from '@/lib/format'
import { urlProducto } from '@/lib/seo'
import { urlWhatsApp } from '@/lib/whatsapp'
import { FotoProducto } from './foto-producto'
import { BotonAgregar } from './carrito/boton-agregar'

export function TarjetaProducto({ p }: { p: Producto }) {
  const agotado = p.stock <= 0
  return (
    <article className="group flex flex-col">
      <Link href={urlProducto(p.sku)} className="relative block aspect-[4/5] overflow-hidden bg-tinta">
        <FotoProducto
          src={p.imagenUrl}
          alt={p.nombre}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="transition duration-[1600ms] ease-out group-hover:scale-[1.05]"
        />
        {p.imagen2Url && (
          // Segunda foto: aparece despacio al pasar el mouse
          <div className="absolute inset-0 opacity-0 transition-opacity duration-[1200ms] ease-out group-hover:opacity-100">
            <FotoProducto
              src={p.imagen2Url}
              alt={`${p.nombre}, puesta`}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="scale-[1.06] transition duration-[2000ms] ease-out group-hover:scale-100"
            />
          </div>
        )}
        {agotado && (
          <span className="eyebrow absolute top-3 left-3 bg-white/90 px-2.5 py-1 text-[0.6rem] text-tinta">Agotado</span>
        )}
        {!agotado && p.stock <= 2 && (
          <span className="eyebrow absolute top-3 left-3 bg-oro px-2.5 py-1 text-[0.6rem] text-tinta">Últimas piezas</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-4 text-center">
        {p.categoria && <p className="eyebrow text-[0.6rem] text-oro-oscuro">{p.categoria}</p>}
        <h3 className="mt-1 font-serif text-xl leading-tight">
          <Link href={urlProducto(p.sku)}>{p.nombre}</Link>
        </h3>
        <p className={`mt-1 text-sm tracking-wide ${p.precio == null ? 'text-oro-oscuro italic' : 'text-neutral-600'}`}>
          {precioCatalogo(p.precio)}
        </p>
        <div className="mt-auto pt-3">
          {p.precio == null ? (
            <a
              href={urlWhatsApp(`Hola Mía María, me interesa ${p.nombre} (${p.sku}). ¿Me compartes precio y disponibilidad?`)}
              target="_blank"
              rel="noopener"
              className="eyebrow block w-full border border-tinta/80 py-2.5 text-[0.62rem] transition duration-500 hover:bg-tinta hover:text-white"
            >
              Consultar
            </a>
          ) : (
            <BotonAgregar
              producto={{ sku: p.sku, nombre: p.nombre, precio: p.precio, imagenUrl: p.imagenUrl, stock: p.stock }}
              variante="compacto"
            />
          )}
        </div>
      </div>
    </article>
  )
}
