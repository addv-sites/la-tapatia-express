/**
 * Carga el catálogo desde el snapshot estático (data/catalog.json), generado
 * en build-time por scripts/build-snapshot.mjs. Nunca bloquea el LCP: el
 * hero y el layout ya están pintados antes de que esto resuelva.
 */
(function () {
  let cachePromise = null;

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

  function load() {
    if (!cachePromise) {
      cachePromise = fetch(resolveSnapshotPath(), { cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => ({ products: [], config: null }));
    }
    return cachePromise;
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

  window.LTA_CATALOG = { load, formatPrice, byCategory };
})();
