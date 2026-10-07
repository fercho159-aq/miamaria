import { requireAdmin } from '@/lib/auth'
import { getAdmins } from '@/lib/data'
import { CambiarPassword, FilaAdmin, NuevoAdmin } from './controles'

export const metadata = { title: 'Accesos' }

export default async function AccesosPage() {
  const [yo, admins] = await Promise.all([requireAdmin(), getAdmins()])
  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="font-serif text-4xl">Accesos</h1>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Mi contraseña</h2>
        <CambiarPassword email={yo.email} />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Personas con acceso al panel</h2>
        <ul className="divide-y divide-neutral-100 bg-white">
          {admins.map((a) => (
            <FilaAdmin key={a.id} admin={a} soyYo={a.id === yo.id} />
          ))}
        </ul>
        <NuevoAdmin />
      </section>
    </div>
  )
}
