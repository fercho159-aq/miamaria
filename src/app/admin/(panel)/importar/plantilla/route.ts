import * as XLSX from 'xlsx'
import { getAdmin } from '@/lib/auth'

// Plantilla de Excel con los encabezados que reconoce la importación.
export async function GET() {
  if (!(await getAdmin())) return new Response('No autorizado', { status: 401 })
  const ws = XLSX.utils.aoa_to_sheet([
    ['SKU', 'Nombre', 'Descripción', 'Categoría', 'Precio', 'Existencia'],
    ['MM-COL-001', 'Collar Corazón Pavé', 'Dije de corazón con zirconias, cadena de 45 cm', 'Collares', 1890, 5],
  ])
  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 48 }, { wch: 14 }, { wch: 10 }, { wch: 11 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-inventario-miamaria.xlsx"',
    },
  })
}
