# Estado del Proyecto — La Tapatía Ahogadas

Última actualización: 2026-09-21

## Qué existe hoy

- **Diseños completos** (exportes Stitch/AI, `code.html` + `screen.png` + `DESIGN.md` compartido) en 6 carpetas:
  - `design/` — sitio público (Home/Antojo)
  - `admin/administrador_de_precios_y_catalogo_la_tapatia_ahogadas/` — gestor de catálogo/precios/fotos
  - `admin/gestion_de_pedidos_comandas_en_vivo_la_tapatia_ahogadas/` — KDS de pedidos en tiempo real
  - `pc/` — portal cliente (pantalla "Rastreo En Vivo")
  - `analitica/` — panel BI geoespacial/CRM para ADDV
  - `reparto/` — app repartidor
- **Docs de especificación de negocio:** `buildClaude.md`, `stitch.md`, `seo.md`, `images_prompt.md` (raíz).
- **Ruflo inicializado** (orquestación multi-agente, `.claude-flow/`, `.mcp.json`, agentes/skills en `.claude/`).
- **agent-skills instalado** (25 skills en `.agents/skills/`).
- **Ningún código de producción escrito todavía** — cero HTML/CSS/JS/Apps Script fuera de los mockups de diseño.

## Pantallas de mockup que NO cubren todo el flujo (se extrapolan de `DESIGN.md`)

- Sitio público: solo Home tiene comp visual. Menú completo, Ubicación y Contacto dedicados se extrapolan del sistema de componentes ya documentado (`stitch.md`).
- Portal cliente: solo "Mi Pedido" (rastreo) tiene comp. Menú, Historial, Perfil se extrapolan.
- App repartidor: solo "Ruta Activa" tiene comp. Mis Entregas, Ganancias, Perfil se extrapolan.

## Decisiones tomadas (2026-09-21)

1. Stack: GitHub Pages + Google Sheets + Google Apps Script. Sin backend tradicional, sin Docker/VPS/DB propia.
2. Sin dominio propio — `usuario.github.io/repo`.
3. Autenticación: Google Sign-In en 4 niveles — STAFF (whitelist), cliente (abierto), ADDV (dominio `@addv.mx`), DRIVERS (whitelist). Verificación siempre server-side vía Apps Script (token, nunca email declarado por el cliente).
4. Flujo de pedido: el sitio escribe el pedido como `pendiente` en Sheets (folio simple `#TA-0001`) **antes** de abrir WhatsApp; folio va como primera línea del mensaje. Si no se concreta, se borra desde el gestor (borrado real, no soft-cancel, por instrucción explícita).
5. Envío a domicilio: sí existe. Tarifa **variable por zona/distancia** (Z1/Z2/Z3), editable desde el admin — no costo fijo único (se corrigió una contradicción inicial).
6. App repartidor: se construye ahora, mismo patrón de arquitectura (Google Sign-In + hoja DRIVERS + Apps Script recibe GPS del navegador). Comisión: **monto fijo por entrega**, configurable desde admin.
7. Mapas/geolocalización: OpenStreetMap + Leaflet + Nominatim — gratis, sin llave. Nunca Google Maps Platform (tiene costo). Se elimina cualquier promesa de "tráfico en vivo" real que no se pueda respaldar con datos verdaderos.
8. Multi-sucursal: `branch_id` en el esquema desde v1, pero lógica de una sola sucursal (Morelia) — no hay segunda sucursal confirmada todavía.
9. Dueño de la cuenta Google/Apps Script del proyecto: **ADDV** (Workspace ya existente — costo preexistente, no nuevo por este proyecto).
10. CRM: registro con Google Sign-In (cliente), invitación no-bloqueante a registrarse (nunca bloquea pedido de invitado), precarga de dirección guardada para clientes registrados, opt-in explícito + aviso de privacidad real (LFPDPPP) para campañas de marketing.
11. Campañas: correo vía `MailApp`/`GmailApp` de Apps Script (cuota gratuita aceptada para este volumen); WhatsApp masivo saliente **no** es viable sin backend/API de pago — descartado.
12. SEO: rutas reales por sección (no anclas `#`), catálogo servido por snapshot en build-time (GitHub Action) + revalidación silenciosa en cliente (para no romper LCP/PageSpeed).
13. PWA: instalable, botón dual (prompt real Android/desktop, modal instructivo iOS), sin push notifications (fuera de alcance v1, requeriría servidor).
14. Regla de costo: **cero costo incremental de herramientas** en esta fase (POC). Revisar antes de sugerir cualquier servicio de pago; queda para una eventual "versión robusta" futura.
15. Nomenclatura "bot de WhatsApp" de los mockups originales es incorrecta — se corrige en toda la UI: no hay bot conversacional, es captura desde el sitio + envío manual del cliente.

