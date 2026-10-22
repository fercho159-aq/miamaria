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

// Fotos de producto en maniquí (iPhone, convertidas de HEIC a JPG) → 4:5, sin el aro de luz.
// Modelo con el collar y el ear cuff (1500x2000).
async function modelo() {
  await sharp(ref('modelo-mia-maria.jpg')).webp({ quality: 90 }).toFile(out('modelo-mia-maria.webp'))
}

async function collarCubano() {
  await sharp(ref('IMG_6884.jpg')).extract({ left: 760, top: 1300, width: 3400, height: 4250 }).resize({ width: 1400 }).webp({ quality: 88 }).toFile(out('collar-cubano.webp'))
}

async function earCuff() {
  await sharp(ref('IMG_5449.jpg')).extract({ left: 400, top: 420, width: 2320, height: 2900 }).resize({ width: 1100 }).webp({ quality: 88 }).toFile(out('ear-cuff.webp'))
}

async function producto() {
  await sharp(ref('WhatsApp Image 2026-10-02 at 9.30.25 AM.jpeg'))
    .resize({ width: 1000 })
    .webp({ quality: 85 })
    .toFile(out('collar-corazon.webp'))
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

// Fotos de producto horizontales (1600x1199) → recorte vertical 4:5 centrado en la pieza.
async function vertical(origen, destino, left) {
  await sharp(ref(origen)).extract({ left, top: 0, width: 959, height: 1199 }).webp({ quality: 85 }).toFile(out(destino))
}

// Fotos verticales 3:4 (1199x1600) → 4:5, recortando arriba y abajo.
async function cuatroQuintos(origen, destino, top) {
  await sharp(ref(origen)).extract({ left: 0, top, width: 1199, height: 1499 }).resize({ width: 1100 }).webp({ quality: 88 }).toFile(out(destino))
}

// Imagen para compartir en redes (1200x630): foto a la izquierda, logo sobre marfil.
async function og() {
  const foto = await sharp(out('modelo-mia-maria.webp')).resize({ width: 600, height: 630, fit: 'cover', position: 'top' }).toBuffer()
  const marca = await sharp(out('logo-dorado.png')).resize({ height: 330 }).toBuffer()
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#f7f5f1' } })
    .composite([
      { input: foto, left: 0, top: 0 },
      { input: marca, left: 600 + Math.round((600 - 263) / 2), top: 150 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out('og-miamaria.jpg'))
}

await Promise.all([
  logo(),
  cuatroQuintos('anillo-nudo.jpeg', 'anillo-nudo.webp', 70),
  cuatroQuintos('anillo-nudo-mano.jpeg', 'anillo-nudo-mano.webp', 60),
  modelo(),
  collarCubano(),
  earCuff(),
  producto(),
  vertical('aretes-nacar.jpeg', 'aretes-nacar.webp', 320),
  vertical('brazalete-turquesa.jpeg', 'brazalete-turquesa.webp', 350),
])
await simbolo()
await og()
console.log('Imágenes listas en public/images')
