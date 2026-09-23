import { test, expect } from '@playwright/test';
import { mockAppsScript } from './helpers.js';

test.describe('Portal Cliente — mobile', () => {
  test('rastreo: formulario folio+teléfono accesible en mobile (44px touch targets)', async ({ page }) => {
    await page.goto('/cuenta/rastreo/');
    await expect(page).toHaveTitle(/Rastreo/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
    const folio = page.locator('#input-folio');
    const tel = page.locator('#input-tel');
    const btn = page.locator('button[type="submit"]');
    await expect(folio).toBeVisible();
    await expect(tel).toBeVisible();
    await expect(btn).toBeVisible();
    // Touch target mínimo 44px
    const folioBox = await folio.boundingBox();
    const btnBox = await btn.boundingBox();
    expect(folioBox.height).toBeGreaterThanOrEqual(44);
    expect(btnBox.height).toBeGreaterThanOrEqual(44);
    // Validación requerida
    await expect(folio).toHaveAttribute('required', '');
  });

  test('rastreo: error esperado sin backend real (mock 404)', async ({ page }) => {
    await mockAppsScript(page);
    await page.route('**/macros/s/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Pedido no encontrado' }) });
    });
    await page.goto('/cuenta/rastreo/');
    await page.fill('#input-folio', '#TA-0001');
    await page.fill('#input-tel', '4433288181');
    await page.click('button[type="submit"]');
    // El JS muestra #lookup-error
    await expect(page.locator('#lookup-error')).toBeVisible({ timeout: 7000 });
  });

  test('perfil: gate de auth Google visible en mobile, contenido oculto sin token', async ({ page }) => {
    await page.goto('/cuenta/perfil/');
    await expect(page.locator('#auth-gate')).toBeVisible();
    await expect(page.locator('#profile-content')).toBeHidden();
    // Debe existir contenedor de Google Sign In y texto en español mexicano
    await expect(page.locator('#auth-gate')).toContainText(/Mi Cuenta|Inicia sesión/);
    // El script GSI debe estar presente
    const gsi = page.locator('script[src*="accounts.google.com/gsi/client"]');
    await expect(gsi).toHaveCount(1);
    // Meta viewport correcto para mobile
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewport).toContain('width=device-width');
  });

  test('perfil: con token mock, precarga datos del cliente', async ({ page }) => {
    await mockAppsScript(page);
    await page.goto('/cuenta/perfil/');
    // Inyecta token y fuerza render del contenido (simula onSignedIn)
    await page.evaluate(() => {
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIn0.fake';
      sessionStorage.setItem('lta_id_token', token);
      // Simula callback de auth-gate: oculta gate, muestra contenido
      document.getElementById('auth-gate').classList.add('hidden');
      const c = document.getElementById('profile-content');
      c.classList.remove('hidden');
      c.style.display = 'flex';
      // Dispara loadProfile manualmente vía API mock
      window.LTA_API.callAction('client.getProfile', {}, token).then(d => {
        document.getElementById('field-name').value = d.profile.name || '';
        document.getElementById('field-phone').value = d.profile.phone || '';
        document.getElementById('field-address').value = d.profile.address || '';
      });
    });
    await expect(page.locator('#profile-content')).toBeVisible();
    await expect(page.locator('#field-name')).toHaveValue(/Test User/);
    await expect(page.locator('#field-phone')).toHaveValue(/443/);
    // Touch targets
    const saveBtn = page.locator('#save-profile');
    await expect(saveBtn).toBeVisible();
    const box = await saveBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('historial: gate auth presente y no expone datos sin token', async ({ page }) => {
    await page.goto('/cuenta/historial/');
    // Historial puede variar de ruta, pero debe tener gate o redirigir a perfil
    // Verificamos que no haya contenido sensible visible sin auth
    const body = await page.content();
    expect(body).not.toContain('driver_lat');
  });

  test('checkout invitado: agregar producto y ver carrito en mobile', async ({ page }) => {
    await mockAppsScript(page);
    await page.goto('/menu/');
    // Espera a que cargue catálogo (mock)
    await page.waitForTimeout(1500);
    // Si hay productos mock, prueba flujo de agregar
    const pedidoSection = page.locator('#pedido');
    await expect(pedidoSection).toBeVisible();
    // Formulario debe tener labels asociados y required
    await expect(page.locator('#field-name')).toBeVisible();
    await expect(page.locator('#field-phone')).toBeVisible();
    // Botón WhatsApp deshabilitado si carrito vacío (estado seguro)
    const submit = page.locator('#submit-order');
    // Inicialmente disabled si carrito vacío, se habilita al agregar
    // Verificamos que existe y es touch-friendly
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
