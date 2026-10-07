-- Productos sin precio publicado: se muestran como "Precio a consultar" y se piden por WhatsApp.
ALTER TABLE productos ALTER COLUMN precio DROP NOT NULL;
