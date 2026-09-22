# Guía paso a paso — configurar Google Sheets + Apps Script

Esto es lo único que falta para que todo el sitio funcione de verdad (hoy corre con `data/catalog.json` estático y gates que dicen "backend aún no configurado"). Son ~20-30 min la primera vez.

Los nombres de hoja y de columna de aquí abajo salieron directo de `apps-script/Code.gs` (se extrajeron del código, no se redactaron a mano) — si algún día cambias un campo en el código, esta guía puede desalinearse; el código siempre manda.

## Paso 1 — Crear el Google Sheet

1. En la cuenta de Google que será dueña del proyecto (ver `project_state.md` — quedó definido que es la cuenta de ADDV), entra a [sheets.google.com](https://sheets.google.com) → **Hoja de cálculo en blanco**.
2. Nómbralo `La Tapatía Ahogadas — Base de Datos` (o el nombre que prefieras, no importa para el código).
3. Crea **9 pestañas** (clic derecho en la pestaña inferior → Insertar hoja), con estos nombres **exactos**, mayúsculas incluidas:

```
CATALOGO
PEDIDOS
SUCURSALES
CONFIG
STAFF
DRIVERS
CLIENTES
LOG
INCIDENCIAS
```

## Paso 2 — Encabezados de cada hoja

En la **fila 1** de cada pestaña, pega esta lista de columnas (una por celda, en este orden — usa "Pegado especial → Solo valores" si copias desde aquí para que no se pegue formato de markdown).

### `CATALOGO`
```
product_id	category_id	category	name	short_description	description	price	image	active	featured	sort_order	tags	options	extras	branch_id	requiresValidation
```
Después de crear los encabezados, **carga el menú real** copiando los productos de `data/catalog.json` (están ahí como ejemplo/placeholder, todos con `requiresValidation = TRUE` porque los precios de `buildClaude.md` no están confirmados por el negocio todavía). `active` y `requiresValidation` son casillas TRUE/FALSE.

### `PEDIDOS`
```
order_id	created_at	customer_name	customer_phone	customer_email	items	subtotal	delivery_fee	total	notes	order_type	delivery_address	delivery_zone	delivery_lat	delivery_lng	cash_denomination	branch_id	status	driver_id	driver_lat	driver_lng	driver_ping_at	source	whatsapp_sent	internal_notes
```
Se llena sola — el sitio escribe aquí en cada pedido. No captures nada a mano salvo que quieras crear un pedido de prueba.

### `SUCURSALES`
```
branch_id	name	address	phone	whatsapp	google_maps_url	active	latitude	longitude	schedule
```
Carga **una fila** con la sucursal Morelia:
- `branch_id`: `morelia-san-juanito` (debe coincidir exacto con `branchId` en `src/config/site.js`)
- `address`: `Av. San Juanito Itzicuaro 171, Arboledas de Valladolid, Morelia, Michoacán, México.`
- `latitude` / `longitude`: **necesarias para que funcione la tarifa de envío por zona** — el sistema calcula distancia desde aquí. Búscalas en Google Maps (clic derecho sobre el punto exacto → aparecen las coordenadas) y pégalas como número (ej. `19.7300`, no texto).
- `active`: `TRUE`

### `CONFIG`
```
delivery_enabled	delivery_zone_1_km_max	delivery_zone_1_cost	delivery_zone_2_km_max	delivery_zone_2_cost	delivery_zone_3_km_max	delivery_zone_3_cost	driver_fixed_commission
```
**Importante:** esta hoja necesita **una fila de datos ya creada** (fila 2) antes de usar el admin — si la dejas vacía, `config.update` truena con "Hoja CONFIG sin fila de datos". Llena una fila con valores iniciales (los puedes ajustar después desde `/admin/config-envio/`), por ejemplo:
```
TRUE	2.5	25	5	40	8.5	65	20
```
(Estos números son solo un punto de partida razonable — confírmalos con el negocio, igual que los precios del menú.)

### `STAFF`
```
email	name	active
```
Una fila por persona del restaurante con acceso al admin (catálogo + pedidos). `email` debe ser exactamente la cuenta de Google con la que esa persona va a iniciar sesión. `active` en `TRUE` para que tenga acceso — cámbialo a `FALSE` (no borres la fila) para revocarle acceso sin perder el historial.

### `DRIVERS`
```
email	name	active
```
Igual que STAFF pero para repartidores. El `email` de aquí es el mismo valor que se usa como `driver_id` al asignar un pedido desde el gestor — **deben coincidir exacto**.

### `CLIENTES`
```
email	name	phone	address	address_reference	marketing_opt_in	created_at	updated_at
```
Se llena sola cuando un cliente se registra con Google en el sitio o en el checkout. No captures nada a mano.

### `LOG`
```
timestamp	actor_email	action	entity	entity_id	before	after
```
Auditoría automática — se llena sola en cada escritura del admin.

### `INCIDENCIAS`
```
timestamp	order_id	driver_email	reason	resolved
```
Se llena sola cuando un repartidor reporta una incidencia.

## Paso 3 — Desplegar Apps Script

1. En el mismo Google Sheet: menú **Extensiones → Apps Script**.
2. Borra el contenido de `Code.gs` que abre por default y pega **todo** el contenido de [`apps-script/Code.gs`](../apps-script/Code.gs) de este repo.
3. Arriba del archivo, llena la constante:
   ```js
   const SPREADSHEET_ID = ''; // ← pega aquí el ID del Sheet
   ```
   El ID es la parte de la URL entre `/d/` y `/edit`: `https://docs.google.com/spreadsheets/d/`**`ESTE_PEDAZO`**`/edit`.
4. Guarda (ícono de disco o Ctrl+S).
5. **Desplegar → Nueva implementación** (ícono de engrane → "Aplicación web"):
   - Descripción: `v1`
   - Ejecutar como: **Yo** (tu cuenta)
   - Quién tiene acceso: **Cualquier usuario**
6. Autoriza los permisos que pida (acceso a Sheets, a URL externas para Nominatim/verificación de token — son los que el propio código necesita, revísalos antes de aceptar si quieres, están descritos en `docs/apps-script-contract.md`).
7. Copia la **URL de la aplicación web** que te da al terminar (termina en `/exec`).

## Paso 4 — Crear el OAuth Client ID de Google (para el botón "Iniciar sesión con Google")

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) con la misma cuenta.
2. Crea un proyecto (o usa uno existente de ADDV).
3. **APIs y servicios → Pantalla de consentimiento OAuth**: tipo "Externo", llena nombre de la app y correo de soporte. No hace falta publicarla fuera de modo "Prueba" mientras solo STAFF/DRIVERS/ADDV la usen (agrégalos como "usuarios de prueba" si Google lo pide en ese modo).
4. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**
   - Orígenes de JavaScript autorizados: agrega `http://localhost:8099` (para pruebas locales) y la URL real de GitHub Pages una vez que la tengas (`https://addv-sites.github.io`)
