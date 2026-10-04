import Image from 'next/image'
import Link from 'next/link'
import { entregas, sitio } from '@/lib/config'
import { precio } from '@/lib/format'
import { urlColeccion } from '@/lib/seo'

export function Pie({ categorias }: { categorias: { nombre: string; slug: string }[] }) {
  return (
    <footer className="mt-auto bg-tinta text-white/75">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/images/logo-dorado.png" alt="Mía María · Arte México" width={781} height={979} className="h-auto w-28" />
        </div>
        <div>
          <h3 className="eyebrow mb-5 text-oro">Catálogo</h3>
          <ul className="space-y-2.5 text-sm">
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link href={urlColeccion(c.slug)} className="hover:text-oro">
                  {c.nombre}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/catalogo" className="hover:text-oro">
                Ver todo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-5 text-oro">Entregas</h3>
          <ul className="space-y-2.5 text-sm">
            {Object.values(entregas).map((e) => (
              <li key={e.titulo}>
                {e.titulo} · {e.costo ? precio(e.costo) : 'Gratis'}
              </li>
            ))}
            <li className="text-oro-claro">Envío gratis desde $2,000</li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-5 text-oro">Tienda</h3>
          <p className="text-sm leading-relaxed">
            <a href={sitio.tienda.mapa} target="_blank" rel="noopener" className="hover:text-oro">
              {sitio.tienda.direccion}
            </a>
          </p>
          <a
            href={`https://wa.me/${sitio.whatsapp}`}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-block text-sm hover:text-oro"
          >
            WhatsApp
          </a>
          {sitio.instagram && (
            <a href={sitio.instagram} target="_blank" rel="noopener" className="mt-2 block text-sm hover:text-oro">
              Instagram
            </a>
          )}
        </div>
      </div>
      <div className="filete-oro opacity-40" />
      <p className="px-6 py-6 text-center text-[0.68rem] tracking-[0.2em] text-white/40 uppercase">
        © {new Date().getFullYear()} Mía María · Arte México
      </p>
    </footer>
  )
}
