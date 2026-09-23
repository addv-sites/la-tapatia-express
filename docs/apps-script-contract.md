# Contrato de datos — Google Sheets + Apps Script

Este documento es el contrato compartido que usan las 6 superficies del proyecto
(sitio público, admin catálogo, admin pedidos, portal cliente, analítica ADDV,
app repartidor) para hablar con la misma fuente de datos. El código real del
Apps Script Web App vive en `apps-script/Code.gs` (se pega tal cual en el editor
de script.google.com al desplegar — no corre en GitHub Pages).

## Principios

- Apps Script es la única capa de escritura. El frontend nunca escribe
  directo a Sheets.
- Toda request de escritura (y las de lectura restringida) llevan un
  `idToken` de Google Sign-In. Apps Script lo verifica criptográficamente
  (`https://oauth2.googleapis.com/tokeninfo` o librería equivalente) — nunca
  confía en un email que mande el cliente sin verificar.
- Autorización por rol, revalidada en **cada** request (nunca cacheada del lado cliente):
  - `STAFF` → hoja `STAFF` (admin catálogo + admin pedidos)
  - `DRIVERS` → hoja `DRIVERS` (app repartidor)
  - `ADDV` → dominio del email termina en `@addv.mx` (panel analítica)
  - Cliente → cualquier email verificado, sin whitelist (portal cliente, CRM)
- Concurrencia: toda escritura que genera folio o modifica una fila existente
  usa `LockService.getScriptLock()` (timeout corto + 1 reintento).
- Zona horaria del proyecto Apps Script: `America/Mexico_City`.
- Rate limit: máx. 5 escrituras de pedido/minuto por sesión (`CacheService`);
  se rechaza cualquier submit a <1.5s de cargada la página (patrón bot).

## Endpoints (Web App: `doGet` / `doPost`)

Todas las requests son `POST` con JSON `{ action, idToken, payload }`, excepto
lecturas públicas del catálogo que pueden ir por `GET ?action=...` sin token.

| action | Método | Auth | Descripción |
|---|---|---|---|
| `catalog.read` | GET | ninguna | Catálogo activo, usado por el build-time snapshot (GitHub Action) |
| `config.read` | GET | ninguna | Config pública (tarifas de envío por zona, `delivery_enabled`, mensajes) |
| `config.update` | POST | STAFF | Actualiza cualquier campo de la fila única de CONFIG (tarifas por zona, comisión repartidor, etc.) |
| `order.create` | POST | ninguna (cliente puede ser invitado) | Crea fila `pendiente` en `PEDIDOS`, regresa folio |
| `order.updateStatus` | POST | STAFF o DRIVERS | Avanza status del pedido |
| `driver.myOrders` | POST | DRIVERS (filtra por su propio email como `driver_id`) | Pedidos activos asignados a este repartidor (`listo`/`en_reparto`) |
| `driver.myDeliveries` | POST | DRIVERS | Entregas completadas por este repartidor (historial + base de ganancias) |
| `order.delete` | POST | STAFF | Borra un pedido `pendiente`/`abandonado` no concretado |
| `order.assignDriver` | POST | STAFF | Asigna `driver_id` a un pedido listo para despacho |
| `driver.list` | POST | STAFF | Lista repartidores activos (`email`, `name`) de la hoja `DRIVERS`, para el selector de asignación en el Kanban |
| `order.trackingRead` | GET | ninguna (folio + teléfono como clave de acceso) | Estado + última posición GPS para el portal cliente |
| `order.listMine` | POST | Cliente (filtra por su propio email verificado) | Historial de pedidos del portal cliente |
| `client.getProfile` | POST | Cliente (su propio email) | Trae perfil guardado (dirección, teléfono) para precargar checkout/perfil |
| `driver.pingLocation` | POST | DRIVERS | Actualiza lat/lng/timestamp del repartidor en ruta |
| `catalog.readAll` | POST | STAFF | Catálogo completo (incluye inactivos) para el admin |
| `catalog.updatePrice` / `catalog.approvePrice` / `catalog.toggleAvailability` | POST | STAFF | Admin catálogo |
| `catalog.seed` | POST | STAFF | Carga productos (`payload.products`, mismo shape que `data/catalog.json`) a la hoja `CATALOGO`, ignora los `product_id` que ya existen — no duplica |
| `catalog.uploadPhoto` | POST | STAFF | Sube una foto (`payload.base64Data`, máx 3MB decodificado, jpeg/png/webp) a una carpeta de Drive ("La Tapatía Ahogadas - Fotos Catálogo"), la hace pública por link, y actualiza la columna `image` de `CATALOGO` |
| `order.list` | POST | STAFF | Lista pedidos (opcionalmente filtrada por `status`) para el gestor/KDS — se llama por polling cada 10-15s |
| `catalog.uploadPhoto` | POST | STAFF | Sube imagen (base64) a carpeta de Drive, regresa URL, actualiza `image` |
| `client.upsertProfile` | POST | Cliente (su propio email) | Crea/actualiza `CLIENTES`, guarda dirección/teléfono |
| `client.optInMarketing` | POST | Cliente | Guarda consentimiento explícito (LFPDPPP) |
| `incident.report` | POST | DRIVERS | Escribe en hoja `INCIDENCIAS` |
| `analytics.read` | POST | ADDV (`@addv.mx`) | Agregados geoespaciales/CRM ya calculados server-side (KPIs, por zona, top clientes, demanda por hora, puntos de mapa) — nunca manda el histórico crudo completo al cliente |
| `campaign.sendEmail` | POST | STAFF o ADDV | Envío vía `MailApp`/`GmailApp` (cuota gratuita de la cuenta) |