## Decisiones pendientes / por confirmar con el negocio

- Precios reales del menú (marcados `requiresValidation` hasta confirmación).
- Horarios, montos exactos de tarifas de envío por zona (Z1/Z2/Z3 son placeholders del mock, no confirmados).
- Redacción final del aviso de privacidad (LFPDPPP) — placeholder hasta validación legal.
- Segunda sucursal: ¿roadmap futuro confirmado o solo posibilidad?
- Assets de marca reales (logo, tipografía oficial) si difieren del sistema provisional ya definido en `DESIGN.md`.

## Progreso de construcción

- [x] **Segmento 1 — Scaffolding** (2026-09-21): estructura de carpetas, `package.json`+Tailwind compilado (reemplaza el CDN de los mocks), `tailwind.config.js` con los tokens de `DESIGN.md`, `src/config/site.js` central, `docs/apps-script-contract.md` (contrato completo de endpoints/hojas), `apps-script/Code.gs` (implementación real: auth por token verificado, LockService, folios, geocodificación Nominatim, tarifas por zona), `src/js/api.js` + `src/js/auth.js` compartidos, PWA (`manifest.webmanifest`, `sw.js`, `offline.html`, íconos provisionales generados con Pillow — pendiente logo real), `robots.txt`/`sitemap.xml`, GitHub Action de build+deploy (`.github/workflows/deploy.yml`, snapshot best-effort vía `scripts/build-snapshot.mjs`), `data/catalog.json` con el menú de `buildClaude.md` (todo `requiresValidation: true`), `README.md`.
- [x] **Segmento 2 — Sitio público** (2026-09-21): `index.html` (Home), `menu/` (catálogo completo + carrito + checkout → WhatsApp con folio), `ubicacion/`, `contacto/`. Fuentes self-hosted (`assets/fonts/`, cero requests a Google Fonts), íconos SVG inline (`assets/icons/sprite.svg`, reemplaza Material Symbols), sin Tailwind CDN. Probado en navegador real (Chrome vía claude-in-chrome): las 4 páginas cargan sin errores de consola, catálogo se pinta desde `data/catalog.json`, carrito agrega/quita/calcula, toggle Para llevar/A domicilio muestra campo de dirección correctamente, botón "Instalar" aparece (Chrome sí soporta `beforeinstallprompt`). Servido localmente con `python -m http.server` en el puerto 8099 (8080 estaba ocupado por otro proyecto local).
  - **Bug encontrado y corregido durante la prueba:** varios elementos (modal de instrucciones iOS, selector de modalidad, campo de dirección) usaban el atributo nativo `hidden` junto con una clase de Tailwind que fija `display` (`flex`/`grid`) en el mismo elemento — el atributo nativo pierde contra la clase de autor sin importar el orden, así que se mostraban aunque debían estar ocultos. Se corrigió usando la clase `hidden` de Tailwind (no el atributo) alternada por JS en todos los casos afectados (`index.html`, `menu/index.html`, `src/js/pwa-install.js`, `src/js/menu-page.js`).
  - Pendiente de este segmento (no bloqueante): fotografía real de producto (hoy son placeholders SVG intencionales, nunca imágenes de comida falsas), portal cliente/admin aún no llaman a este flujo (eso es CLIENTES/Google Sign-In, parte de segmentos 3-4).
