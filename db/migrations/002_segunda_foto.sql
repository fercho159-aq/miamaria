-- Foto secundaria del producto (ej. la pieza puesta). Se muestra al pasar el mouse
-- en el catálogo y como segunda vista en la página del producto.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen2_url TEXT;
