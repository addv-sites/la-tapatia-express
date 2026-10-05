/**
 * La Tapatía Ahogadas — Apps Script Web App
 *
 * Este archivo se pega tal cual en el editor de script.google.com del
 * proyecto (Extensiones > Apps Script desde el Google Sheet). No corre en
 * GitHub Pages — es la única capa de escritura/autorización del proyecto.
 * Contrato completo de acciones y esquema de hojas: docs/apps-script-contract.md
 *
 * Desplegar como Web App: Ejecutar como "Yo", Acceso "Cualquier usuario".
 *
 * Setup de Drive (requerido antes del primer despliegue, ver también
 * apps-script/appsscript.json):
 *   1. appsscript.json con oauthScopes incluyendo
 *      "https://www.googleapis.com/auth/drive" (no dejar en autodetección).
 *   2. Panel Servicios del editor (ícono +) → agregar servicio avanzado
 *      "Drive API" (v3). Sin esto Drive.Permissions.create no existe.
 *   3. Correr runTestDriveAuth (ver abajo) una vez desde el editor para
 *      disparar el diálogo de autorización — el deploy solo no lo pide.
 *   4. Para compartir archivos: usar SIEMPRE Drive.Permissions.create
 *      ({role:'reader', type:'anyone'}, fileId) — NUNCA
 *      DriveApp.setSharing(ANYONE_WITH_LINK, ...), que truena con
 *      "Access denied: DriveApp" incluso con scope completo, autorización
 *      ya otorgada y política de dominio Workspace permitiendo compartir
 *      fuera de la organización. Es un problema del servicio simplificado
 *      DriveApp, no de permisos — el servicio avanzado sí funciona.
 *   5. Para la URL pública de la imagen: usar
 *      'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000' —
 *      NUNCA 'uc?export=view&id=...', que ya no sirve como imagen
 *      embebida en <img src> (Google la redirige a una página HTML).
 */

// Respaldo solo para el caso raro de correr este script como standalone
// (fuera del Sheet). Si el script vive dentro del Sheet (Extensiones >
// Apps Script), ss_() lo resuelve solo con getActiveSpreadsheet() y esta
// constante nunca se usa — no hace falta tocarla al repegar/redesplegar.
const SPREADSHEET_ID = '1iqV4x9Iehk6my4iMPa9TB1AYaLCMlVy_giZGOUeW1G0';
const TIMEZONE = 'America/Mexico_City';
const RATE_LIMIT_PER_MINUTE = 5;
const MIN_SUBMIT_MS = 1500; // rechaza submits a <1.5s de cargada la página

function ss_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID no configurado (script standalone sin Sheet activo)');
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function sheet_(name) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    // Tolera espacios accidentales o mayúsculas/minúsculas distintas en el
    // nombre real de la pestaña (typo común al crear el Sheet a mano).
    const target = name.trim().toLowerCase();
    sh = ss.getSheets().find((s) => s.getName().trim().toLowerCase() === target) || null;
  }
  if (!sh) throw new Error('Hoja no encontrada: ' + name);
  return sh;
}

/** Lee una hoja completa como array de objetos usando la primera fila como headers. */
function readSheetAsObjects_(name) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h).trim());
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow_(sheetName, obj, headers) {
  const sh = sheet_(sheetName);
  const row = headers.map((h) => (obj[h] !== undefined ? obj[h] : ''));
  sh.appendRow(row);
}

/** Navega (o crea) una ruta anidada de carpetas en Drive, ej. ['laTapatia', 'imagenes', 'catalogo']. */
function getOrCreateFolderPath_(pathParts) {
  let folder = DriveApp.getRootFolder();
  pathParts.forEach((name) => {
    const existing = folder.getFoldersByName(name);
    folder = existing.hasNext() ? existing.next() : folder.createFolder(name);
  });
  return folder;
}

/**
 * Prueba manual de setup de Drive para un cliente nuevo. Correr
 * runTestDriveAuth (no testDriveAuth_ directo: los nombres con "_" no
 * aparecen en el dropdown "Ejecutar" del editor) para disparar el diálogo
 * de autorización. Confirma folder + createFile + Drive.Permissions.create
 * (requiere el servicio avanzado Drive API — ver comentario al inicio del
 * archivo). Se puede dejar en el proyecto de forma permanente como
 * herramienta de diagnóstico para futuros clientes.
 */
function testDriveAuth_() {
  const folder = getOrCreateFolderPath_(['laTapatia', 'imagenes', 'catalogo']);
  const testFile = folder.createFile('test-auth.txt', 'ok', MimeType.PLAIN_TEXT);
  Logger.log('OK crear archivo: ' + testFile.getId());
  Drive.Permissions.create({ role: 'reader', type: 'anyone' }, testFile.getId());
  Logger.log('OK Drive.Permissions.create (requiere servicio avanzado Drive API)');
  testFile.setTrashed(true);
  Logger.log('Archivo de prueba borrado.');
}

/** Wrapper sin "_" para que aparezca en el dropdown "Ejecutar" del editor. */
function runTestDriveAuth() {
  testDriveAuth_();
}