- [x] **Segmento 3 — Admin catálogo/precios + pedidos/KDS** (2026-09-21): `admin/catalogo/` (edición de precio en vivo, validar, disponibilidad), `admin/pedidos/` (Kanban Por Confirmar/En Cocina/Listo, polling 15s, aceptar/marcar listo/finalizar/eliminar), `admin/config-envio/` (pantalla nueva no incluida en el mock original, tarifas Z1/Z2/Z3 + comisión repartidor — avisado como desviación al agregarla). Gate de acceso compartido (`src/js/admin-auth.js`) con Google Identity Services + whitelist STAFF validada server-side. Acciones nuevas agregadas al contrato/backend que no estaban originalmente: `catalog.readAll`, `order.list`, `config.update`.
  - **Bug real encontrado y corregido en esta prueba:** el Service Worker (`sw.js`) usaba cache-first para CSS/JS del shell — en un sitio que se reconstruye seguido, dejaba a los visitantes atorados en una versión vieja del sitio indefinidamente (no solo un problema de dev). Se cambió a network-first con fallback a cache solo si no hay red; se subió `CACHE_NAME` a `v2` para invalidar el cache viejo de quien ya lo tenga instalado.
  - Verificado en navegador real: las 3 pantallas cargan sin errores de consola y muestran correctamente el estado "backend aún no configurado" (esperado, ya que Apps Script/Google Client ID siguen sin desplegarse). No se pudo probar el flujo autenticado real (login, guardar precio, mover pedido) por faltar esas credenciales — queda pendiente para cuando se despliegue Apps Script.
  - Pendiente de este segmento (no bloqueante, ya lo sabía el usuario): subida de fotografías HD, historial de auditoría visual (los datos ya se escriben en la hoja LOG, solo falta UI para leerlos), asignación de repartidor desde el Kanban.
- [x] **Segmento 4 — Portal cliente** (2026-09-22): `cuenta/rastreo/` (folio+teléfono, sin login, estados con timeline), `cuenta/perfil/` (Google Sign-In abierto, guarda nombre/teléfono/dirección/referencias + opt-in de marketing), `cuenta/historial/` (pedidos propios vía `order.listMine`). Se implementó completo el flujo de invitación no-bloqueante diseñado antes: invitación inline junto al campo de teléfono en checkout, y segunda invitación tras enviar el pedido — ninguna bloquea el pedido de invitado. Al iniciar sesión se precarga la dirección guardada (campos vacíos solamente, nunca sobreescribe lo que el cliente ya tecleó). `menu-page.js` ahora manda el `idToken` (si existe) a `order.create` para ligar el pedido a un email verificado server-side.
  - Acciones nuevas en backend: `order.listMine`, `client.getProfile`; `order.create` ahora deriva `customer_email` del token verificado (nunca de un campo declarado por el cliente).
  - Renombrado `admin-auth.js` → `auth-gate.js` / `LTA_ADMIN_AUTH` → `LTA_AUTH_GATE`: el componente de gate de sesión ya no es exclusivo de admin, lo reusa el portal cliente.
  - Ícono de cuenta agregado al header de Home y Menú, enlazando a `cuenta/perfil/`.
  - Verificado en navegador real: las 3 pantallas cargan sin errores; flujo completo de checkout probado de punta a punta (agregar productos, llenar formulario, enviar) — carrito se vacía, WhatsApp abre con mensaje correcto, estado de éxito muestra folio y link de seguimiento, búsqueda de rastreo muestra el error esperado sin backend desplegado.
  - Pendiente (no bloqueante): vincular retroactivamente un pedido de invitado a la cuenta si se registra en la invitación post-pedido (hoy solo guarda el perfil para el próximo pedido, no reetiqueta el que ya se envió).
