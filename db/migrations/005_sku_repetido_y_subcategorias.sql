-- El SKU ya no es único: varias piezas pueden compartir el mismo (cada producto se identifica por su id).
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_sku_key;
CREATE INDEX IF NOT EXISTS productos_sku_idx ON productos (sku);

-- Categorías dentro de categorías (padre → hija → …). El nombre solo debe ser único entre hermanas.
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE categorias DROP CONSTRAINT IF EXISTS categorias_nombre_key;
CREATE INDEX IF NOT EXISTS categorias_parent_idx ON categorias (parent_id);