/** Normaliza un nombre a slug ascii-kebab para usarlo como product_id legible. */
function slugify_(text) {
  const combiningMarks = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
  return String(text)
    .normalize('NFD').replace(combiningMarks, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Verifica el ID token de Google Sign-In contra el endpoint oficial de Google. Nunca confiar en el email declarado por el cliente sin esto. */
function verifyIdToken_(idToken) {
  if (!idToken) return null;
  const resp = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) return null;
  const payload = JSON.parse(resp.getContentText());
  if (!payload.email || payload.email_verified !== 'true') return null;
  return { email: payload.email.toLowerCase(), name: payload.name || '' };
}

function requireRole_(idToken, role) {
  const user = verifyIdToken_(idToken);
  if (!user) throw new Error('No autorizado: token inválido');

  if (role === 'ADDV') {
    if (!user.email.endsWith('@addv.mx')) throw new Error('No autorizado: dominio no permitido');
    return user;
  }

  const sheetName = role === 'STAFF' ? 'STAFF' : role === 'DRIVERS' ? 'DRIVERS' : null;
  if (sheetName) {
    const rows = readSheetAsObjects_(sheetName);
    const match = rows.find((r) => String(r.email).toLowerCase() === user.email && r.active);
    if (!match) throw new Error('No autorizado: no está en la whitelist ' + role);
    return user;
  }

  // role === 'ANY' → cualquier cuenta Google verificada (cliente)
  return user;
}

/** Rate limit simple por sesión usando CacheService. */
function requireAnyRole_(idToken, roles) {
  let lastErr = null;
  for (const role of roles) {
    try { return requireRole_(idToken, role); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('No autorizado');
}

function checkRateLimit_(sessionId) {
  const cache = CacheService.getScriptCache();
  const key = 'rl_' + sessionId;
  const count = Number(cache.get(key) || 0);
  if (count >= RATE_LIMIT_PER_MINUTE) throw new Error('Demasiadas solicitudes, intenta más tarde');
  cache.put(key, String(count + 1), 60);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function nextFolio_() {
  return withLock_(() => {
    const props = PropertiesService.getScriptProperties();
    const current = Number(props.getProperty('last_folio') || 0) + 1;
    props.setProperty('last_folio', String(current));
    return '#TA-' + String(current).padStart(4, '0');
  });
}

function logAudit_(actorEmail, action, entity, entityId, before, after) {
  appendRow_('LOG', {
    timestamp: Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    actor_email: actorEmail,
    action: action,
    entity: entity,
    entity_id: entityId,
    before: JSON.stringify(before || {}),
    after: JSON.stringify(after || {})
  }, ['timestamp', 'actor_email', 'action', 'entity', 'entity_id', 'before', 'after']);
}

// ---------------------------------------------------------------------------
// Geocodificación (Nominatim / OpenStreetMap — gratis, respeta 1 req/seg)
// ---------------------------------------------------------------------------

/**
 * Geocodifica la dirección del pedido al confirmarlo (order.create). Lleva
 * el mismo sesgo a Morelia (countrycodes + viewbox sin restringir duro) que
 * geocodeSearchMulti_ — sin esto, una dirección con poco detalle (ej. solo
 * "Reyna Xochitl 170, Morelia, Michoacán") puede perder contra una calle del
 * mismo nombre en otro estado, porque Nominatim no sabe que "Morelia" debe
 * pesar más que el resto de la consulta. Bug real encontrado en producción:
 * 3 pedidos geocodificados a Zapopan/Jalisco en vez de Morelia.
 */
function geocodeAddress_(address) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'geo_' + address;
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  Utilities.sleep(1000); // respeta política de uso de Nominatim
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1' +
    '&countrycodes=mx&viewbox=-101.35,19.85,-100.95,19.55&bounded=0' +
    '&q=' + encodeURIComponent(address);
  const resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'LaTapatiaAhogadas/1.0 (contacto@addv.mx)' }
  });
  if (resp.getResponseCode() !== 200) return null;
  const results = JSON.parse(resp.getContentText());
  if (!results.length) return null;
  const result = { lat: Number(results[0].lat), lng: Number(results[0].lon) };
  cache.put(cacheKey, JSON.stringify(result), 21600); // 6h
  return result;
}

/** Reverse geocoding: lat/lng -> dirección legible + CP/colonia. Usado por el pin arrastrable del checkout. */
function reverseGeocode_(lat, lng) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'georev_' + lat + '_' + lng;
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  Utilities.sleep(1000); // respeta política de uso de Nominatim
  const url = 'https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng);
  const resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'LaTapatiaAhogadas/1.0 (contacto@addv.mx)' }
  });
  if (resp.getResponseCode() !== 200) return null;
  const result = JSON.parse(resp.getContentText());
  if (!result || !result.display_name) return null;
  const addr = result.address || {};
  const out = {
    address: result.display_name,
    cp: addr.postcode || '',
    colonia: addr.suburb || addr.neighbourhood || addr.quarter || ''
  };
  cache.put(cacheKey, JSON.stringify(out), 21600); // 6h
  return out;
}

function action_geoReverseGeocode_(payload) {
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);
  if (!lat || !lng) throw new Error('Faltan coordenadas');
  const result = reverseGeocode_(lat, lng);
  if (!result) throw new Error('No se pudo obtener la dirección para ese punto');
  return result;
}

/**
 * Forward geocoding con varios resultados — usado en vivo por la barra de
 * búsqueda del checkout (variante "mapa siempre visible"), a diferencia de
 * geocodeAddress_ que solo trae 1 resultado y corre al confirmar el pedido.
 * Sesga a Morelia con viewbox sin restringir duro (bounded=0) para no
 * descartar direcciones reales que caigan justo fuera del cuadro.
 */
function geocodeSearchMulti_(query) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'geosearch_' + query;
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  Utilities.sleep(1000); // respeta política de uso de Nominatim
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5' +
    '&countrycodes=mx&viewbox=-101.35,19.85,-100.95,19.55&bounded=0' +
    '&q=' + encodeURIComponent(query);
  const resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'LaTapatiaAhogadas/1.0 (contacto@addv.mx)' }
  });
  if (resp.getResponseCode() !== 200) return [];
  const results = JSON.parse(resp.getContentText());
  const out = results.map((r) => ({
    label: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    cp: (r.address && r.address.postcode) || '',
    colonia: (r.address && (r.address.suburb || r.address.neighbourhood || r.address.quarter)) || '',
    precise: !!(r.address && r.address.house_number)
  }));
  cache.put(cacheKey, JSON.stringify(out), 21600); // 6h
  return out;
}

