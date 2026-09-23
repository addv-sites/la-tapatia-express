/**
 * Carga el catálogo desde el snapshot estático (data/catalog.json), generado
 * en build-time por scripts/build-snapshot.mjs. Nunca bloquea el LCP: el
 * hero y el layout ya están pintados antes de que esto resuelva.
 */
(function () {
  let cachePromise = null;
  const updateListeners = [];

  function resolveSnapshotPath() {
    const configured = window.SITE_CONFIG.catalogSnapshotPath || '/data/catalog.json';
    if (!configured.startsWith('/')) return configured;
    try {
      const base = new URL(window.SITE_CONFIG.siteUrl).pathname.replace(/\/$/, '');
      return base + configured;
    } catch (e) {
      return configured;
    }
  }

  function loadSnapshot_() {
    return fetch(resolveSnapshotPath(), { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => ({ products: [], config: null }));
  }

  /**
   * Revalidación silenciosa: el snapshot estático pinta rápido (no bloquea el
   * LCP), pero puede tener hasta ~20min de retraso (solo se regenera en cada
   * build). Esto refresca contra Apps Script/Sheets en vivo justo después y
   * avisa a quien se haya suscrito con onUpdate, sin volver a bloquear nada.
   */
  function loadLive_() {
    const url = window.SITE_CONFIG.appsScript && window.SITE_CONFIG.appsScript.webAppUrl;
    if (!url || !window.LTA_API) return Promise.resolve(null);
    return Promise.all([
      window.LTA_API.readAction('catalog.read', {}).catch(() => null),
      window.LTA_API.readAction('config.read', {}).catch(() => null)
    ]).then(([catalogData, configData]) => {
      if (!catalogData) return null;
      return { products: catalogData.products, config: configData ? configData.config : null };
    });
  }

  function load() {
    if (!cachePromise) {
      cachePromise = loadSnapshot_();
      loadLive_().then((liveData) => {
        if (!liveData) return;
        updateListeners.forEach((cb) => cb(liveData));
      });
    }
    return cachePromise;
  }

  /** Se llama cuando llega el refresco en vivo (después del primer pintado con el snapshot). */
  function onUpdate(callback) {
    updateListeners.push(callback);
  }

  function formatPrice(n) {
    return '$' + Number(n).toLocaleString('es-MX') + ' MXN';
  }

  function byCategory(products) {
    const map = new Map();
    products.forEach((p) => {
      if (!map.has(p.category_id)) map.set(p.category_id, { category: p.category, category_id: p.category_id, items: [] });
      map.get(p.category_id).items.push(p);
    });
    return Array.from(map.values());
  }

  window.LTA_CATALOG = { load, onUpdate, formatPrice, byCategory };
})();
