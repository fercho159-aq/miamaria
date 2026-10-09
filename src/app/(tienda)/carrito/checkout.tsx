'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Check, Loader2, MessageCircle, Minus, Plus, X } from 'lucide-react'
import { crearPedido } from '@/actions/pedidos'
import { useCarrito } from '@/components/carrito/carrito-context'
import { FotoProducto } from '@/components/foto-producto'
import { ENVIO_GRATIS_DESDE, costoEnvio, entregas, type MetodoEntrega } from '@/lib/config'
import { precio } from '@/lib/format'
import { urlWhatsApp } from '@/lib/whatsapp'

export function Checkout() {
  const { items, subtotal, listo, cambiarCantidad, quitar, limitar, vaciar } = useCarrito()
  const [entrega, setEntrega] = useState<MetodoEntrega>('tienda')
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<{ folio: string; url: string } | null>(null)
  const [pending, start] = useTransition()

  const envio = costoEnvio(entrega, subtotal)
  const total = subtotal + envio

  function enviar(form: FormData) {
    setError(null)
    start(async () => {
      const res = await crearPedido({
        nombre: String(form.get('nombre') ?? ''),
        telefono: String(form.get('telefono') ?? ''),
        email: String(form.get('email') ?? ''),
        entrega,
        direccion: String(form.get('direccion') ?? ''),
        notas: String(form.get('notas') ?? ''),
        items: items.map((i) => ({ id: i.id, cantidad: i.cantidad })),
      })
      if (!res.ok) {
        if (res.ajustes) limitar(res.ajustes)
        setError(res.error)
        return
      }
      const url = urlWhatsApp(res.mensaje)
      setHecho({ folio: res.folio, url })
      vaciar()
      window.scrollTo({ top: 0 })
      // Abre WhatsApp con el pedido listo para enviar.
      setTimeout(() => window.location.assign(url), 700)
    })
  }

  if (hecho) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tinta text-oro">
          <Check size={28} strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-8 text-oro-oscuro">Pedido {hecho.folio}</p>
        <h1 className="mt-3 font-serif text-4xl">¡Gracias por tu pedido!</h1>
        <p className="mt-5 leading-relaxed text-neutral-600">
          Estamos abriendo WhatsApp con el detalle de tu pedido. <b>Envía el mensaje</b> para que te confirmemos
          disponibilidad y los datos de pago.
        </p>
        <a href={hecho.url} className="btn-negro mt-10">
          <MessageCircle size={16} /> Enviar pedido por WhatsApp
        </a>
        <div className="mt-6">
          <Link href="/catalogo" className="eyebrow text-neutral-500 underline-offset-4 hover:underline">
            Seguir viendo el catálogo
          </Link>
        </div>
      </div>
    )
  }

  if (!listo) return <div className="min-h-[60vh]" />

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-28 text-center">
        <h1 className="font-serif text-4xl">Tu carrito está vacío</h1>
        <p className="mt-4 text-neutral-500">Agrega tus piezas favoritas y vuelve aquí para enviar tu pedido.</p>
        <Link href="/catalogo" className="btn-negro mt-10">
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-24 sm:px-6">
      <h1 className="text-center font-serif text-5xl">Finalizar pedido</h1>
      <p className="mx-auto mt-4 max-w-lg text-center text-sm text-neutral-500">
        Al enviar, se abrirá WhatsApp con el detalle de tu pedido para confirmar el pago con nosotros.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviar(new FormData(e.currentTarget))
        }}
        className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <fieldset>
            <legend className="eyebrow mb-5 text-oro-oscuro">1 · Tus datos</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm">Nombre completo *</span>
                <input name="nombre" required autoComplete="name" className="campo" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm">WhatsApp / teléfono *</span>
                <input name="telefono" required type="tel" inputMode="tel" autoComplete="tel" placeholder="10 dígitos" className="campo" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm">Correo (opcional)</span>
                <input name="email" type="email" autoComplete="email" className="campo" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-5 text-oro-oscuro">2 · Entrega</legend>
            <div className="space-y-3">
              {(Object.keys(entregas) as MetodoEntrega[]).map((m) => {
                const costo = costoEnvio(m, subtotal)
                return (
                  <label
                    key={m}
                    className={`flex cursor-pointer items-center gap-4 border p-4 transition ${
                      entrega === m ? 'border-tinta bg-marfil' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <input type="radio" name="entrega" value={m} checked={entrega === m} onChange={() => setEntrega(m)} className="accent-tinta" />
                    <span className="flex-1">
                      <span className="block font-medium">{entregas[m].titulo}</span>
                      <span className="block text-xs text-neutral-500">{entregas[m].detalle}</span>
                    </span>
                    <span className="text-sm">
                      {costo ? (
                        precio(costo)
                      ) : (
                        <>
                          {m !== 'tienda' && <s className="mr-2 text-neutral-400">{precio(entregas[m].costo)}</s>}
                          Gratis
                        </>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
            {entrega !== 'tienda' && (
              <label className="mt-5 block">
                <span className="mb-1.5 block text-sm">Dirección de envío completa *</span>
                <textarea
                  name="direccion"
                  required
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Calle y número, colonia, alcaldía o municipio, ciudad, estado y C.P."
                  className="campo"
                />
              </label>
            )}
            {entrega !== 'tienda' && subtotal <= ENVIO_GRATIS_DESDE && (
              <p className="mt-3 text-xs text-oro-oscuro">
                Te faltan {precio(ENVIO_GRATIS_DESDE - subtotal)} para superar {precio(ENVIO_GRATIS_DESDE)} y obtener envío gratis.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-5 text-oro-oscuro">3 · Notas (opcional)</legend>
            <textarea name="notas" rows={2} placeholder="¿Es para regalo? ¿Algún detalle?" className="campo" />
          </fieldset>
        </div>

        <aside className="h-fit bg-marfil p-6 sm:p-8 lg:sticky lg:top-32">
          <h2 className="eyebrow mb-5">Tu pedido</h2>
          <ul className="divide-y divide-hueso">
            {items.map((i) => (
              <li key={i.id} className="flex gap-3 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-tinta">
                  <FotoProducto src={i.imagenUrl} alt={i.nombre} sizes="64px" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <p className="font-serif text-lg leading-tight">{i.nombre}</p>
                    <button type="button" aria-label={`Quitar ${i.nombre}`} onClick={() => quitar(i.id)} className="self-start text-neutral-400 hover:text-tinta">
                      <X size={15} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-neutral-300 bg-white">
                      <button type="button" aria-label="Menos" className="p-1.5" onClick={() => cambiarCantidad(i.id, i.cantidad - 1)}>
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center text-xs">{i.cantidad}</span>
                      <button
                        type="button"
                        aria-label="Más"
                        className="p-1.5 disabled:opacity-30"
                        disabled={i.cantidad >= i.stock}
                        onClick={() => cambiarCantidad(i.id, i.cantidad + 1)}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className="text-sm">{precio(i.precio * i.cantidad)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-hueso pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{precio(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{entregas[entrega].titulo}</dt>
              <dd>{envio ? precio(envio) : 'Gratis'}</dd>
            </div>
            <div className="flex justify-between border-t border-hueso pt-3 text-lg">
              <dt className="font-serif text-xl">Total</dt>
              <dd className="font-medium">{precio(total)}</dd>
            </div>
          </dl>
          {error && <p className="mt-5 border-l-2 border-red-700 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button type="submit" disabled={pending} className="btn-negro mt-6 w-full">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            Enviar pedido por WhatsApp
          </button>
          <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">
            Tu pedido queda registrado como pre-orden. El pago se confirma por WhatsApp.
          </p>
        </aside>
      </form>
    </div>
  )
}