function action_geoSearch_(payload) {
  const q = String(payload.q || '').trim();
  if (q.length < 4) throw new Error('Escribe al menos 4 caracteres para buscar');
  return { results: geocodeSearchMulti_(q) };
}

function distanceKm_(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Tarifario configurable por km (reemplaza las 3 zonas fijas Z1/Z2/Z3).
 * config.delivery_tariff_table es JSON [{"km":1,"cost":40}, ...] guardado como
 * texto en una sola celda de CONFIG (incluso un arreglo de longitud variable
 * no cabe en columnas fijas de Sheet). Redondeo: la distancia baja al km
 * cerrado salvo que el sobrante pase de 300 m (0.3 km), en cuyo caso se cobra
 * el km completo siguiente — regla confirmada con el negocio.
 * Más allá del último km de la tabla, cada km extra sube
 * delivery_extra_km_cost. Pasando delivery_max_km, la entrega no está
 * disponible (el checkout debe ofrecer solo recoger en sucursal).
 */
function resolveDeliveryTariff_(distanceKm, config) {
  const maxKm = Number(config.delivery_max_km || 0);
  if (maxKm && distanceKm > maxKm) return { available: false };

  let table;
  try { table = JSON.parse(config.delivery_tariff_table || '[]'); } catch (e) { table = []; }
  if (!table.length) return { available: false };

  const byKm = {};
  table.forEach((row) => { byKm[Number(row.km)] = Number(row.cost); });

  let tier = Math.floor(distanceKm);
  const remainder = distanceKm - tier;
  if (remainder > 0.3) tier += 1;
  if (tier < 1) tier = 1;

  if (byKm[tier] !== undefined) return { available: true, km: tier, cost: byKm[tier] };

  const knownKms = Object.keys(byKm).map(Number);
  const lastKm = Math.max.apply(null, knownKms);
  const extraCost = Number(config.delivery_extra_km_cost || 0);
  return { available: true, km: tier, cost: byKm[lastKm] + (tier - lastKm) * extraCost };
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

function action_catalogRead_() {
  const rows = readSheetAsObjects_('CATALOGO').filter((r) => r.active);
  return { products: rows };
}

function action_catalogReadAll_() {
  return { products: readSheetAsObjects_('CATALOGO') };
}

function action_configRead_() {
  const rows = readSheetAsObjects_('CONFIG');
  const config = rows[0] || {};
  // Si alguna vez una celda hours_<dia>_open/close se guardó sin forzar
  // formato texto, Sheets la auto-detecta como Hora y getValues() regresa
  // un Date (serial desde 1899-12-30) en vez del string "HH:mm" que espera
  // business-hours.js — normalizamos aquí para que una celda ya corrompida
  // no rompa el render sin tener que tocar el Sheet a mano.
  Object.keys(config).forEach((key) => {
    if (/^hours_.*_(open|close)$/.test(key) && config[key] instanceof Date) {
      config[key] = Utilities.formatDate(config[key], TIMEZONE, 'HH:mm');
    }
  });
  return { config: config };
}

function action_configUpdate_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CONFIG');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    if (values.length < 2) throw new Error('Hoja CONFIG sin fila de datos — crear la primera fila manualmente');
    const before = {};
    headers.forEach((h, i) => { before[h] = values[1][i]; });
    Object.keys(payload).forEach((key) => {
      const col = headers.indexOf(key);
      if (col < 0) return;
      const range = sh.getRange(2, col + 1);
      // Fuerza texto plano en hours_*_open/close para que Sheets nunca las
      // vuelva a auto-convertir a tipo Hora (ver nota en action_configRead_).
      if (/^hours_.*_(open|close)$/.test(key)) range.setNumberFormat('@');
      range.setValue(payload[key]);
    });
    logAudit_(user.email, 'config.update', 'CONFIG', 'default', before, payload);
    return { ok: true };
  });
}

/**
 * Cotización de envío en vivo, antes de confirmar el pedido — el checkout la
 * llama cada vez que el pin de dirección queda en estado 'ok'/'approx' para
 * mostrar el costo antes de pagar. No crea nada, no requiere sesión; el
 * cálculo real y autoritativo se repite en action_orderCreate_ (nunca se
 * confía en lo que haya mostrado el cliente).
 */
function action_deliveryQuote_(payload) {
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);
  if (!lat || !lng) throw new Error('Faltan coordenadas');

  const config = action_configRead_().config;
  if (!config.delivery_enabled) return { available: false, reason: 'disabled' };

  const branches = readSheetAsObjects_('SUCURSALES');
  const branch = branches.find((b) => b.branch_id === payload.branch_id) || branches[0];
  if (!branch || !branch.latitude || !branch.longitude) return { available: false, reason: 'no_branch' };

  const km = distanceKm_(Number(branch.latitude), Number(branch.longitude), lat, lng);
  const tariff = resolveDeliveryTariff_(km, config);
  if (!tariff.available) return { available: false, reason: 'out_of_range', distance_km: Math.round(km * 10) / 10 };
  return { available: true, cost: tariff.cost, km: tariff.km, distance_km: Math.round(km * 10) / 10 };
}

