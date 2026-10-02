import type { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Panel', robots: { index: false } }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-tinta px-4">
      <div className="w-full max-w-sm">
        <Image src="/images/logo-dorado.png" alt="Mía María" width={781} height={979} priority className="mx-auto h-auto w-24" />
        <p className="eyebrow mt-8 text-center text-oro-claro">Panel de administración</p>
        <LoginForm />
      </div>
    </div>
  )
}
