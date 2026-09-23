import { test, expect } from '@playwright/test';

test.describe('Sucursal / Ubicación — mobile', () => {
  test('ubicación muestra dirección oficial y CTAs 44px', async ({ page }) => {
    await page.goto('/ubicacion/');
    await expect(page).toHaveTitle(/Ubicación/);
    await expect(page.locator('h1')).toContainText(/Visítanos en Morelia/);
    await expect(page.locator('body')).toContainText(/Av\. San Juanito Itzicuaro 171/);
    const mapsLink = page.locator('#maps-link');
    const waLink = page.locator('#whatsapp-link');
    await expect(mapsLink).toBeVisible();
    await expect(waLink).toBeVisible();
    // Links deben apuntar a URLs correctas desde site.js
    await expect(mapsLink).toHaveAttribute('href', /maps\.app\.goo\.gl|google\.com\/maps/);
    await expect(waLink).toHaveAttribute('href', /wa\.me\/524433288181/);
    const box1 = await mapsLink.boundingBox();
    const box2 = await waLink.boundingBox();
    expect(box1.height).toBeGreaterThanOrEqual(44);
    expect(box2.height).toBeGreaterThanOrEqual(44);
    // Horario placeholder visible (requiresValidation: true)
    await expect(page.locator('#schedule-text')).toContainText(/Horario por confirmar/);
  });

  test('home muestra sucursal y navegación mobile bottom nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText(/La Tapatía Ahogadas/);
    // Aviso de servicio visible
    await expect(page.locator('aside')).toContainText(/Morelia/);
    // Bottom nav debe ser visible en mobile (4 items)
    const nav = page.locator('nav.fixed.bottom-0');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a')).toHaveCount(4);
    // Botón cuenta en header
    await expect(page.locator('a[aria-label="Mi cuenta"]')).toBeVisible();
    // Hero CTAs touch
    const cta = page.locator('#whatsapp-hero-cta');
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('contacto accesible desde home y con links sociales', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a[aria-label*="Facebook"]')).toBeVisible();
    await expect(page.locator('footer a[aria-label*="TikTok"]')).toBeVisible();
    await page.goto('/contacto/');
    // contacto debe existir (aunque sea placeholder)
    await expect(page).toHaveURL(/contacto/);
    // No debe tener claims inventados (verifica que no haya precio falso)
    const body = await page.content();
    // No debe prometer entrega gratuita inventada
    expect(body).not.toMatch(/envío gratis sin condiciones/i);
  });

  test('meta SEO y PWA presentes en mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
    expect(themeColor).toBeTruthy();
    const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
    expect(ogLocale).toBe('es_MX');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
  });
});