function action_orderCreate_(payload, sessionId, idToken) {
  checkRateLimit_(sessionId);
  if (payload.clientLoadedAt && (Date.now() - Number(payload.clientLoadedAt)) < MIN_SUBMIT_MS) {
    throw new Error('Solicitud rechazada');
  }

  // El email del cliente nunca se toma del payload declarado por el
  // navegador — solo del token de Google verificado, si vino uno.
  let customerEmail = '';
  if (idToken) {
    const verifiedUser = verifyIdToken_(idToken);
    if (verifiedUser) customerEmail = verifiedUser.email;
  }

  const folio = nextFolio_();
  let deliveryFee = 0;
  let deliveryZone = '';
  let deliveryLat = '';
  let deliveryLng = '';

  if (payload.order_type === 'delivery') {
    const config = action_configRead_().config;
    if (!config.delivery_enabled) throw new Error('La entrega a domicilio no está disponible por el momento — elige recoger en sucursal.');
    const branch = readSheetAsObjects_('SUCURSALES').find((b) => b.branch_id === payload.branch_id);
    const dest = geocodeAddress_(payload.delivery_address);
    if (dest) { deliveryLat = dest.lat; deliveryLng = dest.lng; }
    if (!branch || !dest || !branch.latitude || !branch.longitude) {
      throw new Error('No se pudo calcular el costo de envío para esa dirección — intenta de nuevo o elige recoger en sucursal.');
    }
    const km = distanceKm_(Number(branch.latitude), Number(branch.longitude), dest.lat, dest.lng);
    const tariff = resolveDeliveryTariff_(km, config);
    if (!tariff.available) throw new Error('Tu dirección está fuera de nuestra zona de entrega — elige recoger en sucursal.');
    deliveryFee = tariff.cost;
    deliveryZone = tariff.km + 'km';
  }

  const subtotal = (payload.items || []).reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);

  const order = {
    order_id: folio,
    created_at: Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    customer_name: payload.customer_name || '',
    customer_phone: payload.customer_phone || '',
    customer_email: customerEmail,
    items: JSON.stringify(payload.items || []),
    subtotal: subtotal,
    delivery_fee: deliveryFee,
    total: subtotal + deliveryFee,
    notes: payload.notes || '',
    order_type: payload.order_type || 'pickup',
    delivery_address: payload.delivery_address || '',
    delivery_zone: deliveryZone,
    delivery_lat: deliveryLat,
    delivery_lng: deliveryLng,
    cash_denomination: payload.cash_denomination || '',
    branch_id: payload.branch_id || '',
    status: 'pendiente',
    driver_id: '',
    driver_lat: '',
    driver_lng: '',
    driver_ping_at: '',
    source: 'sitio',
    whatsapp_sent: false,
    internal_notes: ''
  };

  const headers = ['order_id', 'created_at', 'customer_name', 'customer_phone', 'customer_email', 'items', 'subtotal', 'delivery_fee', 'total', 'notes', 'order_type', 'delivery_address', 'delivery_zone', 'delivery_lat', 'delivery_lng', 'cash_denomination', 'branch_id', 'status', 'driver_id', 'driver_lat', 'driver_lng', 'driver_ping_at', 'source', 'whatsapp_sent', 'internal_notes'];
  appendRow_('PEDIDOS', order, headers);
  logAudit_(payload.customer_email || 'invitado', 'order.create', 'PEDIDOS', folio, null, order);

  return { order_id: folio, delivery_fee: deliveryFee, delivery_zone: deliveryZone, total: order.total };
}

function findOrderRow_(orderId) {
  const sh = sheet_('PEDIDOS');
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('order_id');
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === orderId) return { rowIndex: i + 1, headers, row: values[i] };
  }
  return null;
}

function action_orderUpdateStatus_(payload, user) {
  return withLock_(() => {
    const found = findOrderRow_(payload.order_id);
    if (!found) throw new Error('Pedido no encontrado');
    const sh = sheet_('PEDIDOS');
    const statusCol = found.headers.indexOf('status') + 1;
    const before = found.row[statusCol - 1];
    sh.getRange(found.rowIndex, statusCol).setValue(payload.status);
    logAudit_(user.email, 'order.updateStatus', 'PEDIDOS', payload.order_id, { status: before }, { status: payload.status });
    return { ok: true };
  });
}

function action_orderDelete_(payload, user) {
  return withLock_(() => {
    const found = findOrderRow_(payload.order_id);
    if (!found) throw new Error('Pedido no encontrado');
    const statusCol = found.headers.indexOf('status');
    const status = found.row[statusCol];
    if (status !== 'pendiente' && status !== 'abandonado') {
      throw new Error('Solo se pueden borrar pedidos pendientes o abandonados');
    }
    sheet_('PEDIDOS').deleteRow(found.rowIndex);
    logAudit_(user.email, 'order.delete', 'PEDIDOS', payload.order_id, { status }, null);
    return { ok: true };
  });
}

function action_orderAssignDriver_(payload, user) {
  return withLock_(() => {
    const found = findOrderRow_(payload.order_id);
    if (!found) throw new Error('Pedido no encontrado');
    const sh = sheet_('PEDIDOS');
    const driverCol = found.headers.indexOf('driver_id') + 1;
    sh.getRange(found.rowIndex, driverCol).setValue(payload.driver_id);
    logAudit_(user.email, 'order.assignDriver', 'PEDIDOS', payload.order_id, null, { driver_id: payload.driver_id });
    return { ok: true };
  });
}

function action_driverList_() {
  const rows = readSheetAsObjects_('DRIVERS');
  const active = rows
    .filter((r) => r.active)
    .map((r) => ({ email: String(r.email).toLowerCase(), name: r.name || r.email }));
  return { drivers: active };
}

// Lista completa (activos e inactivos) para la tarjeta "Repartidores" del
// admin — driver.list de arriba solo trae activos, es lo que usa el
// selector de asignación del Kanban y no debe cambiar.
function action_driverListAll_() {
  return { drivers: readSheetAsObjects_('DRIVERS') };
}

