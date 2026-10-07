-- Pago y envío del pedido (antes iban en la nota interna).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS forma_pago TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS paqueteria TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS guia_envio TEXT;

-- Historial del pedido: quién cambió qué. Guarda el nombre por si el administrador se elimina.
CREATE TABLE IF NOT EXISTS pedido_eventos (
  id           SERIAL PRIMARY KEY,
  pedido_id    INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  admin_id     UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_nombre TEXT NOT NULL,
  descripcion  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pedido_eventos_pedido_idx ON pedido_eventos (pedido_id, created_at);

-- Consultas por WhatsApp desde la tienda (productos "precio a consultar" y "preguntar").
CREATE TABLE IF NOT EXISTS consultas (
  id          SERIAL PRIMARY KEY,
  producto_id INT REFERENCES productos(id) ON DELETE SET NULL,
  sku         TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS consultas_fecha_idx ON consultas (created_at DESC);
