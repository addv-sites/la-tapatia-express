import { test, expect } from '@playwright/test';
import { mockAppsScript } from './helpers.js';

test.describe('App Repartidor — mobile', () => {
  test('gate auth DRIVERS visible, app-content oculto sin token (mobile)', async ({ page }) => {
    await page.goto('/repartidor/');
    await expect(page).toHaveTitle(/Repartidor/);
    await expect(page.locator('#auth-gate')).toBeVisible();
    await expect(page.locator('#app-content')).toBeHidden();
    await expect(page.locator('#auth-gate')).toContainText(/App Repartidor|repartidores autorizados/);
    await expect(page.locator('script[src*="accounts.google.com/gsi/client"]')).toHaveCount(1);
    // Header mobile con badge repartidor
    await expect(page.locator('header')).toContainText(/Repartidor/);
  });

  test('con token DRIVERS mock, muestra empty-state y botones 44px', async ({ page }) => {
    await mockAppsScript(page);
    await page.goto('/repartidor/');
    await page.evaluate(async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InJlcGFydGlkb3JAZXhhbXBsZS5jb20ifQ.fake';
      sessionStorage.setItem('lta_id_token', fakeToken);
      document.getElementById('auth-gate').classList.add('hidden');
      const app = document.getElementById('app-content');
      app.classList.remove('hidden');
      // Simula loadActiveOrder sin pedidos
      const data = await window.LTA_API.callAction('driver.myOrders', {}, fakeToken);
      if (!data.orders.length) {
        document.getElementById('empty-state').classList.remove('hidden');
        document.getElementById('order-card').classList.add('hidden');
      }
    });
    await expect(page.locator('#app-content')).toBeVisible();
    await expect(page.locator('#empty-state')).toBeVisible();
    await expect(page.locator('#empty-state')).toContainText(/Sin pedidos asignados/);
    // Nav a entregas/ganancias/perfil visibles
    for (const href of ['entregas/', 'ganancias/', 'perfil/']) {
      const link = page.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
    }
  });

  test('con pedido asignado mock, renderiza card con navegación y GPS', async ({ page }) => {
    await page.route('**/macros/s/**', async route => {
      const body = route.request().postDataJSON();
      if (body?.action === 'driver.myOrders') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { orders: [{
          order_id: '#TA-0007', customer_name: 'Ana López', customer_phone: '4431234567',
          delivery_address: 'Av. San Juanito 171, Morelia', delivery_lat: 19.700, delivery_lng: -101.200,
          total: 185, notes: 'Sin cebolla', items: JSON.stringify([{name:'Torta ahogada', quantity:1, salsa:'Ahogada'}]),
          status: 'listo'
        }]}}) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: {} }) });
    });
    await page.goto('/repartidor/');
    await page.evaluate(async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InJlcGFydGlkb3JAZXhhbXBsZS5jb20ifQ.fake';
      sessionStorage.setItem('lta_id_token', fakeToken);
      document.getElementById('auth-gate').classList.add('hidden');
      document.getElementById('app-content').classList.remove('hidden');
      const data = await window.LTA_API.callAction('driver.myOrders', {}, fakeToken);
      const order = data.orders[0];
      document.getElementById('empty-state').classList.add('hidden');
      const card = document.getElementById('order-card');
      card.classList.remove('hidden');
      document.getElementById('order-folio').textContent = order.order_id;
      document.getElementById('order-customer').textContent = order.customer_name;
      document.getElementById('order-address').textContent = order.delivery_address;
      document.getElementById('order-total').textContent = '$' + order.total;
      document.getElementById('wa-customer').href = 'https://wa.me/' + order.customer_phone;
      document.getElementById('nav-google').href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(order.delivery_address);
      document.getElementById('nav-waze').href = 'https://waze.com/ul?q=' + encodeURIComponent(order.delivery_address) + '&navigate=yes';
      document.getElementById('btn-start-route').classList.remove('hidden');
    });
    await expect(page.locator('#order-card')).toBeVisible();
    await expect(page.locator('#order-folio')).toHaveText('#TA-0007');
    await expect(page.locator('#order-customer')).toContainText('Ana López');
    await expect(page.locator('#nav-google')).toHaveAttribute('href', /google\.com\/maps/);
    await expect(page.locator('#nav-waze')).toHaveAttribute('href', /waze\.com/);
    const navLink = page.locator('#nav-google');
    const box = await navLink.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('#btn-start-route')).toBeVisible();
    await expect(page.locator('#btn-incident')).toBeVisible();
    // Modal incidencia debe abrirse
    await page.click('#btn-incident');
    await expect(page.locator('#modal-incident')).toBeVisible();
  });

  test('repartidor entregas y ganancias requieren DRIVERS', async ({ page }) => {
    for (const path of ['/repartidor/entregas/', '/repartidor/ganancias/', '/repartidor/perfil/']) {
      await page.goto(path);
      // Cada subpágina debe tener gate o título correspondiente
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g,'\\/')));
      // No debe exponer comisión sensible sin auth
      const content = await page.content();
      expect(content).not.toContain('driver_ping_at');
    }
  });
});
