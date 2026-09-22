# La Tapatía Ahogadas

Sitio web, panel administrativo, portal de cliente, panel de analítica y app de repartidor de **La Tapatía Ahogadas** (Morelia, Michoacán). Arquitectura 100% estática: **GitHub Pages + Google Sheets + Google Apps Script**, sin backend tradicional, sin servidor propio, sin base de datos propia.

> Estado del proyecto y decisiones tomadas: ver [`project_state.md`](./project_state.md). Contexto operativo persistente: [`CLAUDE.md`](./CLAUDE.md).

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
