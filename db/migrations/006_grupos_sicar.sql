-- Grupos de SICAR: cada clave del reporte de existencias (MMA003 "Anillo chico") es una
-- subcategoría con su existencia total. Los modelos de esa subcategoría comparten la clave
-- como SKU y descuentan de esa misma existencia.
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS existencia INT;
CREATE UNIQUE INDEX IF NOT EXISTS categorias_sku_key ON categorias (upper(sku)) WHERE sku IS NOT NULL;

-- Tarjeta provisional de una subcategoría mientras no tenga modelos reales con foto.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS generico BOOLEAN NOT NULL DEFAULT FALSE;

-- Productos con su existencia efectiva:
--  - stock: la del grupo SICAR si su categoría tiene clave; si no, la propia del producto.
--  - en_tienda: activo, y si es genérico solo mientras su subcategoría no tenga modelos reales.
-- Si se agregan columnas a productos, hay que volver a crear esta vista.
DROP VIEW IF EXISTS productos_catalogo;
CREATE VIEW productos_catalogo AS
SELECT p.id, p.sku, p.nombre, p.descripcion, p.categoria_id, p.precio,
       CASE WHEN g.id IS NOT NULL THEN g.existencia ELSE p.stock END AS stock,
       p.stock AS stock_propio,
       g.id AS grupo_id,
       g.nombre AS grupo,
       p.imagen_url, p.imagen2_url, p.activo, p.destacado, p.generico, p.created_at, p.updated_at,
       (p.activo AND NOT (p.generico AND EXISTS (
          SELECT 1 FROM productos o
          WHERE o.categoria_id = p.categoria_id AND o.activo AND NOT o.generico AND o.id <> p.id
       ))) AS en_tienda
FROM productos p
LEFT JOIN categorias g ON g.id = p.categoria_id AND g.existencia IS NOT NULL;