- [x] **Segmento 5 — Analítica ADDV** (2026-09-22): `analitica/panel/` (real, en subcarpeta nueva ya que `analitica/` raíz la ocupa el mockup) — KPIs, mapa con Leaflet+OpenStreetMap (gratis, sin Google Maps), desglose por zona de envío, top clientes registrados, demanda por hora, exportar CSV, selector de rango (hoy/semana/30 días), gate por dominio `@addv.mx`.
  - **Corrección deliberada al mock:** el mock mostraba colonias con nombre inventado ("Arboledas de Valladolid", "Chapultepec Sur"...) — el sistema real no tiene esos nombres, solo zona de envío (Z1/Z2/Z3) calculada por distancia. Se reemplazó "colonias" por zona para no inventar datos geográficos que no existen.
  - Cambios de esquema/backend: `PEDIDOS` gana `delivery_lat`/`delivery_lng` (se geocodifican una sola vez al crear el pedido — antes no se guardaban, sin eso no había mapa real posible). Nueva acción `analytics.read` (rol ADDV) — calcula todo server-side, nunca manda el histórico crudo al cliente.
  - KPIs que el mock prometía pero se omitieron a propósito por no ser calculables honestamente con los datos que el sistema realmente guarda: "radio promedio de entrega" y "tiempo promedio de entrega" (no hay timestamp de entrega real, solo el status actual) — no se inventaron.
  - Verificado en navegador: Leaflet carga bien, sin errores de consola, gate "backend aún no configurado" correcto. No se pudo probar el render con datos reales (requiere Apps Script desplegado + cuenta @addv.mx real).
- [x] **Segmento 6 — App repartidor** (2026-09-22): `reparto/app/` (Ruta Activa: pedido asignado, GPS real vía `watchPosition` con throttle de 20s, deep-links Google Maps/Waze, mapa Leaflet+OSM del destino, marcar entregado, reportar incidencia) + `entregas/`, `ganancias/` (informativo, comisión fija × entregas), `perfil/`.
  - Cambios de backend: `order.updateStatus` ahora acepta STAFF **o** DRIVERS (antes solo STAFF — el repartidor necesita auto-avanzar su propio pedido). Nuevas acciones `driver.myOrders` / `driver.myDeliveries`, filtradas por `driver_id === email verificado del repartidor` (así que `driver_id` en el admin debe asignarse como el email del repartidor, no un ID arbitrario).
  - MVP: un pedido activo a la vez por repartidor (el mock mostraba una comanda enfocada, coincide). Subida de foto de entrega y "cambio a entregar" (billete grande) quedan fuera de este pase.
  - **Bug propio corregido antes de probar:** un `<div>` envolvía los botones de acción con `hidden` estático que nunca se quitaba — los botones habrían quedado invisibles para siempre sin importar el estado del pedido. Detectado por inspección, no hizo falta el navegador esta vez.
  - Verificado en navegador: las 4 pantallas cargan sin errores de consola, gate correcto. Sin Apps Script desplegado no se pudo probar el flujo real de GPS/entrega.
- [x] **Segmento 7 — Pruebas + verificación funcional** (2026-09-22): `docs/google-sheets-setup.md` — guía paso a paso completa (nombres de hoja y encabezados exactos extraídos de `apps-script/Code.gs`, no redactados a mano; despliegue del Web App; OAuth Client ID; checklist de verificación funcional de las 6 superficies). Enlazada desde `README.md`.
  - Barrido de regresión: las 23 rutas/assets construidos responden 200. Chequeo estático de enlaces (script propio) sobre los 22 HTML: **encontró y corrigió** links rotos reales en `reparto/app/index.html` (nav a Entregas/Ganancias/Perfil usaba `../` de más). Sintaxis de los 12 archivos `src/js/*.js` + `scripts/build-snapshot.mjs` + `apps-script/Code.gs` verificada sin errores.
  - Auditoría dirigida del bug de `hidden` nativo + clase `flex`/`grid` (el mismo que salió 3 veces en segmentos anteriores) sobre **todo** el proyecto: encontró **un caso más** que se había pasado — el badge del carrito en `index.html` (`#cart-badge`) tenía `hidden` nativo + `flex` en el mismo elemento, por lo que mostraba "0" en el header aunque el carrito estuviera vacío. Corregido con el mismo patrón (clase Tailwind `hidden` + `classList.toggle`, nunca el atributo nativo cuando hay una clase de `display` en el mismo elemento).
  - `npm run build` y `node scripts/build-snapshot.mjs` corridos de punta a punta sin errores (el segundo confirma su comportamiento "best-effort" sin Apps Script desplegado, y sí actualiza `lastmod` en `sitemap.xml`).
  - **No se pudo completar** la verificación visual/consola en navegador real de este segmento — la extensión de Chrome se desconectó a medio pase y no volvió a conectar; no se insistió más de 2 intentos. Queda pendiente repetir el barrido visual cuando la extensión esté disponible, y sobre todo, ejecutar el checklist de `docs/google-sheets-setup.md` con Apps Script real desplegado — eso no se puede simular sin credenciales reales.