5. Copia el **Client ID** (termina en `.apps.googleusercontent.com`).

## Paso 5 — Conectar todo en el código

Edita `src/config/site.js`:

```js
appsScript: {
  webAppUrl: 'PEGA_AQUI_LA_URL_DEL_PASO_3.7'
},
googleClientId: 'PEGA_AQUI_EL_CLIENT_ID_DEL_PASO_4.5',
```

Guarda, haz commit y push (o solo prueba local primero — no hace falta desplegar a GitHub Pages para probar en `localhost`).

## Paso 6 — Verificación funcional (checklist)

Con `npm run serve` corriendo local, en este orden:

- [ ] **Sitio público** (`/`, `/menu/`): el catálogo carga desde `data/catalog.json` (snapshot) — para probar que también lee de Sheets en vivo, corre `node scripts/build-snapshot.mjs` y confirma que trae los productos reales que cargaste en el Paso 2.
- [ ] **Checkout de invitado**: agrega un producto, llena el formulario, envía — debe aparecer una fila nueva en `PEDIDOS` con folio `#TA-0001` antes de abrir WhatsApp.
- [ ] **Checkout con entrega a domicilio**: repite con "A domicilio" y una dirección real de Morelia — `delivery_zone`, `delivery_fee`, `delivery_lat`, `delivery_lng` deben llenarse solos en la fila de `PEDIDOS` (usa una dirección real, la geocodificación tarda ~1s por la política de Nominatim).
- [ ] **Registro de cliente**: en el checkout, usa la invitación "Continuar con Google" — debe aparecer una fila nueva en `CLIENTES`.
- [ ] **`/admin/catalogo/`**: inicia sesión con un email que SÍ esté en `STAFF` con `active=TRUE` — debe entrar. Prueba con un email que NO esté en la hoja — debe mostrar "No autorizado".
- [ ] **Editar precio**: cambia un precio en el admin, confirma que se actualiza en `CATALOGO` y aparece una fila nueva en `LOG`.
- [ ] **`/admin/pedidos/`**: el pedido de la prueba de checkout debe aparecer en la columna "Por Confirmar". Dale "Aceptar" → pasa a "En Cocina" en `PEDIDOS.status`.
- [ ] **`/admin/config-envio/`**: cambia una tarifa, guarda, recarga la página — debe persistir (confirma que la fila 2 de `CONFIG` cambió).
- [ ] **`/cuenta/rastreo/`**: busca el pedido de prueba con su folio + el teléfono que usaste — debe mostrar el estado correcto.
- [ ] **`/cuenta/perfil/`** y **`/cuenta/historial/`**: inicia sesión con la misma cuenta del checkout — debe ver el perfil guardado y el pedido en el historial.
- [ ] **`/reparto/app/`**: agrega tu email a `DRIVERS`, asigna manualmente un `driver_id` (= tu email) a un pedido en estado `listo` directo en la hoja `PEDIDOS` (no hay UI de asignación en el admin todavía, ver pendientes en `project_state.md`) — debe aparecer como tu ruta activa.
- [ ] **`/analitica/panel/`**: inicia sesión con un correo `@addv.mx` — debe entrar y mostrar los KPIs con datos reales de las pruebas anteriores. Con un correo de otro dominio, debe rechazar.

Si algo de esto falla, revisa primero la consola del navegador (F12) y los "Registros de ejecución" del editor de Apps Script — ahí aparece el error real del lado del servidor.
