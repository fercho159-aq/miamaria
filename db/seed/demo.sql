-- Datos de DEMOSTRACIÓN (solo base local). El inventario real se carga desde el Excel
-- de Mía María en el panel: Productos → Importar Excel.
-- Acceso demo al panel: admin@miamaria.com.mx / MiaMaria2026
INSERT INTO admins (email, password_hash, nombre) VALUES
  ('admin@miamaria.com.mx', '$2b$10$uTUpluvAydAyuuuT0AeXsO5P6U45JD10yUUaG75ccu.uqspF7Y0y2', 'Mía María');

INSERT INTO categorias (nombre, slug, orden) VALUES
  ('Collares', 'collares', 1),
  ('Aretes', 'aretes', 2),
  ('Pulseras', 'pulseras', 3),
  ('Anillos', 'anillos', 4);

INSERT INTO productos (sku, nombre, descripcion, categoria_id, precio, stock, imagen_url, destacado) VALUES
  ('MM-COL-001', 'Collar Corazón Pavé', 'Dije de corazón con pavé de zirconias en baño de oro, cadena tipo serpiente de 45 cm.', 1, 1890, 6, '/images/collar-corazon.webp', TRUE),
  ('MM-COL-002', 'Collar Eslabón Clásico', 'Cadena de eslabón grueso en baño de oro de 18k. Ideal para combinar en capas.', 1, 1450, 4, NULL, TRUE),
  ('MM-COL-003', 'Gargantilla Mandala', 'Gargantilla con dije inspirado en el mandala de la casa.', 1, 980, 10, NULL, FALSE),
  ('MM-ARE-001', 'Arracadas Lisas Grandes', 'Arracadas de 5 cm en baño de oro, ligeras y cómodas.', 2, 760, 8, NULL, TRUE),
  ('MM-ARE-002', 'Aretes Gota Zirconia', 'Aretes de gota con zirconia central.', 2, 690, 0, NULL, FALSE),
  ('MM-PUL-001', 'Pulsera Tenis', 'Pulsera tipo tenis con zirconias, broche de seguridad.', 3, 1290, 5, NULL, TRUE),
  ('MM-PUL-002', 'Esclava Martillada', 'Esclava rígida con acabado martillado artesanal.', 3, 840, 7, NULL, FALSE),
  ('MM-ANI-001', 'Anillo Sello Mía', 'Anillo tipo sello con grabado del símbolo Mía María.', 4, 650, 12, NULL, FALSE);

INSERT INTO pedidos (folio, cliente_nombre, cliente_tel, cliente_email, entrega, direccion, subtotal, envio, total, estatus)
VALUES ('MM-1001', 'Cliente de prueba', '5512345678', 'cliente@example.com', 'cdmx', 'Calle Ejemplo 123, Polanco, CDMX', 1890, 199, 2089, 'pendiente');
INSERT INTO pedido_items (pedido_id, producto_id, sku, nombre, precio, cantidad)
VALUES (1, 1, 'MM-COL-001', 'Collar Corazón Pavé', 1890, 1);
