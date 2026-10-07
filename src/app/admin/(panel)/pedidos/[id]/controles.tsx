'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { cambiarEstatus, guardarNotaInterna, guardarPagoEnvio } from '@/actions/pedidos'
import { estatusPedido, formasPago, type EstatusPedido } from '@/lib/config'

export function ControlEstatus({ pedidoId, estatus }: { pedidoId: number; estatus: string }) {
  const [pending, start] = useTransition()
  const [valor, setValor] = useState(estatus)

  function cambiar(nuevo: EstatusPedido) {
    if (nuevo === 'cancelado' && !confirm('¿Cancelar este pedido? Si ya había descontado piezas, regresan al inventario.')) {
      setValor(estatus)
      return
    }
    setValor(nuevo)
    start(async () => {
      await cambiarEstatus(pedidoId, nuevo)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={valor}
        disabled={pending}
        onChange={(e) => cambiar(e.target.value as EstatusPedido)}
        className="campo !py-2 text-sm"
      >
        {(Object.keys(estatusPedido) as EstatusPedido[]).map((e) => (
          <option key={e} value={e}>
            {estatusPedido[e].label}
          </option>
        ))}
      </select>
      {pending && <Loader2 size={16} className="animate-spin text-neutral-400" />}
    </div>
  )
}

export function NotaInterna({ pedidoId, inicial }: { pedidoId: number; inicial: string }) {
  const [nota, setNota] = useState(inicial)
  const [guardado, setGuardado] = useState(false)
  const [pending, start] = useTransition()
  return (
    <div>
      <textarea
        value={nota}
        onChange={(e) => {
          setNota(e.target.value)
          setGuardado(false)
        }}
        rows={3}
        placeholder="Ej. Pagó por transferencia, guía de envío, etc. (solo la ve el administrador)"
        className="campo text-sm"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          disabled={pending || nota === inicial}
          onClick={() =>
            start(async () => {
              await guardarNotaInterna(pedidoId, nota)
              setGuardado(true)
            })
          }
          className="btn-negro !px-4 !py-2"
        >
          Guardar nota
        </button>
        {guardado && <span className="text-xs text-emerald-700">Guardada</span>}
      </div>
    </div>
  )
}

export function PagoEnvio({
  pedidoId,
  inicial,
  conEnvio,
}: {
  pedidoId: number
  inicial: { formaPago: string; paqueteria: string; guiaEnvio: string }
  conEnvio: boolean
}) {
  const [datos, setDatos] = useState(inicial)
  const [guardado, setGuardado] = useState(false)
  const [pending, start] = useTransition()
  const cambiar = (campo: keyof typeof inicial, valor: string) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setGuardado(false)
  }
  const sinCambios = (Object.keys(inicial) as (keyof typeof inicial)[]).every((k) => datos[k] === inicial[k])

  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="mb-1.5 block text-xs text-neutral-500">Forma de pago</span>
        <select value={datos.formaPago} onChange={(e) => cambiar('formaPago', e.target.value)} className="campo !py-2 text-sm">
          <option value="">Sin registrar</option>
          {formasPago.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
      {conEnvio && (
        <>
          <label className="block">
            <span className="mb-1.5 block text-xs text-neutral-500">Paquetería</span>
            <input value={datos.paqueteria} onChange={(e) => cambiar('paqueteria', e.target.value)} maxLength={80} placeholder="Ej. DHL, Estafeta" className="campo !py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-neutral-500">Guía de envío</span>
            <input value={datos.guiaEnvio} onChange={(e) => cambiar('guiaEnvio', e.target.value)} maxLength={80} className="campo !py-2 text-sm" />
          </label>
        </>
      )}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={pending || sinCambios}
          onClick={() =>
            start(async () => {
              await guardarPagoEnvio(pedidoId, datos)
              setGuardado(true)
            })
          }
          className="btn-negro !px-4 !py-2"
        >
          Guardar
        </button>
        {guardado && <span className="text-xs text-emerald-700">Guardado</span>}
      </div>
    </div>
  )
}