function action_driverCreate_(payload, user) {
  return withLock_(() => {
    const email = String(payload.email || '').trim().toLowerCase();
    const name = String(payload.name || '').trim();
    if (!email || !email.includes('@')) throw new Error('Email inválido');
    if (!name) throw new Error('Falta el nombre del repartidor');

    const existing = readSheetAsObjects_('DRIVERS');
    if (existing.some((r) => String(r.email).toLowerCase() === email)) {
      throw new Error('Ya existe un repartidor con ese email');
    }

    appendRow_('DRIVERS', { email: email, name: name, active: true }, ['email', 'name', 'active']);
    logAudit_(user.email, 'driver.create', 'DRIVERS', email, null, { email: email, name: name, active: true });
    return { ok: true, driver: { email: email, name: name, active: true } };
  });
}

function action_driverToggleActive_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('DRIVERS');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const emailCol = headers.indexOf('email');
    const activeCol = headers.indexOf('active') + 1;
    const targetEmail = String(payload.email || '').trim().toLowerCase();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][emailCol]).toLowerCase() === targetEmail) {
        sh.getRange(i + 1, activeCol).setValue(payload.active);
        logAudit_(user.email, 'driver.toggleActive', 'DRIVERS', targetEmail, null, { active: payload.active });
        return { ok: true };
      }
    }
    throw new Error('Repartidor no encontrado');
  });
}

function action_driverMyOrders_(user) {
  const rows = readSheetAsObjects_('PEDIDOS');
  const mine = rows.filter((r) =>
    String(r.driver_id || '').toLowerCase() === user.email &&
    (r.status === 'listo' || r.status === 'en_reparto')
  );
  return { orders: mine };
}

function action_driverMyDeliveries_(user) {
  const rows = readSheetAsObjects_('PEDIDOS');
  const mine = rows.filter((r) =>
    String(r.driver_id || '').toLowerCase() === user.email && r.status === 'entregado'
  );
  return { orders: mine };
}

function action_driverPingLocation_(payload, user) {
  return withLock_(() => {
    const found = findOrderRow_(payload.order_id);
    if (!found) throw new Error('Pedido no encontrado');
    const sh = sheet_('PEDIDOS');
    const latCol = found.headers.indexOf('driver_lat') + 1;
    const lngCol = found.headers.indexOf('driver_lng') + 1;
    const pingCol = found.headers.indexOf('driver_ping_at') + 1;
    sh.getRange(found.rowIndex, latCol).setValue(payload.lat);
    sh.getRange(found.rowIndex, lngCol).setValue(payload.lng);
    sh.getRange(found.rowIndex, pingCol).setValue(new Date().toISOString());
    return { ok: true };
  });
}

function action_orderList_(payload) {
  const rows = readSheetAsObjects_('PEDIDOS');
  const statusFilter = payload && payload.status;
  const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
  return { orders: filtered };
}

function action_orderListMine_(user) {
  const rows = readSheetAsObjects_('PEDIDOS');
  const mine = rows.filter((r) => String(r.customer_email || '').toLowerCase() === user.email);
  return { orders: mine };
}

function action_orderTrackingRead_(payload) {
  const found = findOrderRow_(payload.order_id);
  if (!found) throw new Error('Pedido no encontrado');
  const phoneCol = found.headers.indexOf('customer_phone');
  if (String(found.row[phoneCol]) !== String(payload.customer_phone)) {
    throw new Error('No autorizado');
  }
  const obj = {};
  found.headers.forEach((h, i) => { obj[h] = found.row[i]; });
  return { order: obj };
}

function action_catalogUpdatePrice_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CATALOGO');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('product_id');
    const priceCol = headers.indexOf('price') + 1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === payload.product_id) {
        const before = values[i][priceCol - 1];
        sh.getRange(i + 1, priceCol).setValue(payload.price);
        logAudit_(user.email, 'catalog.updatePrice', 'CATALOGO', payload.product_id, { price: before }, { price: payload.price });
        return { ok: true };
      }
    }
    throw new Error('Producto no encontrado');
  });
}

function action_catalogUpdateDetails_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CATALOGO');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('product_id');
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === payload.product_id) {
        const before = {};
        const after = {};
        ['name', 'category_id', 'category', 'price', 'short_description'].forEach((field) => {
          if (payload[field] === undefined) return;
          const col = headers.indexOf(field) + 1;
          if (col <= 0) return;
          before[field] = values[i][col - 1];
          after[field] = payload[field];
          sh.getRange(i + 1, col).setValue(payload[field]);
        });
        logAudit_(user.email, 'catalog.updateDetails', 'CATALOGO', payload.product_id, before, after);
        return { ok: true };
      }
    }
    throw new Error('Producto no encontrado');
  });
}

function action_catalogApprovePrice_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CATALOGO');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('product_id');
    const col = headers.indexOf('requiresValidation') + 1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === payload.product_id) {
        sh.getRange(i + 1, col).setValue(false);
        logAudit_(user.email, 'catalog.approvePrice', 'CATALOGO', payload.product_id, { requiresValidation: true }, { requiresValidation: false });
        return { ok: true };
      }
    }
    throw new Error('Producto no encontrado');
  });
}

function action_catalogToggleAvailability_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CATALOGO');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('product_id');
    const col = headers.indexOf('active') + 1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === payload.product_id) {
        sh.getRange(i + 1, col).setValue(payload.active);
        logAudit_(user.email, 'catalog.toggleAvailability', 'CATALOGO', payload.product_id, null, { active: payload.active });
        return { ok: true };
      }
    }
    throw new Error('Producto no encontrado');
  });
}

