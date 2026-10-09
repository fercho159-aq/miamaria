import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import { FotoProducto } from '@/components/foto-producto'
import { entregas, type MetodoEntrega } from '@/lib/config'
import { getPedido } from '@/lib/data'
import { fechaHora, precio } from '@/lib/format'
import { EtiquetaEstatus } from '../tabla-pedidos'
import { mensajeEstatus } from '@/lib/whatsapp'
import { ControlEstatus, NotaInterna, PagoEnvio } from './controles'

export default async function PedidoPage({ params }: PageProps<'/admin/pedidos/[id]'>) {
  const id = Number((await params).id)
  const p = Number.isInteger(id) ? await getPedido(id) : null
  if (!p) notFound()

  const tel = p.clienteTel.replace(/\D/g, '').slice(-10)
  // El mensaje cambia con el estatus: cobro, confirmación de pago, guía, etc.
  const mensaje = mensajeEstatus(p)

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-tinta">
        <ChevronLeft size={15} /> Pedidos
      </Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-serif text-4xl">Pedido {p.folio}</h1>
        <EtiquetaEstatus estatus={p.estatus} />
      </div>
      <p className="text-sm text-neutral-500">Recibido el {fechaHora(p.createdAt)}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="bg-white">
            <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-medium">Productos</h2>
            <ul className="divide-y divide-neutral-100">
              {p.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-tinta">
                    <FotoProducto src={i.imagenUrl} alt={i.nombre} sizes="48px" />
                  </div>
                  <div className="flex-1">
                    <p>{i.nombre}</p>
                    <p className="text-xs text-neutral-400">
                      {i.sku}
                      {i.stockActual !== null && ` · existencia actual: ${i.stockActual}`}
                    </p>
                  </div>
                  <p className="text-neutral-500">
                    {i.cantidad} × {precio(i.precio)}
                  </p>
                  <p className="w-24 text-right">{precio(i.cantidad * i.precio)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-neutral-100 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd>{precio(p.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">{entregas[p.entrega as MetodoEntrega]?.titulo}</dt>
                <dd>{p.envio ? precio(p.envio) : 'Gratis'}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-medium">
                <dt>Total</dt>
                <dd>{precio(p.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="bg-white p-5">
            <h2 className="mb-3 text-sm font-medium">Nota interna</h2>
            <NotaInterna pedidoId={p.id} inicial={p.notaInterna ?? ''} />
          </section>

          <section className="bg-white">
            <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-medium">Historial</h2>
            <ul className="divide-y divide-neutral-100 text-sm">
              {p.eventos.map((e) => (
                <li key={e.id} className="px-5 py-3">
                  <p>{e.descripcion}</p>
                  <p className="text-xs text-neutral-400">
                    {e.admin} · {fechaHora(e.createdAt)}
                  </p>
                </li>
              ))}
              <li className="px-5 py-3">
                <p>Pedido recibido desde la tienda</p>
                <p className="text-xs text-neutral-400">{fechaHora(p.createdAt)}</p>
              </li>
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-5">
            <h2 className="mb-3 text-sm font-medium">Estatus</h2>
            <ControlEstatus pedidoId={p.id} estatus={p.estatus} />
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              {p.stockDescontado
                ? 'Este pedido ya descontó sus piezas del inventario. Si lo cancelas, se regresan.'
                : 'Al marcarlo como Pagado se descuentan sus piezas del inventario.'}
            </p>
          </section>

          <section className="space-y-2 bg-white p-5 text-sm">
            <h2 className="mb-1 font-medium">Cliente</h2>
            <p>{p.clienteNombre}</p>
            <p>{p.clienteTel}</p>
            {p.clienteEmail && <p className="break-all">{p.clienteEmail}</p>}
            <a href={`https://wa.me/52${tel}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener" className="btn-negro mt-3 w-full !py-2.5">
              <MessageCircle size={15} /> Escribir por WhatsApp
            </a>
            <p className="pt-1 text-xs leading-relaxed text-neutral-500">
              Mensaje sugerido: “{mensaje.replaceAll('*', '')}” Lo puedes editar antes de enviarlo.
            </p>
          </section>

          <section className="bg-white p-5">
            <h2 className="mb-3 text-sm font-medium">{p.entrega === 'tienda' ? 'Pago' : 'Pago y envío'}</h2>
            <PagoEnvio
              key={`${p.formaPago}|${p.paqueteria}|${p.guiaEnvio}`}
              pedidoId={p.id}
              conEnvio={p.entrega !== 'tienda'}
              inicial={{ formaPago: p.formaPago ?? '', paqueteria: p.paqueteria ?? '', guiaEnvio: p.guiaEnvio ?? '' }}
            />
          </section>

          <section className="space-y-2 bg-white p-5 text-sm">
            <h2 className="mb-1 font-medium">Entrega</h2>
            <p>{entregas[p.entrega as MetodoEntrega]?.titulo}</p>
            {p.direccion && <p className="whitespace-pre-line text-neutral-600">{p.direccion}</p>}
            {p.notas && (
              <>
                <h3 className="pt-2 font-medium">Notas del cliente</h3>
                <p className="whitespace-pre-line text-neutral-600">{p.notas}</p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