## Pendiente de que el usuario provea/despliegue (bloquea producción, no bloquea seguir construyendo)

- [x] Desplegar el Google Sheet + `apps-script/Code.gs` como Web App y llenar `SPREADSHEET_ID` + `appsScript.webAppUrl` — **hecho** (2026-09-22), `src/config/site.js` tiene la URL real del Web App.
- [x] Crear el OAuth 2.0 Client ID de Google Cloud Console y llenar `googleClientId` — **hecho** (2026-09-22), probado con Google Sign-In real en desktop y mobile (se corrigió Error 400 agregando el origin de IP local a Authorized JavaScript Origins).
- Logo real de la marca (los íconos PWA actuales son un placeholder monograma "LT" generado localmente).
- Repo `addv-sites/la-tapatia-express` ya vinculado como `origin` — sin commits todavía (se hace cuando el usuario lo pida explícitamente).
- [x] **Falta en admin: menú para agregar repartidor** — **hecho** (2026-09-25). Tarjeta "Repartidores" en `admin/config-envio/` (lista + toggle activo/inactivo + botón "+ Agregar"). Acciones nuevas: `driver.listAll`, `driver.create`, `driver.toggleActive`.

## Bugs encontrados y corregidos en pruebas post-despliegue (2026-09-22)

- **Barra de navegación inferior faltante en "Visítanos"** (`ubicacion/index.html`): la página nunca tuvo el `<nav>` fijo que sí existe en Home/Menú. Agregado con las mismas rutas relativas y padding del resto del sitio.
- **Sesión de Google no persistía en admin/repartidor/analítica** (`src/js/auth-gate.js`): el idToken se guardaba en `sessionStorage` al iniciar sesión pero nunca se releía al montar la página — cada navegación repintaba el botón "Continuar con Google" en vez de restaurar la sesión vigente. Corregido: `renderGate` ahora revisa `sessionStorage` y valida `exp` del token antes de mostrar el botón de login.

## Asignación de repartidor desde el Kanban (2026-09-22)

- [x] Implementado: `admin/pedidos/` ahora muestra un selector de repartidor en pedidos `A domicilio` dentro de la columna "Listo / En Reparto". Cambiar la selección llama `order.assignDriver` de inmediato (sin botón aparte, revierte visualmente si falla).
- Backend: nueva acción `driver.list` (rol STAFF) en `apps-script/Code.gs` — lista repartidores activos de la hoja `DRIVERS` para poblar el selector. `order.assignDriver` ya existía y no cambió. Documentado en `docs/apps-script-contract.md`.
- **Pendiente del usuario:** repegar `apps-script/Code.gs` actualizado en el editor de Apps Script real y volver a desplegar — el Web App en vivo todavía no reconoce `driver.list` hasta ese paso manual. Sin eso, el selector cargará vacío/con error en producción (el resto de la página sigue funcionando igual).
- No se pudo probar el flujo end-to-end contra el backend real por lo anterior; sí se verificó visualmente el layout de la tarjeta (selector + botón, sin overlap) con un harness temporal usando el CSS/íconos reales del proyecto, y la sintaxis del JS.