// Antojos del Home ("Favoritos de la Casa") se limitan a máx. 3 / mín. 1 —
// validado aquí también porque el botón del admin no es la única puerta
// (dos pestañas abiertas, o una llamada directa a la API, no deben poder
// dejar la sección en 0 ni en 4+).
function action_catalogToggleFeatured_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CATALOGO');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('product_id');
    const col = headers.indexOf('featured') + 1;
    const currentCount = values.slice(1).filter((row) => row[col - 1] === true).length;
    let rowIndex = -1;
    let wasFeatured = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === payload.product_id) {
        rowIndex = i;
        wasFeatured = values[i][col - 1] === true;
        break;
      }
    }
    if (rowIndex === -1) throw new Error('Producto no encontrado');

    if (payload.featured && !wasFeatured && currentCount >= 3) {
      throw new Error('Ya hay 3 antojos activos. Desactiva uno antes de agregar otro.');
    }
    if (!payload.featured && wasFeatured && currentCount <= 1) {
      throw new Error('Debe quedar al menos 1 antojo activo.');
    }

    sh.getRange(rowIndex + 1, col).setValue(payload.featured);
    logAudit_(user.email, 'catalog.toggleFeatured', 'CATALOGO', payload.product_id, { featured: wasFeatured }, { featured: payload.featured });
    return { ok: true };
  });
}

function action_catalogSeed_(payload, user) {
  return withLock_(() => {
    const products = payload.products || [];
    if (!products.length) throw new Error('Sin productos que precargar');
    const headers = ['product_id', 'category_id', 'category', 'name', 'short_description', 'description', 'price', 'image', 'active', 'featured', 'sort_order', 'tags', 'options', 'extras', 'branch_id', 'requiresValidation'];
    const sh = sheet_('CATALOGO');
    const existingIds = readSheetAsObjects_('CATALOGO').map((r) => r.product_id);
    let added = 0;
    products.forEach((p) => {
      if (existingIds.indexOf(p.product_id) !== -1) return;
      const row = headers.map((h) => {
        const v = p[h];
        if (v === undefined || v === null) return '';
        return Array.isArray(v) ? JSON.stringify(v) : v;
      });
      sh.appendRow(row);
      added++;
    });
    logAudit_(user.email, 'catalog.seed', 'CATALOGO', 'bulk', null, { added: added });
    return { ok: true, added: added };
  });
}

function action_catalogCreate_(payload, user) {
  return withLock_(() => {
    const name = String(payload.name || '').trim();
    const categoryId = String(payload.category_id || '').trim();
    const category = String(payload.category || '').trim();
    const price = Number(payload.price);
    if (!name) throw new Error('Falta el nombre del platillo');
    if (!categoryId || !category) throw new Error('Falta la categoría');
    if (!price || price <= 0) throw new Error('Precio inválido');

    const headers = ['product_id', 'category_id', 'category', 'name', 'short_description', 'description', 'price', 'image', 'active', 'featured', 'sort_order', 'tags', 'options', 'extras', 'branch_id', 'requiresValidation'];
    const existing = readSheetAsObjects_('CATALOGO');
    const existingIds = existing.map((r) => r.product_id);

    const baseSlug = slugify_(name);
    if (!baseSlug) throw new Error('Nombre inválido');
    let productId = baseSlug;
    let suffix = 2;
    while (existingIds.indexOf(productId) !== -1) {
      productId = baseSlug + '-' + suffix;
      suffix++;
    }

    const sameCategory = existing.filter((r) => r.category_id === categoryId);
    const maxSort = sameCategory.reduce((max, r) => Math.max(max, Number(r.sort_order) || 0), 0);

    const product = {
      product_id: productId,
      category_id: categoryId,
      category: category,
      name: name,
      short_description: String(payload.short_description || ''),
      description: String(payload.description || ''),
      price: price,
      image: String(payload.image || ''),
      active: true,
      featured: false,
      sort_order: maxSort + 1,
      tags: [],
      options: [],
      extras: [],
      branch_id: payload.branch_id || (existing.length ? existing[0].branch_id : 'morelia-san-juanito'),
      requiresValidation: true
    };

    const sh = sheet_('CATALOGO');
    const row = headers.map((h) => {
      const v = product[h];
      return Array.isArray(v) ? JSON.stringify(v) : v;
    });
    sh.appendRow(row);

    logAudit_(user.email, 'catalog.create', 'CATALOGO', productId, null, product);
    return { ok: true, product: product };
  });
}

function action_catalogDelete_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CATALOGO');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('product_id');
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === payload.product_id) {
        const before = {};
        headers.forEach((h, colIdx) => { before[h] = values[i][colIdx]; });
        sh.deleteRow(i + 1);
        logAudit_(user.email, 'catalog.delete', 'CATALOGO', payload.product_id, before, null);
        return { ok: true };
      }
    }
    throw new Error('Producto no encontrado');
  });
}

const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB decoded — el cliente redimensiona/comprime antes de mandar
const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function action_catalogUploadPhoto_(payload, user) {
  return withLock_(() => {
    if (!payload.product_id || !payload.base64Data) throw new Error('Falta product_id o imagen');
    const mimeType = payload.mimeType || 'image/jpeg';
    if (ALLOWED_PHOTO_MIME_TYPES.indexOf(mimeType) === -1) throw new Error('Formato de imagen no permitido');

    const bytes = Utilities.base64Decode(payload.base64Data);
    if (bytes.length > MAX_PHOTO_BYTES) throw new Error('Imagen demasiado pesada (máx 3MB)');

    const sh = sheet_('CATALOGO');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('product_id');
    const imgCol = headers.indexOf('image') + 1;
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === payload.product_id) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) throw new Error('Producto no encontrado');

    const folder = getOrCreateFolderPath_(['laTapatia', 'imagenes', 'catalogo']);

    const blob = Utilities.newBlob(bytes, mimeType, payload.product_id + '-' + Date.now());
    const file = folder.createFile(blob);
    Drive.Permissions.create({ role: 'reader', type: 'anyone' }, file.getId());
    const imageUrl = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000';

    sh.getRange(rowIndex, imgCol).setValue(imageUrl);
    logAudit_(user.email, 'catalog.uploadPhoto', 'CATALOGO', payload.product_id, null, { image: imageUrl });
    return { ok: true, imageUrl: imageUrl };
  });
}

