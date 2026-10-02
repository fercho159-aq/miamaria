-- Mía María · esquema inicial
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL DEFAULT 'Administrador',
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
  id         SERIAL PRIMARY KEY,
  nombre     TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  orden      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE productos (
  id           SERIAL PRIMARY KEY,
  sku          TEXT NOT NULL UNIQUE,
  nombre       TEXT NOT NULL,
  descripcion  TEXT NOT NULL DEFAULT '',
  categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
  precio       NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  stock        INT NOT NULL DEFAULT 0,
  imagen_url   TEXT,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  destacado    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX productos_categoria_idx ON productos (categoria_id);

-- Pre-órdenes: se crean al finalizar el carrito y se confirman por WhatsApp.
CREATE TABLE pedidos (
  id              SERIAL PRIMARY KEY,
  folio           TEXT NOT NULL UNIQUE,
  cliente_nombre  TEXT NOT NULL,
  cliente_tel     TEXT NOT NULL,
  cliente_email   TEXT,
  entrega         TEXT NOT NULL CHECK (entrega IN ('tienda', 'cdmx', 'nacional')),
  direccion       TEXT,
  notas           TEXT,
  subtotal        NUMERIC(10,2) NOT NULL,
  envio           NUMERIC(10,2) NOT NULL,
  total           NUMERIC(10,2) NOT NULL,
  estatus         TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estatus IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  -- TRUE cuando el pedido ya descontó inventario (al marcarse pagado).
  stock_descontado BOOLEAN NOT NULL DEFAULT FALSE,
  nota_interna    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX pedidos_estatus_idx ON pedidos (estatus, created_at DESC);

CREATE TABLE pedido_items (
  id          SERIAL PRIMARY KEY,
  pedido_id   INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE SET NULL,
  sku         TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  precio      NUMERIC(10,2) NOT NULL,
  cantidad    INT NOT NULL CHECK (cantidad > 0)
);
CREATE INDEX pedido_items_pedido_idx ON pedido_items (pedido_id);
