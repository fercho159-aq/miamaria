import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { put } from '@vercel/blob'

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * Guarda la foto de un producto y regresa su URL pública.
 * Producción: Vercel Blob (BLOB_READ_WRITE_TOKEN). Sin token (desarrollo): public/uploads.
 */
export async function guardarImagen(file: File, sku: string) {
  if (!TIPOS.includes(file.type)) throw new Error('La foto debe ser JPG, PNG, WEBP o AVIF.')
  if (file.size > 5 * 1024 * 1024) throw new Error('La foto pesa más de 5 MB.')
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const nombre = `${sku.toLowerCase().replace(/[^a-z0-9-]/g, '')}-${crypto.randomBytes(4).toString('hex')}.${ext}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`productos/${nombre}`, file, { access: 'public', contentType: file.type })
    return blob.url
  }
  // En Vercel no se puede escribir en disco: sin Blob no hay dónde guardar la foto.
  if (process.env.VERCEL) {
    throw new Error('Falta conectar el almacén de fotos (Vercel Blob). El producto se puede guardar sin foto mientras tanto.')
  }
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, nombre), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${nombre}`
}
