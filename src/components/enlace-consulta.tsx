'use client'

import { registrarConsulta } from '@/actions/consultas'

/** Liga a WhatsApp para preguntar por un producto; deja registro de la consulta en el panel. */
export function EnlaceConsulta({
  productoId,
  href,
  className,
  children,
}: {
  productoId: number
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => {
        void registrarConsulta(productoId)
      }}
    >
      {children}
    </a>
  )
}
