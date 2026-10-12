"""
Empata las fotos de Drive (_fotos/<persona>/<tipo de pieza>/IMG_xxxx.HEIC) con las fotos
publicadas de cada producto, para saber de qué carpeta (subcategoría) salió cada producto.

  python web/scripts/empatar_fotos.py              (desde la carpeta miamaria)

Compara "huellas" de imagen (hash perceptual de diferencias) a varios tamaños de recorte, porque
la foto publicada pudo reducirse o recortarse al subirla. Escribe _fotos/_empates.csv y una hoja
de contacto por producto dudoso en _fotos/_revision/.
"""
import csv, io, json, os, subprocess, sys, urllib.request
from pathlib import Path
from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()
RAIZ = Path(__file__).resolve().parents[2]
FOTOS = RAIZ / '_fotos'
CACHE = FOTOS / '_cache'
CACHE.mkdir(parents=True, exist_ok=True)


def dhash(img, n=16):
    g = ImageOps.grayscale(img).resize((n + 1, n), Image.LANCZOS)
    px = list(g.getdata())
    bits = 0
    for y in range(n):
        for x in range(n):
            bits = (bits << 1) | (px[y * (n + 1) + x] > px[y * (n + 1) + x + 1])
    return bits


def huellas(img):
    """Huella de la imagen completa y de recortes centrales (por si se recortó al subir)."""
    img = ImageOps.exif_transpose(img).convert('RGB')
    img.thumbnail((800, 800))
    w, h = img.size
    out = []
    for f in (1.0, 0.9, 0.8):
        cw, ch = int(w * f), int(h * f)
        out.append(dhash(img.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2))))
    return out


def dist(a, b):
    return bin(a ^ b).count('1')


# 1) Fotos de Drive
drive = []
for p in sorted(FOTOS.rglob('*')):
    if p.suffix.lower() not in ('.heic', '.jpg', '.jpeg', '.png', '.webp') or '_cache' in p.parts or '_revision' in p.parts:
        continue
    rel = p.relative_to(FOTOS).parts
    tipo = rel[-2] if len(rel) >= 2 else ''
    persona = rel[-3] if len(rel) >= 3 else ''
    try:
        with Image.open(p) as im:
            drive.append({'ruta': str(p), 'tipo': tipo, 'persona': persona, 'h': huellas(im)})
    except Exception as e:
        print('No se pudo abrir', p, e)
print('Fotos de Drive:', len(drive))

# 2) Productos publicados (lista exportada por empatar-fotos.mjs)
productos = json.loads((FOTOS / '_productos.json').read_text(encoding='utf8'))
for pr in productos:
    destino = CACHE / f"{pr['id']}.img"
    if not destino.exists():
        urllib.request.urlretrieve(pr['imagen'], destino)
    with Image.open(destino) as im:
        pr['h'] = huellas(im)

# 3) Mejor coincidencia por producto (distancia mínima entre cualquier par de recortes)
filas = []
for pr in productos:
    mejores = sorted(
        ((min(dist(a, b) for a in pr['h'] for b in d['h']), d) for d in drive), key=lambda t: t[0]
    )[:3]
    (d0, m0) = mejores[0] if mejores else (999, None)
    segura = m0 is not None and d0 <= 40 and (len(mejores) < 2 or mejores[1][0] - d0 >= 8 or mejores[1][1]['tipo'] == m0['tipo'])
    filas.append({
        'id': pr['id'], 'nombre': pr['nombre'], 'subcategoria_actual': pr['grupo'] or '(sin subcategoría)',
        'carpeta_drive': m0['tipo'] if m0 else '', 'persona': m0['persona'] if m0 else '',
        'foto': Path(m0['ruta']).name if m0 else '', 'distancia': d0, 'segura': 'sí' if segura else 'revisar',
        'segunda': f"{mejores[1][1]['tipo']} ({mejores[1][0]})" if len(mejores) > 1 else '',
    })
    if not segura and m0 is not None:
        rev = FOTOS / '_revision'
        rev.mkdir(exist_ok=True)
        hoja = Image.new('RGB', (4 * 300, 360), 'white')
        with Image.open(CACHE / f"{pr['id']}.img") as im:
            hoja.paste(ImageOps.fit(ImageOps.exif_transpose(im).convert('RGB'), (300, 360)), (0, 0))
        for i, (_, d) in enumerate(mejores):
            with Image.open(d['ruta']) as im:
                hoja.paste(ImageOps.fit(ImageOps.exif_transpose(im).convert('RGB'), (300, 360)), ((i + 1) * 300, 0))
        hoja.save(rev / f"{pr['id']}.jpg", quality=80)

with open(FOTOS / '_empates.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.DictWriter(f, fieldnames=list(filas[0].keys()))
    w.writeheader()
    w.writerows(filas)
print('Seguras:', sum(f['segura'] == 'sí' for f in filas), '· a revisar:', sum(f['segura'] != 'sí' for f in filas))
