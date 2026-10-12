"""Miniaturas JPG (360 px) de las fotos de _fotos, para hojas de comparación rápidas."""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageOps
import pillow_heif

FOTOS = Path(__file__).resolve().parents[2] / '_fotos'
MINI = FOTOS / '_mini'


def una(p):
    pillow_heif.register_heif_opener()
    rel = p.relative_to(FOTOS)
    persona, tipo = rel.parts[-3], rel.parts[-2]
    destino = MINI / persona / tipo / (p.stem + '.jpg')
    if destino.exists():
        return
    destino.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(p) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        im.thumbnail((360, 360))
        im.save(destino, quality=82)


if __name__ == '__main__':
    fotos = [p for p in FOTOS.rglob('*') if p.suffix.lower() == '.heic' and '_mini' not in p.parts]
    with ProcessPoolExecutor() as ex:
        list(ex.map(una, fotos, chunksize=8))
    print('miniaturas:', sum(1 for _ in MINI.rglob('*.jpg')))