function action_clientGetProfile_(user) {
  const rows = readSheetAsObjects_('CLIENTES');
  const match = rows.find((r) => String(r.email).toLowerCase() === user.email);
  return { profile: match || null };
}

function action_clientUpsertProfile_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CLIENTES');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const emailCol = headers.indexOf('email');
    const now = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][emailCol]).toLowerCase() === user.email) {
        headers.forEach((h, colIdx) => {
          if (h === 'name' || h === 'phone' || h === 'address' || h === 'address_reference') {
            if (payload[h] !== undefined) sh.getRange(i + 1, colIdx + 1).setValue(payload[h]);
          }
          if (h === 'updated_at') sh.getRange(i + 1, colIdx + 1).setValue(now);
        });
        return { ok: true, created: false };
      }
    }
    appendRow_('CLIENTES', {
      email: user.email,
      name: payload.name || user.name,
      phone: payload.phone || '',
      address: payload.address || '',
      address_reference: payload.address_reference || '',
      marketing_opt_in: false,
      created_at: now,
      updated_at: now
    }, ['email', 'name', 'phone', 'address', 'address_reference', 'marketing_opt_in', 'created_at', 'updated_at']);
    return { ok: true, created: true };
  });
}

function action_clientOptInMarketing_(payload, user) {
  return withLock_(() => {
    const sh = sheet_('CLIENTES');
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const emailCol = headers.indexOf('email');
    const optCol = headers.indexOf('marketing_opt_in') + 1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][emailCol]).toLowerCase() === user.email) {
        sh.getRange(i + 1, optCol).setValue(!!payload.optIn);
        return { ok: true };
      }
    }
    throw new Error('Perfil de cliente no encontrado — llama client.upsertProfile primero');
  });
}

/**
 * Directorio completo de CLIENTES para el admin (STAFF-only) — a diferencia
 * de client.getProfile (self-service, un cliente solo ve su propio perfil)
 * y de analytics.read (solo top 5 por gasto). Reemplaza tener que abrir el
 * Sheet directo para consultar clientes.
 */
function action_clientListAll_() {
  const clients = readSheetAsObjects_('CLIENTES');
  const orders = readSheetAsObjects_('PEDIDOS').filter((o) => o.status !== 'cancelado' && o.status !== 'abandonado');

  const statsByEmail = {};
  orders.forEach((o) => {
    const email = String(o.customer_email || '').toLowerCase();
    if (!email) return;
    if (!statsByEmail[email]) statsByEmail[email] = { orders: 0, spend: 0, lastOrderAt: '' };
    statsByEmail[email].orders += 1;
    statsByEmail[email].spend += Number(o.total || 0);
    if (!statsByEmail[email].lastOrderAt || String(o.created_at) > String(statsByEmail[email].lastOrderAt)) {
      statsByEmail[email].lastOrderAt = o.created_at;
    }
  });

  const merged = clients.map((c) => {
    const email = String(c.email || '').toLowerCase();
    const stats = statsByEmail[email] || { orders: 0, spend: 0, lastOrderAt: '' };
    return {
      email: c.email || '',
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      address_reference: c.address_reference || '',
      marketing_opt_in: !!c.marketing_opt_in,
      created_at: c.created_at || '',
      orders: stats.orders,
      spend: stats.spend,
      last_order_at: stats.lastOrderAt
    };
  });

  return { clients: merged };
}

/** Historial de pedidos de un cliente puntual (STAFF-only), para el panel de detalle de admin/clientes. */
function action_clientOrders_(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) throw new Error('Falta email');
  const rows = readSheetAsObjects_('PEDIDOS').filter((o) => String(o.customer_email || '').toLowerCase() === email);
  rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return { orders: rows.slice(0, 20) };
}

function action_incidentReport_(payload, user) {
  appendRow_('INCIDENCIAS', {
    timestamp: Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    order_id: payload.order_id,
    driver_email: user.email,
    reason: payload.reason,
    resolved: false
  }, ['timestamp', 'order_id', 'driver_email', 'reason', 'resolved']);
  return { ok: true };
}

