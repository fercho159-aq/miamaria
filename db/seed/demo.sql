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
  ('MM-ARE-001', 'Aretes Nácar Triple', 'Aretes largos de tres piezas en nácar con hoja de oro, bisel en baño de oro.', 2, 1350, 8, '/images/aretes-nacar.webp', TRUE),
  ('MM-ARE-002', 'Aretes Gota Zirconia', 'Aretes de gota con zirconia central.', 2, 690, 0, NULL, FALSE),
  ('MM-PUL-001', 'Pulsera Tenis', 'Pulsera tipo tenis con zirconias, broche de seguridad.', 3, 1290, 5, NULL, TRUE),
  ('MM-PUL-002', 'Brazalete Sol Turquesa', 'Brazalete abierto con medallón de sol y turquesa al centro, en baño de oro.', 3, 1190, 7, '/images/brazalete-turquesa.webp', TRUE),
  ('MM-ANI-001', 'Anillo Nudo Pavé', 'Anillo escultórico en baño de oro: un lazo pulido entrelazado con otro cubierto de pavé de zirconias.', 4, 2450, 4, '/images/anillo-nudo.webp', TRUE),
  ('MM-ANI-002', 'Anillo Sello Mía', 'Anillo tipo sello con grabado del símbolo Mía María.', 4, 650, 12, NULL, FALSE);

-- Segunda foto: la pieza puesta
UPDATE productos SET imagen2_url = '/images/anillo-nudo-mano.webp' WHERE sku = 'MM-ANI-001';

INSERT INTO pedidos (folio, cliente_nombre, cliente_tel, cliente_email, entrega, direccion, subtotal, envio, total, estatus)
VALUES ('MM-1001', 'Cliente de prueba', '5512345678', 'cliente@example.com', 'cdmx', 'Calle Ejemplo 123, Polanco, CDMX', 1890, 199, 2089, 'pendiente');
INSERT INTO pedido_items (pedido_id, producto_id, sku, nombre, precio, cantidad)
VALUES (1, 1, 'MM-COL-001', 'Collar Corazón Pavé', 1890, 1);
