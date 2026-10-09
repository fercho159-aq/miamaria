import { Download } from 'lucide-react'
import { FormImportar } from './form-importar'

export const metadata = { title: 'Importar Excel' }

export default function ImportarPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-serif text-4xl">Importar inventario</h1>
      <div className="space-y-3 bg-white p-6 text-sm leading-relaxed text-neutral-700">
        <p>
          Sube el Excel del inventario. La <b>primera fila</b> debe tener los encabezados. Se reconocen estas columnas:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>SKU</b> (obligatoria) — si ya existe, el producto se actualiza; si no, se crea. Si varios productos comparten SKU, se
            distinguen por el nombre.
          </li>
          <li>
            <b>Nombre</b> (obligatoria) y <b>Precio</b> — si va vacío, el producto se publica como “precio a consultar”.
          </li>
          <li>
            <b>Descripción</b> y <b>Categoría</b> — las categorías nuevas se crean solas. Para una subcategoría escribe{' '}
            <b>Collares &gt; Plata</b>.
          </li>
          <li>
            <b>Existencia</b> (o Stock / Cantidad) — opcional. Si no viene, se conserva la existencia actual.
          </li>
        </ul>
        <p>Las fotos se agregan después desde cada producto.</p>
        <a href="/admin/importar/plantilla" className="btn-linea mt-2 !px-4 !py-2.5">
          <Download size={15} /> Descargar plantilla
        </a>
      </div>
      <FormImportar />
    </div>
  )
}