function action_analyticsRead_(payload) {
  const orders = readSheetAsObjects_('PEDIDOS').filter((o) => o.status !== 'cancelado' && o.status !== 'abandonado');
  const clients = readSheetAsObjects_('CLIENTES');
  const range = (payload && payload.range) || '30d';
  const isAllTime = range === 'all';
  const rangeDays = { today: 1, week: 7, '30d': 30 }[range] || 30;
  const cutoff = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
  const inRange = isAllTime ? orders : orders.filter((o) => new Date(o.created_at) >= cutoff);

  const deliveryOrders = inRange.filter((o) => o.order_type === 'delivery');
  const withPin = deliveryOrders.filter((o) => o.delivery_lat && o.delivery_lng);

  const zoneStats = {};
  ['Z1', 'Z2', 'Z3'].forEach((z) => { zoneStats[z] = { zone: z, orders: 0, revenue: 0 }; });
  deliveryOrders.forEach((o) => {
    const z = zoneStats[o.delivery_zone];
    if (z) { z.orders += 1; z.revenue += Number(o.total || 0); }
  });
  Object.values(zoneStats).forEach((z) => { z.avgTicket = z.orders ? Math.round(z.revenue / z.orders) : 0; });

  const byClient = {};
  inRange.forEach((o) => {
    if (!o.customer_email) return;
    if (!byClient[o.customer_email]) byClient[o.customer_email] = { email: o.customer_email, orders: 0, spend: 0 };
    byClient[o.customer_email].orders += 1;
    byClient[o.customer_email].spend += Number(o.total || 0);
  });
  const topClients = Object.values(byClient)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)
    .map((c) => {
      const profile = clients.find((cl) => String(cl.email).toLowerCase() === c.email);
      return { email: c.email, name: (profile && profile.name) || c.email, orders: c.orders, spend: c.spend };
    });

  const hourly = new Array(24).fill(0);
  inRange.forEach((o) => {
    const h = new Date(o.created_at).getHours();
    if (!isNaN(h)) hourly[h] += 1;
  });

  const points = withPin.map((o) => ({ lat: Number(o.delivery_lat), lng: Number(o.delivery_lng), total: Number(o.total || 0) }));

  const revenue = inRange.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const recurringEmails = Object.values(byClient).filter((c) => c.orders > 1).length;
  const totalClientsInRange = Object.keys(byClient).length;

  return {
    range_days: isAllTime ? null : rangeDays,
    kpis: {
      total_orders: inRange.length,
      delivery_orders: deliveryOrders.length,
      delivery_orders_with_pin: withPin.length,
      delivery_pin_rate: deliveryOrders.length ? Math.round((withPin.length / deliveryOrders.length) * 100) : 0,
      revenue: revenue,
      avg_ticket: inRange.length ? Math.round(revenue / inRange.length) : 0,
      recurring_client_rate: totalClientsInRange ? Math.round((recurringEmails / totalClientsInRange) * 100) : 0
    },
    zones: Object.values(zoneStats),
    top_clients: topClients,
    hourly_demand: hourly,
    points: points
  };
}

// TODO (fuera del scaffolding inicial, se completa en un pase de CRM):
// action_campaignSendEmail_

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const PUBLIC_ACTIONS = ['catalog.read', 'config.read', 'order.create', 'order.trackingRead', 'geo.reverseGeocode', 'geo.search', 'delivery.quote'];

function route_(action, payload, idToken, sessionId) {
  switch (action) {
    case 'catalog.read': return action_catalogRead_();
    case 'config.read': return action_configRead_();
    case 'order.create': return action_orderCreate_(payload, sessionId, idToken);
    case 'order.trackingRead': return action_orderTrackingRead_(payload);
    case 'geo.reverseGeocode': return action_geoReverseGeocode_(payload);
    case 'geo.search': return action_geoSearch_(payload);
    case 'delivery.quote': return action_deliveryQuote_(payload);
    case 'order.listMine': return action_orderListMine_(requireRole_(idToken, 'ANY'));
    case 'client.getProfile': return action_clientGetProfile_(requireRole_(idToken, 'ANY'));

    case 'catalog.readAll': return action_catalogReadAll_(requireRole_(idToken, 'STAFF'));
    case 'config.update': return action_configUpdate_(payload, requireRole_(idToken, 'STAFF'));
    case 'analytics.read': return action_analyticsRead_(payload, requireRole_(idToken, 'ADDV'));
    case 'order.list': return action_orderList_(payload, requireRole_(idToken, 'STAFF'));
    case 'order.updateStatus': return action_orderUpdateStatus_(payload, requireAnyRole_(idToken, ['STAFF', 'DRIVERS']));
    case 'order.delete': return action_orderDelete_(payload, requireRole_(idToken, 'STAFF'));
    case 'order.assignDriver': return action_orderAssignDriver_(payload, requireRole_(idToken, 'STAFF'));
    case 'driver.list': return action_driverList_(requireRole_(idToken, 'STAFF'));
    case 'driver.listAll': return action_driverListAll_(requireRole_(idToken, 'STAFF'));
    case 'driver.create': return action_driverCreate_(payload, requireRole_(idToken, 'STAFF'));
    case 'driver.toggleActive': return action_driverToggleActive_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.updatePrice': return action_catalogUpdatePrice_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.updateDetails': return action_catalogUpdateDetails_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.approvePrice': return action_catalogApprovePrice_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.toggleAvailability': return action_catalogToggleAvailability_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.toggleFeatured': return action_catalogToggleFeatured_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.seed': return action_catalogSeed_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.create': return action_catalogCreate_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.uploadPhoto': return action_catalogUploadPhoto_(payload, requireRole_(idToken, 'STAFF'));
    case 'catalog.delete': return action_catalogDelete_(payload, requireRole_(idToken, 'STAFF'));
    case 'client.listAll': return action_clientListAll_(requireRole_(idToken, 'STAFF'));
    case 'client.orders': return action_clientOrders_(payload, requireRole_(idToken, 'STAFF'));

    case 'driver.myOrders': return action_driverMyOrders_(requireRole_(idToken, 'DRIVERS'));
    case 'driver.myDeliveries': return action_driverMyDeliveries_(requireRole_(idToken, 'DRIVERS'));
    case 'driver.pingLocation': return action_driverPingLocation_(payload, requireRole_(idToken, 'DRIVERS'));
    case 'incident.report': return action_incidentReport_(payload, requireRole_(idToken, 'DRIVERS'));

    case 'client.upsertProfile': return action_clientUpsertProfile_(payload, requireRole_(idToken, 'ANY'));
    case 'client.optInMarketing': return action_clientOptInMarketing_(payload, requireRole_(idToken, 'ANY'));

    default:
      throw new Error('Acción no reconocida: ' + action);
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (!PUBLIC_ACTIONS.includes(action)) throw new Error('Acción no permitida por GET');
    const result = route_(action, e.parameter, null, e.parameter.sessionId);
    return jsonResponse_({ ok: true, data: result });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const result = route_(body.action, body.payload || {}, body.idToken, body.sessionId);
    return jsonResponse_({ ok: true, data: result });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}
