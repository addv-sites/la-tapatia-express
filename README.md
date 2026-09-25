# Ahogadas La Tapatía Express

Sitio web, panel administrativo, portal de cliente, panel de analítica y app de repartidor de **Ahogadas La Tapatía Express** (Morelia, Michoacán). Arquitectura 100% estática: **GitHub Pages + Google Sheets + Google Apps Script**, sin backend tradicional, sin servidor propio, sin base de datos propia.

> Estado del proyecto y decisiones tomadas: ver [`project_state.md`](./project_state.md). Contexto operativo persistente: [`CLAUDE.md`](./CLAUDE.md).

## URLs de producción

Base: **`https://addv-sites.github.io/la-tapatia-express/`** (GitHub Pages, sin dominio propio).
Todas las rutas de este documento fueron verificadas con HTTP 200 contra `main` el **2026-09-25**.

### Sitio público — sin autenticación

| URL | Qué hace | Endpoints Apps Script |
|---|---|---|
| https://addv-sites.github.io/la-tapatia-express/ | Home. Explora por categoría, favoritos de la casa, cómo funciona el pedido, datos de la sucursal. Carrito persistente. | `catalog.read`, `config.read` |
| https://addv-sites.github.io/la-tapatia-express/menu/ | Menú completo por categoría + carrito + checkout. El checkout registra el pedido en Sheets y **después** abre `wa.me` con folio y detalle. | `catalog.read`, `config.read`, `client.getProfile`, `client.upsertProfile`, `order.create` |
| https://addv-sites.github.io/la-tapatia-express/ubicacion/ | Dirección, horario y mapa (OpenStreetMap + Nominatim, sin costo). | — (estático) |
| https://addv-sites.github.io/la-tapatia-express/contacto/ | Datos de contacto, redes sociales, formulario que deriva a WhatsApp. | — (estático) |

Indexables: las 4 están en `sitemap.xml` y **no** llevan meta `robots`.

### Portal de cliente — Google Sign-In abierto (cualquier cuenta, sin whitelist)

| URL | Qué hace | Endpoints Apps Script |
|---|---|---|
| https://addv-sites.github.io/la-tapatia-express/cuenta/rastreo/ | Rastreo de un pedido por **folio + teléfono**. No requiere sesión: es la ruta de consulta rápida. | `order.trackingRead` |
| https://addv-sites.github.io/la-tapatia-express/cuenta/historial/ | Historial de pedidos del cliente autenticado, con estado y folio. | `order.listMine` |
| https://addv-sites.github.io/la-tapatia-express/cuenta/perfil/ | Datos del cliente, dirección guardada y opt-in de marketing. | `client.getProfile`, `client.upsertProfile`, `client.optInMarketing` |

`noindex, nofollow` en las 3. El acceso es abierto pero **el contenido sí está atado a la cuenta**:
`order.listMine` resuelve el cliente desde el ID token de Google, nunca desde un email enviado por el cliente.

> Rutas reales construidas. `pc/` solo contiene el diseño de referencia (`pc/code.html` + `screen.png`)
> y no es una superficie desplegada — ver la discrepancia con la tabla de `CLAUDE.md` pendiente de corregir.

### App repartidor — Google Sign-In + whitelist hoja `DRIVERS`

| URL | Qué hace | Endpoints Apps Script |
|---|---|---|
| https://addv-sites.github.io/la-tapatia-express/reparto/app/ | Pedidos disponibles, ficha del pedido, mapa de la entrega, cambio de estado (`en_reparto` → `entregado`), reporte de incidencia. | `driver.myOrders`, `driver.pingLocation`, `order.updateStatus`, `incident.report` |
| https://addv-sites.github.io/la-tapatia-express/reparto/app/entregas/ | Entregas asignadas al repartidor con su historial de estado. | `driver.myDeliveries` |
| https://addv-sites.github.io/la-tapatia-express/reparto/app/ganancias/ | Ganancias calculadas contra `driver_fixed_commission` de CONFIG. | `driver.myDeliveries`, `config.read` |
| https://addv-sites.github.io/la-tapatia-express/reparto/app/perfil/ | Perfil del repartidor. Solo el gate de acceso, sin llamadas a la API. | — |

`noindex, nofollow` en las 4. `driver.pingLocation` es la única superficie que emite geolocalización
del repartidor; se envía al backend, nunca a un tercero.

### Administración — Google Sign-In + whitelist hoja `STAFF`

