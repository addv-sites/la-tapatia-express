export async function mockAppsScript(page) {
  // Mock all calls to Apps Script Web App (script.google.com)
  await page.route('**/macros/s/**', async (route) => {
    const req = route.request();
    let action = 'unknown';
    try {
      if (req.method() === 'POST') {
        const body = req.postDataJSON();
        action = body?.action || action;
      } else {
        const url = new URL(req.url());
        action = url.searchParams.get('action') || action;
      }
    } catch {}
    // Respuestas mock según action
    const mocks = {
      'catalog.readAll': { products: [
        { product_id: 'p1', category_id: 'tacos', category: 'Tacos', name: 'Tacos (3 pzas)', price: 50, active: true, requiresValidation: true, featured: true, image: '', short_description: 'Desc', branch_id: 'morelia-san-juanito' },
        { product_id: 'p2', category_id: 'tortas', category: 'Tortas', name: 'Torta sencilla', price: 50, active: true, requiresValidation: false, featured: false, image: '', short_description: 'Desc', branch_id: 'morelia-san-juanito' },
      ]},
      'catalog.read': { products: [
        { product_id: 'p1', category_id: 'tacos', category: 'Tacos', name: 'Tacos (3 pzas)', price: 50, active: true, requiresValidation: false, featured: true, image: '', short_description: 'Desc' },
      ]},
      'order.list': { orders: [] },
      'driver.myOrders': { orders: [] },
      'driver.myDeliveries': { orders: [] },
      'client.getProfile': { profile: { name: 'Test User', phone: '4430000000', address: 'Av. Test 123', address_reference: 'Portón rojo', marketing_opt_in: true, email: 'test@example.com' } },
      'order.listMine': { orders: [] },
      'config.read': { config: {} },
      'analytics.read': { kpis: {} },
    };
    const data = mocks[action] || {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data }),
    });
  });
}

export function fakeGoogleIdToken(email = 'test@addv.mx') {
  // JWT header.payload.signature sin firma válida — solo para decodificar payload en auth.js
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({ email, name: 'Test User', exp: Math.floor(Date.now()/1000)+3600 })).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return `${header}.${payload}.fake-signature`;
}

export async function injectAuth(page, email = 'test@addv.mx') {
  const token = fakeGoogleIdToken(email);
  await page.evaluate(({ t, e }) => {
    localStorage.setItem('lta_id_token', t);
    // Simula que LTA_AUTH ya tiene token
    if (window.LTA_AUTH) {
      // Forzamos listeners
      const fakeProfile = { email: e, name: 'Test User' };
      // Dispara onAuthChange manualmente si hay listeners registrados
      // Creamos token decodificado como lo hace auth.js
      const listeners = [];
      // Si no hay token interno, lo seteamos evaluando auth internals
      window.__injectedToken = t;
    }
  }, { t: token, e: email });
  return token;
}