## Precarga de catálogo + subida de fotos a Drive (2026-09-22)

- [x] Implementado: la hoja `CATALOGO` real estaba vacía (nunca se llenó a mano como pedía la guía) — se agregó botón "Precargar catálogo desde data/catalog.json" en `admin/catalogo/`, visible solo cuando la tabla está vacía. Llama a la nueva acción `catalog.seed` (STAFF), idempotente — no duplica productos que ya existan por `product_id`.
- [x] Implementado: subida de foto real por producto en `admin/catalogo/` — botón "+" sobre la miniatura, redimensiona/comprime la imagen en el navegador (máx 800px, JPEG calidad 0.8) antes de mandarla. Backend: nueva acción `catalog.uploadPhoto` (STAFF) sube a una carpeta de Google Drive ("La Tapatía Ahogadas - Fotos Catálogo"), la hace pública por link (necesario para `<img>`), límite de 3MB decodificado, y actualiza la columna `image` de `CATALOGO`. `catalogUploadPhoto` solo existía como comentario TODO desde el scaffolding inicial — nunca se había implementado.
- Documentado en `docs/apps-script-contract.md`.
- **Pendiente del usuario:** repegar `apps-script/Code.gs` y hacer "Nueva versión" en Implementar → Administrar implementaciones (ya sabe el paso, lo hizo para `driver.list`).
- Verificado visualmente el layout (miniatura + botón, banner de precarga) con un harness temporal usando el CSS/sprite reales; no probado end-to-end contra el backend real (pendiente redeploy + login STAFF real del usuario).

## Animación del timeline de seguimiento — decisión tomada, pendiente de implementar (2026-09-25)

- Se propusieron 3 animaciones para que el listado de pasos (Recibido y confirmado / En la cocina / Listo / En camino / Entregado) no se sintiera estático, ahora que `cuenta/rastreo` se refresca sola cada 20s: (1) línea conectora que se rellena, (2) pulso tipo radar en el paso activo + rebote al avanzar, (3) marcador viajero que se desliza por la línea.
- **Elegida: Propuesta 2** (pulso en el paso activo). Falta implementar en `src/js/rastreo.js` (función `renderOrder`, el bloque `STEPS.forEach` que pinta `#result-steps`) — es el único timeline de pasos del sitio hoy (la pantalla de éxito del checkout en `menu/index.html` no tiene uno, solo folio + link).
- Mockup de referencia (3 propuestas, real, jugable): https://claude.ai/code/artifact/3d92ef9b-f8f4-4d8a-815d-f690a86ab394

## Consistencia de navegación, slug repartidor y aura de pedidos activos (2026-09-25)