| URL | Qué hace | Endpoints Apps Script |
|---|---|---|
| https://addv-sites.github.io/la-tapatia-express/admin/ | **Punto de entrada.** Login + dashboard con las 3 herramientas de abajo (con contador real de pedidos activos en la tarjeta de Pedidos) y links a los otros portales (App Repartidor). Analítica **no** aparece aquí a propósito — es acceso interno ADDV, ver abajo. | `order.list` (solo para el contador) |
| https://addv-sites.github.io/la-tapatia-express/admin/catalogo/ | KPIs (platillos registrados / precios pendientes), alta de platillo, **subida de fotos a Drive**, edición y aprobación de precios, activar/desactivar platillo, sembrar catálogo desde el snapshot. | `catalog.readAll`, `catalog.create`, `catalog.updatePrice`, `catalog.approvePrice`, `catalog.toggleAvailability`, `catalog.uploadPhoto`, `catalog.seed` |
| https://addv-sites.github.io/la-tapatia-express/admin/pedidos/ | KDS de comandas en vivo, asignación de repartidor, cambio de status del enum (`pendiente→confirmado→en_cocina→listo→entregado`), y baja de pedido. | `order.list`, `order.assignDriver`, `order.updateStatus`, `order.delete`, `driver.list` |
| https://addv-sites.github.io/la-tapatia-express/admin/config-envio/ | Tarifas por zona Z1/Z2/Z3, `driver_fixed_commission`, interruptor `delivery_enabled`, horario del negocio. | `config.read`, `config.update` |

`noindex, nofollow` en las 4. Las tres de trabajo están enlazadas entre sí en la barra superior
(catalogo ↔ pedidos ↔ config. envío), y la sesión se conserva en `sessionStorage` para no
re-loguear al navegar entre ellas ni al volver al dashboard en `/admin/`.

> `order.delete` es la única operación destructiva de la UI. Antes de exponerla en la interfaz,
> conviene decidir si queda auditada en la hoja `LOG` — hoy el borrado no es reversible desde el panel.

### Analítica — Google Sign-In + dominio `@addv.mx`

| URL | Qué hace | Endpoints Apps Script |
|---|---|---|
| https://addv-sites.github.io/la-tapatia-express/analitica/panel/ | Mapa de pedidos a domicilio geocodificados (Leaflet + OSM), distribución por zona de envío, top de clientes registrados y demanda por hora. Todo con datos agregados server-side. | `analytics.read` |

`noindex, nofollow`. Es la única superficie restringida por **dominio** en vez de whitelist de hoja.
No está enlazada desde `/admin/` a propósito — es acceso interno del equipo ADDV, se comparte la
URL directo con quien la necesite, no se expone en el dashboard general del negocio.

### Recursos de la PWA y SEO

| URL | Qué es |
|---|---|
| https://addv-sites.github.io/la-tapatia-express/manifest.webmanifest | Manifest de la PWA (instalable). |
| https://addv-sites.github.io/la-tapatia-express/sw.js | Service worker: cacheo de assets y fallback offline. |
| https://addv-sites.github.io/la-tapatia-express/offline.html | Página de fallback cuando no hay conexión. |
| https://addv-sites.github.io/la-tapatia-express/robots.txt | Reglas de rastreo + puntero al sitemap. |
| https://addv-sites.github.io/la-tapatia-express/sitemap.xml | Solo las 4 rutas públicas, regenerado en cada build con `lastmod` real. |

Los mockups de diseño de Stitch **sí están desplegados y son accesibles sin autenticación**, y
**no llevan meta `robots`**, así que son rastreables: `robots.txt` tiene `Allow: /` y nada los excluye.
No exponen datos ni credenciales, pero conviene marcarlos `noindex` o moverlos fuera del build:

| URL | Superficie |
|---|---|
| https://addv-sites.github.io/la-tapatia-express/pc/code.html | Diseño del portal de cliente |
| https://addv-sites.github.io/la-tapatia-express/reparto/code.html | Diseño de la app repartidor |
| https://addv-sites.github.io/la-tapatia-express/analitica/code.html | Diseño del panel de analítica |
| https://addv-sites.github.io/la-tapatia-express/admin/administrador_de_precios_y_cat_logo_la_tapat_a_ahogadas/code.html | Diseño del gestor de catálogo |
| https://addv-sites.github.io/la-tapatia-express/admin/gesti_n_de_pedidos_comandas_en_vivo_la_tapat_a_ahogadas/code.html | Diseño del KDS de comandas |

`drive-permission-fix.html` **no está en producción** (404) a propósito: es un archivo local de
depuración de permisos de Drive que nunca se versionó.

### Sobre el acceso

Todas las superficies restringidas (repartidor, administración, analítica) usan el mismo patrón:
el cliente solo obtiene el **ID token** de Google, y la autorización real (whitelist `STAFF` /
`DRIVERS`, o dominio `@addv.mx`) la valida Apps Script **en cada request**. Conocer la URL no da
acceso a nada. El token vive en `sessionStorage` únicamente y se descarta al cerrar sesión.

## Arquitectura en una línea

El sitio (HTML/CSS/JS estático) corre en GitHub Pages. Todo dato (catálogo, precios, pedidos, clientes, staff) vive en un Google Sheet. Toda escritura pasa por un **Google Apps Script Web App** — es la única "capa de backend", desplegada por separado en Google, no en este repo (aunque su código fuente sí se versiona aquí en [`apps-script/Code.gs`](./apps-script/Code.gs) para no perderlo).

