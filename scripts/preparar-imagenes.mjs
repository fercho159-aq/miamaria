// Genera las imágenes del sitio a partir de las fotos de referencia (../_referencias).
//   node scripts/preparar-imagenes.mjs
import sharp from 'sharp'
import path from 'node:path'

const ref = (f) => path.join('..', '_referencias', f)
const out = (f) => path.join('public', 'images', f)

// Logo dorado con fondo transparente, recortado de la bolsa (oro sobre negro).
async function logo() {
  const { data, info } = await sharp(ref('WhatsApp Image 2026-10-02 at 9.32.56 AM.jpeg'))
    .extract({ left: 722, top: 432, width: 290, height: 352 })
    .resize({ width: 870, kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const px = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0, j = 0; i < data.length; i += info.channels, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // el oro tiene más rojo que azul; el papel negro, no
    const warm = r - b
    const lum = 0.3 * r + 0.59 * g + 0.11 * b
    let a = Math.min(1, Math.max(0, (lum - 70) / 70)) * Math.min(1, Math.max(0, (warm - 12) / 25))
    px[j] = 203; px[j + 1] = 166; px[j + 2] = 102
    px[j + 3] = Math.round(a * 255)
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toFile(out('logo-dorado.png'))
}

async function hero() {
  await sharp(ref('WhatsApp Image 2026-10-02 at 9.31.30 AM.jpeg'))
    .extract({ left: 0, top: 0, width: 800, height: 643 })
    .webp({ quality: 85 })
    .toFile(out('hero-modelo.webp'))
}

async function producto() {
  await sharp(ref('WhatsApp Image 2026-10-02 at 9.30.25 AM.jpeg'))
    .resize({ width: 1000 })
    .webp({ quality: 85 })
    .toFile(out('collar-corazon.webp'))
}

async function bolsa() {
  await sharp(ref('WhatsApp Image 2026-10-02 at 9.32.56 AM.jpeg'))
    .extract({ left: 300, top: 120, width: 1000, height: 900 })
    .webp({ quality: 82 })
    .toFile(out('bolsa-empaque.webp'))
}

// Solo el símbolo (mandala), para el encabezado compacto y el ícono del sitio.
async function simbolo() {
  const mark = await sharp(out('logo-dorado.png')).extract({ left: 0, top: 0, width: 781, height: 718 }).trim().png().toBuffer()
  await sharp(mark).toFile(out('logo-simbolo.png'))
  const small = await sharp(mark).resize({ width: 400, height: 400, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#0d0d0d' } })
    .composite([{ input: small, gravity: 'center' }])
    .png()
    .toFile(path.join('src', 'app', 'icon.png'))
}

await Promise.all([logo(), hero(), producto(), bolsa()])
await simbolo()
console.log('Imágenes listas en public/images')
