import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-tinta px-6 text-center text-white">
      <Image src="/images/logo-simbolo.png" alt="" width={80} height={80} className="h-20 w-20 object-contain opacity-80" />
      <h1 className="mt-8 font-serif text-4xl">Esta página no existe</h1>
      <p className="mt-3 text-white/60">Quizá la pieza que buscas ya no está disponible.</p>
      <Link href="/catalogo" className="btn-oro mt-10">
        Ver catálogo
      </Link>
    </div>
  )
}