Ver el contrato completo de datos/endpoints en [`docs/apps-script-contract.md`](./docs/apps-script-contract.md).

## Requisitos previos

- Node.js 20+ (solo para compilar CSS y generar el snapshot del catálogo — no corre en producción)
- Una cuenta de Google (Workspace de ADDV) con un Google Sheet y un proyecto de Apps Script
- Un OAuth 2.0 Client ID de Google Cloud Console (para Google Sign-In)

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev:css   # recompila Tailwind en watch mode
npm run serve     # sirve el sitio en http://localhost:8080
```

## Build

```bash
npm run build     # compila y minifica css/site.css
```

En producción, el build también regenera `data/catalog.json` desde Apps Script (`scripts/build-snapshot.mjs`) — ver `.github/workflows/deploy.yml`.

## Despliegue

Automático vía GitHub Actions (`.github/workflows/deploy.yml`) al hacer push a `main`, en un cron aproximado durante horario de operación, y manualmente (`workflow_dispatch`). No se publica ni despliega nada manualmente sin pasar por ese pipeline.

## Configuración

Toda la configuración pública vive en [`src/config/site.js`](./src/config/site.js): teléfono, WhatsApp, dirección, redes sociales, y las URLs públicas de Apps Script / Google Client ID (no son secretos — la autorización real ocurre server-side verificando el token de Google, nunca por conocer estas URLs).

Variables pendientes de llenar al desplegar:

| Variable | Dónde | Nota |
|---|---|---|
| `SPREADSHEET_ID` | `apps-script/Code.gs` | Id del Google Sheet |
| `appsScript.webAppUrl` | `src/config/site.js` | URL del Web App de Apps Script ya desplegado |
| `googleClientId` | `src/config/site.js` | OAuth 2.0 Client ID de Google Cloud Console |
| `analytics.gaMeasurementId` / `gtmContainerId` | `src/config/site.js` | Nunca inventar — dejar `null` hasta tener el real |

## Catálogo y Google Sheets

Esquema completo de hojas (`CATALOGO`, `PEDIDOS`, `SUCURSALES`, `CONFIG`, `STAFF`, `DRIVERS`, `CLIENTES`, `LOG`, `INCIDENCIAS`) documentado en [`docs/apps-script-contract.md`](./docs/apps-script-contract.md). Todos los precios nacen marcados `requiresValidation: true` hasta que el negocio los confirme desde el admin.

## Apps Script — puesta en marcha completa

Guía paso a paso (encabezados exactos de cada hoja, despliegue del Web App, OAuth Client ID, y checklist de verificación funcional): **[`docs/google-sheets-setup.md`](./docs/google-sheets-setup.md)**.

Resumen rápido:
1. Crear el Google Sheet con las 9 hojas del esquema.
2. Extensiones → Apps Script, pegar el contenido de `apps-script/Code.gs`.
3. Llenar `SPREADSHEET_ID` en el propio script.
4. Desplegar como Web App (ejecutar como "Yo", acceso "Cualquier usuario").
5. Copiar la URL del Web App a `appsScript.webAppUrl` en `src/config/site.js`.

## WhatsApp

Sin bot conversacional ni WhatsApp Business API (no es viable sin servidor persistente). El flujo real: el sitio registra el pedido en Sheets (`order.create`) y **después** abre un enlace `wa.me` con el folio y el detalle, para que el cliente lo revise y envíe manualmente.

## Analítica

Eventos definidos en `seo.md` (`page_view`, `menu_view`, `add_to_cart`, etc.) usando `GA_MEASUREMENT_ID`/`GTM_CONTAINER_ID` como placeholders — nunca se inventan IDs reales. El panel de BI para ADDV (`analitica/`) usa datos agregados server-side vía Apps Script, mapas con Leaflet + OpenStreetMap (sin costo, sin Google Maps Platform).

## Imágenes

Convención y pipeline de restauración fotográfica en [`images_prompt.md`](./images_prompt.md). Formatos WebP/AVIF, `width`/`height` fijos, lazy loading debajo del fold.

## Sucursales

`branch_id` presente en el esquema desde v1; lógica actual asume una sola sucursal (Morelia, `morelia-san-juanito`). Ver `project_state.md` para el estado de una eventual segunda sucursal.

## Solución de problemas

- **El catálogo no se actualiza en el sitio:** revisa que `appsScript.webAppUrl` esté configurado y que el GitHub Action de build haya corrido (o dispararlo manualmente con `workflow_dispatch`).
- **Un pedido no aparece en el gestor de pedidos:** el pedido se registra en Sheets *antes* de abrir WhatsApp — si el cliente cerró el sitio antes de que terminara ese request, no queda registrado. No hay forma de recuperar eso sin bot (fuera de alcance, ver `project_state.md`).
- **Falla el Sign-In con Google:** confirma que `googleClientId` corresponda al proyecto correcto y que el dominio de GitHub Pages esté en los orígenes autorizados de ese OAuth Client ID en Google Cloud Console.
