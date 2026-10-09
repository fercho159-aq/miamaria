# Mía María · miamaria.com.mx

Catálogo interactivo con carrito. Al finalizar, el cliente envía su pedido por WhatsApp
y la tienda recibe un aviso por correo. Panel privado para productos, categorías,
pedidos (pre-órdenes) e inventario.

**Stack:** Next.js 16 · Neon Postgres · iron-session · Vercel Blob (fotos) · Resend (correo).

## Desarrollo

```bash
npm install
npm run dev:local          # http://localhost:3110 con base local de demostración (PGlite)
npm run dev:local -- --reset   # borra la base local y vuelve a sembrar los datos demo
```

Panel demo: `/admin` — `admin@miamaria.com.mx` / `MiaMaria2026` (solo base local, ver `db/seed/demo.sql`).

## Cómo funciona

- **Carrito:** se guarda en el navegador. Al finalizar se pide nombre, WhatsApp, correo
  (opcional), entrega y dirección. El servidor recalcula precios, existencias y envío,
  guarda la pre-orden (`MM-1001`, `MM-1002`…), avisa por correo y abre WhatsApp con el detalle.
- **Entregas** (`src/lib/config.ts`): recoger en tienda gratis · CDMX $199 · todo México $399 ·
  gratis en compras mayores a $2,000.
- **Inventario:** al marcar un pedido como *Pagado* (o Enviado/Entregado) se descuentan sus
  piezas una sola vez. Si se *Cancela* o regresa a *Pendiente*, las piezas vuelven al inventario.
- **Pedidos:** búsqueda por folio, nombre o teléfono. Cada pedido guarda forma de pago, paquetería
  y guía, un historial de quién cambió qué, y el botón de WhatsApp propone un mensaje según el estatus.
- **Consultas** (`/admin/consultas`): cada clic en "Consultar / Preguntar por WhatsApp" de un producto
  queda registrado, para ver qué piezas interesan más.
- **Accesos** (`/admin/accesos`): cambiar la contraseña propia, dar acceso a otra persona y
  desactivar accesos (un acceso desactivado pierde la sesión de inmediato).
- **SKU repetido:** varios productos pueden compartir SKU. El primero conserva la dirección
  `/producto/SKU`; los demás usan `/producto/SKU~id`. Carrito y pedidos identifican por id.
- **Subcategorías:** una categoría puede vivir dentro de otra, a cualquier profundidad. El menú
  muestra las principales; cada colección incluye los productos de sus subcategorías.
- **Importar Excel** (`/admin/importar`): columnas SKU, Nombre, Descripción, Categoría, Precio y,
  opcional, Existencia. Actualiza por SKU (si el SKU se repite, por SKU + nombre) y crea las categorías que falten;
  una subcategoría se escribe `Collares > Plata`. Hay plantilla descargable.

## Producción (Vercel)

1. Crear la base en Neon y el almacén de Blob en Vercel.
2. Variables de entorno (ver `.env.example`): `DATABASE_URL`, `SESSION_SECRET` (32+ caracteres,
   obligatoria), `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `PEDIDOS_EMAIL`,
   `EMAIL_FROM`, `BLOB_READ_WRITE_TOKEN`.
3. Con `DATABASE_URL` en `.env.local`:
   ```bash
   npm run db:migrar
   npm run admin:crear -- correo@miamaria.com.mx "contraseña-segura" "Nombre"
   ```
4. En Resend, verificar el dominio `miamaria.com.mx` para poder enviar desde `pedidos@…`.

## Archivos clave

| Ruta | Qué es |
| --- | --- |
| `src/lib/config.ts` | Dirección, WhatsApp, costos de envío, estatus |
| `src/actions/pedidos.ts` | Crear pre-orden y cambiar estatus (inventario) |
| `src/actions/importar.ts` | Importación del Excel |
| `db/migrations/` | Esquema de la base |
| `scripts/preparar-imagenes.mjs` | Genera logo, portada y fotos a partir de `../_referencias` |
