'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { cambiarEstatus, guardarNotaInterna } from '@/actions/pedidos'
import { estatusPedido, type EstatusPedido } from '@/lib/config'

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
