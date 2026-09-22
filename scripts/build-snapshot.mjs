#!/usr/bin/env node
/**
 * Regenera data/catalog.json a partir del Apps Script Web App (catalog.read +
 * config.read). Si SITE_CONFIG.appsScript.webAppUrl aún no está configurado
 * (proyecto sin desplegar todavía), no falla el build: deja el snapshot
 * existente tal cual y avisa por consola. También actualiza el lastmod del
 * sitemap.xml a la fecha del build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const configPath = path.join(root, 'src/config/site.js');
const catalogPath = path.join(root, 'data/catalog.json');
const sitemapPath = path.join(root, 'sitemap.xml');

function readWebAppUrl() {
  const src = fs.readFileSync(configPath, 'utf8');
  const match = src.match(/webAppUrl:\s*['"]([^'"]*)['"]/);
  return match ? match[1] : '';
}

async function main() {
  const webAppUrl = readWebAppUrl();

  if (!webAppUrl) {
    console.warn('[build-snapshot] appsScript.webAppUrl vacío — se conserva data/catalog.json existente sin cambios.');
  } else {
    try {
      const [catalogRes, configRes] = await Promise.all([
        fetch(`${webAppUrl}?action=catalog.read`).then((r) => r.json()),
        fetch(`${webAppUrl}?action=config.read`).then((r) => r.json())
      ]);
      if (!catalogRes.ok) throw new Error(catalogRes.error || 'catalog.read falló');

      const snapshot = {
        generated_at: new Date().toISOString(),
        branch_id: 'morelia-san-juanito',
        products: catalogRes.data.products,
        config: configRes.ok ? configRes.data.config : null
      };
      fs.writeFileSync(catalogPath, JSON.stringify(snapshot, null, 2));
      console.log(`[build-snapshot] data/catalog.json actualizado (${snapshot.products.length} productos).`);
    } catch (err) {
      console.error('[build-snapshot] Error al leer Apps Script, se conserva snapshot existente:', err.message);
    }
  }

  if (fs.existsSync(sitemapPath)) {
    const today = new Date().toISOString().slice(0, 10);
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    if (!xml.includes('<lastmod>')) {
      xml = xml.replace(/<\/loc>/g, `</loc>\n    <lastmod>${today}</lastmod>`);
    } else {
      xml = xml.replace(/<lastmod>.*?<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
    }
    fs.writeFileSync(sitemapPath, xml);
    console.log('[build-snapshot] sitemap.xml lastmod actualizado a', today);
  }
}

main();
