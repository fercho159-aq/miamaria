-- Código propio del modelo (el que se usó al subirlo, ej. MMA001.3). El SKU del modelo es la
-- clave SICAR de su subcategoría; este código sirve para distinguir modelos y empatar fotos.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_modelo TEXT;
