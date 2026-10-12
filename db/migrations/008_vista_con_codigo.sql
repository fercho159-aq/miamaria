-- La vista de catálogo incluye el código propio del modelo.
DROP VIEW IF EXISTS productos_catalogo;
CREATE VIEW productos_catalogo AS
SELECT p.id, p.sku, p.nombre, p.descripcion, p.categoria_id, p.precio,
       CASE WHEN g.id IS NOT NULL THEN g.existencia ELSE p.stock END AS stock,
       p.stock AS stock_propio,
       g.id AS grupo_id,
       g.nombre AS grupo,
       p.imagen_url, p.imagen2_url, p.activo, p.destacado, p.generico, p.created_at, p.updated_at,
       p.codigo_modelo,
       (p.activo AND NOT (p.generico AND EXISTS (
          SELECT 1 FROM productos o
          WHERE o.categoria_id = p.categoria_id AND o.activo AND NOT o.generico AND o.id <> p.id
       ))) AS en_tienda
FROM productos p
LEFT JOIN categorias g ON g.id = p.categoria_id AND g.existencia IS NOT NULL;