## Hojas de Google Sheets

### `CATALOGO`
`product_id, category_id, category, name, short_description, description, price, image, active, featured, sort_order, tags, options, extras, branch_id, requiresValidation`

### `PEDIDOS`
`order_id (folio #TA-0001), created_at, customer_name, customer_phone, customer_email (opcional), items (JSON con snapshot de precio), subtotal, delivery_fee, total, notes, order_type (pickup|delivery|mostrador), delivery_address, delivery_zone (Z1|Z2|Z3), delivery_lat, delivery_lng (geocodificados una sola vez al crear el pedido, usados por el mapa de calor de analítica), cash_denomination (opcional), branch_id, status, driver_id (opcional), driver_lat, driver_lng, driver_ping_at, source, whatsapp_sent, internal_notes`

Enum `status`: `pendiente → confirmado → en_cocina → listo → en_reparto → entregado`, ramas `cancelado` / `abandonado`.

### `SUCURSALES`
`branch_id, name, address, phone, whatsapp, google_maps_url, active, latitude, longitude, schedule`

### `CONFIG`
`delivery_enabled, delivery_zone_1_km_max, delivery_zone_1_cost, delivery_zone_2_km_max, delivery_zone_2_cost, delivery_zone_3_km_max, delivery_zone_3_cost, driver_fixed_commission, promotions, messages, schedules, contact, social, seo, whatsapp, default_branch`

### `STAFF` / `DRIVERS`
`email, name, role, active, branch_id (opcional para STAFF v1, sin scoping todavía)`

### `CLIENTES`
`email, name, phone, address, address_reference, marketing_opt_in, created_at, updated_at`

### `LOG` (auditoría)
`timestamp, actor_email, action, entity, entity_id, before, after`

### `INCIDENCIAS`
`timestamp, order_id, driver_email, reason, resolved`

## Geocodificación

Nominatim (OpenStreetMap) desde Apps Script (server-side, respeta 1 req/seg,
User-Agent identificado, resultados cacheados en `CacheService`/hoja auxiliar
para no re-geocodificar la misma dirección dos veces). Nunca Google Geocoding
API (tiene costo).

## Backups

Trigger diario (`time-driven trigger`) copia el spreadsheet completo a una
carpeta de Drive, rotando las últimas 30 copias.
