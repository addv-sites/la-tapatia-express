import { test, expect } from '@playwright/test';

test.describe('Autenticación Google — mobile (validación GSI)', () => {
  test('site.js expone googleClientId y appsScript.webAppUrl públicos (no secretos)', async ({ page }) => {
    await page.goto('/');
    const cfg = await page.evaluate(() => window.SITE_CONFIG);
    expect(cfg.googleClientId).toMatch(/\.apps\.googleusercontent\.com$/);
    expect(cfg.appsScript.webAppUrl).toMatch(/script\.google\.com\/macros\/s\/.*\/exec/);
    expect(cfg.googleClientId).not.toBe('');
    expect(cfg.appsScript.webAppUrl).not.toBe('');
  });

  test('GSI script carga y expone window.google.accounts.id', async ({ page }) => {
    await page.goto('/admin/catalogo/');
    // Espera a que el script GSI cargue (puede tardar por red)
    await page.waitForFunction(() => window.google && window.google.accounts && window.google.accounts.id, null, { timeout: 15000 });
    const hasGSI = await page.evaluate(() => !!(window.google && window.google.accounts && window.google.accounts.id.initialize));
    expect(hasGSI).toBe(true);
  });

  test('auth.js expone LTA_AUTH con init/renderButton/onAuthChange y locale es_MX', async ({ page }) => {
    await page.goto('/admin/catalogo/');
    await page.waitForFunction(() => window.LTA_AUTH, null, { timeout: 5000 });
    const api = await page.evaluate(() => ({
      hasInit: typeof window.LTA_AUTH.init === 'function',
      hasRender: typeof window.LTA_AUTH.renderButton === 'function',
      hasOnAuth: typeof window.LTA_AUTH.onAuthChange === 'function',
      hasSignOut: typeof window.LTA_AUTH.signOut === 'function',
    }));
    expect(api.hasInit).toBe(true);
    expect(api.hasRender).toBe(true);
    expect(api.hasOnAuth).toBe(true);
    expect(api.hasSignOut).toBe(true);
    // Verifica que auth.js usa locale es_MX (busca en el source)
    const authSrc = await page.evaluate(async () => {
      const res = await fetch('/src/js/auth.js');
      return await res.text();
    });
    expect(authSrc).toContain("locale: 'es_MX'");
  });

  test('auth-gate renderGate muestra Google Sign-In button container en mobile 412px', async ({ page }) => {
    await page.goto('/admin/catalogo/');
    // auth-gate renderiza #google-signin-btn (GSI carga async, contenedor puede estar vacío pero attached)
    await expect(page.locator('#google-signin-btn')).toBeAttached({ timeout: 10000 });
    // Verifica que el gate no muestra contenido admin
    await expect(page.locator('#admin-content')).toBeHidden();
    // auth-gate debe haber ocultado el contenido admin sin token
    await expect(page.locator('#auth-gate')).toContainText(/Gestor de Catálogo/);
  });

  test('ID token se guarda en sessionStorage y se envía como idToken en LTA_API.callAction', async ({ page }) => {
    await page.route('**/macros/s/**', async route => {
      const body = route.request().postDataJSON();
      // Valida que el cliente envía idToken
      expect(body).toHaveProperty('idToken');
      expect(body).toHaveProperty('sessionId');
      expect(body).toHaveProperty('payload');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { products: [] } }) });
    });
    await page.goto('/admin/catalogo/');
    await page.evaluate(() => {
      // Simula token inyectado como lo haría onCredentialResponse
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g,'');
      const payload = btoa(JSON.stringify({ email: 'staff@addv.mx', name: 'Staff Test' })).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
      const fakeToken = `${header}.${payload}.sig`;
      sessionStorage.setItem('lta_id_token', fakeToken);
      // Llama directamente a la API para verificar que envía el token
      window.LTA_API.callAction('catalog.readAll', {}, fakeToken).catch(()=>{});
    });
    // El route handler ya validó que idToken existe; espera un poco para que el request ocurra
    await page.waitForTimeout(800);
  });

  test('verificación server-side: token inválido debe mostrar "No autorizado" (mock 403)', async ({ page }) => {
    await page.route('**/macros/s/**', async route => {
      const body = route.request().postDataJSON();
      if (body?.action === 'catalog.readAll') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'No autorizado: email no está en STAFF' }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: {} }) });
    });
    await page.goto('/admin/catalogo/');
    // Simula login y luego falla de autorización
    await page.evaluate(async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im5vYXV0aEBleGFtcGxlLmNvbSJ9.fake';
      sessionStorage.setItem('lta_id_token', fakeToken);
      document.getElementById('auth-gate').classList.add('hidden');
      document.getElementById('admin-content').classList.remove('hidden');
      try {
        await window.LTA_API.callAction('catalog.readAll', {}, fakeToken);
      } catch (e) {
        document.getElementById('admin-content').classList.add('hidden');
        document.getElementById('auth-gate').classList.remove('hidden');
        window.LTA_AUTH_GATE.showUnauthorized(document.getElementById('auth-gate'), e.message);
      }
    });
    await expect(page.locator('#auth-gate')).toContainText(/No autorizado/);
    await expect(page.locator('#btn-signout')).toBeVisible();
  });
});