- [x] Menú inferior (Antojo/Menú/Pedido/Visítanos) antes solo existía en Home y `/menu/`; desaparecía en las 3 páginas de `/cuenta/`. Se agregó un 5º ícono "Cuenta" y se aplicó el mismo `<nav>` fijo a `cuenta/perfil/`, `cuenta/historial/` y `cuenta/rastreo/`.
- [x] En `cuenta/perfil/`, el link del header pasó de "Historial" a "Pedidos" (mismo destino). Los campos del formulario ahora inician `disabled`; el botón arranca en "Editar" y alterna a "Guardar" al presionarlo (`src/js/portal-perfil.js`, función `setEditing`).
- [x] Slug de la app repartidor: `reparto/app/` → `/repartidor/` (los 4 archivos movidos con `git mv`, rutas relativas internas ajustadas un nivel). `reparto/app/index.html` se dejó como **redirect permanente** (meta refresh + `location.replace`) hacia `/repartidor/` — decisión del usuario, no se borra la carpeta vieja. `reparto/code.html`, `DESIGN.md` y `screen.png` (prototipo) no se tocaron. Actualizadas referencias en `admin/index.html`, `README.md`, `docs/google-sheets-setup.md`, `tests/e2e/repartidor.spec.js` y `tailwind.config.js`.
- [x] En `admin/index.html`, "Otros portales" pasó de un link directo a mostrar el nombre "Repartidor" + botón "Compartir app" (ícono nuevo `icon-share` en el sprite). Usa `navigator.share()`; si el navegador no lo soporta, copia el enlace al portapapeles y muestra un toast (se agregó `toast.js` al admin, que antes no lo cargaba).
- [x] Tarjeta "Pedidos" del dashboard admin: cuando hay pedidos activos (`admin-dashboard.js`), se le agrega la clase `.pedidos-alert` — latido (`scale`) + resplandor rojo expandente (`box-shadow`), definida en `src/styles/input.css`. Se eligió la Propuesta 3 de 3 mockups (Halo que respira / Ondas expansivas / Latido de tarjeta completa). Cubierta por la regla global de `prefers-reduced-motion` ya existente en `input.css`.
- Mockups de referencia: https://claude.ai/code/artifact/397bf306-89c6-4e91-a84b-0b224c01e00f (menú inferior + toggle perfil) y https://claude.ai/code/artifact/f601f001-9806-4190-b338-c22884ebf21f (slug, compartir app, 3 auras).
- Validado local con `npm run build:css` + `npm run serve`: todas las rutas tocadas (`/repartidor/` y sus 3 subpáginas, `/reparto/app/` redirect, `/admin/`, las 3 de `/cuenta/`) responden 200.
- **Pendiente:** correr `npm run test:e2e` contra el nuevo slug (el spec ya apunta a `/repartidor/`, no se ejecutó en esta sesión) y validar en dispositivo real el fallback de `navigator.share()` en escritorio.

## Visor de imagen, Editar en catálogo y alta de repartidores (2026-09-25)

- [x] Visor de imagen a detalle: tap/click en la foto de un antojo (Home) o platillo (`/menu/`) abre una vista grande con nombre, precio, descripción y botón "+ Agregar al pedido" (Home lo manda al drawer de salsas existente; Menú agrega directo con la misma animación de vuelo al carrito). Cierra con la X, tocando el fondo, o con el botón atrás del navegador/celular (`history.pushState` + `popstate`, no navega fuera de la página). Animación 450ms, fade + scale, curva suave.
- [x] `admin/catalogo/`: nuevo botón "Editar" (lápiz) junto a Guardar/Borrar — abre modal precargado para cambiar nombre, categoría, precio, descripción corta **y foto** en un solo guardado. Nueva acción `catalog.updateDetails` en Apps Script (el precio inline de la tabla y "Validar" siguen igual, esto es un camino adicional).
- [x] `admin/config-envio/`: tarjeta "Repartidores" (lista con toggle activo/inactivo + botón "+ Agregar repartidor"). Nuevas acciones `driver.listAll`, `driver.create`, `driver.toggleActive` — resuelve el pendiente de arriba.
- Mockups de referencia: https://claude.ai/code/artifact/caf3534d-92cd-4f88-a5ae-c58765a0346f
- Validado local (`npm run build:css` + `npm run serve`): las 4 páginas tocadas (Home, `/menu/`, `admin/catalogo/`, `admin/config-envio/`) responden 200, sintaxis de los 3 JS + `Code.gs` verificada.
- **Pendiente del usuario:** repegar `Code.gs` completo en el editor de Apps Script y "Nueva versión" — sin eso `catalog.updateDetails`/`driver.listAll`/`driver.create`/`driver.toggleActive` no existen todavía en producción.

## Próximo paso

Los 7 segmentos de construcción están completos y Apps Script/Sheets/OAuth ya están desplegados y probados con datos/cuentas reales. Sigue: **redesplegar `apps-script/Code.gs` actualizado** para activar la asignación de repartidor en producción, validar precios/horarios reales con el negocio, subir fotografía real, logo real, y decidir si se construye lo marcado como "pendiente, no bloqueante" en cada segmento (subida de fotos HD, vínculo retroactivo de pedido-invitado a cuenta, etc.).
