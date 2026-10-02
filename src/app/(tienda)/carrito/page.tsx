import type { Metadata } from 'next'
import { Checkout } from './checkout'

export const metadata: Metadata = { title: 'Finalizar pedido', robots: { index: false } }

export default function CarritoPage() {
  return <Checkout />
}
