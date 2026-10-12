"""Hojas de contacto con etiqueta para comparar fotos a ojo.
  python web/scripts/hojas_fotos.py productos 45 46 47 ...   (fotos publicadas por id)
  python web/scripts/hojas_fotos.py carpeta "<persona>/<tipo>" (miniaturas de una carpeta de Drive)
"""
import json, os, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

FOTOS = Path(__file__).resolve().parents[2] / '_fotos'
SALIDA = FOTOS / '_hojas'
SALIDA.mkdir(exist_ok=True)
try:
    FUENTE = ImageFont.truetype('arialbd.ttf', 15)
except OSError:
    FUENTE = ImageFont.load_default()


def hoja(items, nombre, cols, lado):
    filas = (len(items) + cols - 1) // cols
    h = lado + 22
    out = Image.new('RGB', (cols * lado, filas * h), 'white')
    d = ImageDraw.Draw(out)
    for i, (ruta, etiqueta) in enumerate(items):
        x, y = (i % cols) * lado, (i // cols) * h
        with Image.open(ruta) as im:
            out.paste(ImageOps.fit(ImageOps.exif_transpose(im).convert('RGB'), (lado - 4, lado - 4)), (x + 2, y + 2))
        d.rectangle([x, y + lado, x + lado, y + h], fill='black')
        d.text((x + 4, y + lado + 2), etiqueta, fill='white', font=FUENTE)
    destino = SALIDA / f'{nombre}.jpg'
    out.save(destino, quality=82)
    print(destino)


if sys.argv[1] == 'productos':
    prods = {str(p['id']): p for p in json.loads((FOTOS / '_productos.json').read_text(encoding='utf8'))}
    ids = sys.argv[2:]
    hoja([(FOTOS / '_cache' / f'{i}.img', f"{i} {prods[i]['nombre'][:22]}") for i in ids], os.environ.get('NOMBRE', 'productos-' + ids[0]), int(os.environ.get('COLS', 7)), int(os.environ.get('LADO', 230)))
else:
    carpeta = sys.argv[2]
    fotos = sorted((FOTOS / '_mini').glob(carpeta + '/*.jpg'))
    nombre = carpeta.replace('/', '__').replace(' ', '_')[:60]
    hoja([(p, p.stem.replace('IMG_', '')) for p in fotos], 'carpeta-' + nombre, 10, 170)
