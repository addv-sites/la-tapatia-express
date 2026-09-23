/**
 * Configuración central del sitio. Ningún secreto vive aquí — solo datos
 * públicos ya confirmados (buildClaude.md) o endpoints públicos de Apps
 * Script (que no requieren protegerse, ya que la autorización real ocurre
 * server-side vía verificación del ID token de Google).
 */
window.SITE_CONFIG = {
  siteUrl: 'https://addv-sites.github.io/la-tapatia-express', // dominio real de producción (GitHub Pages) — debe coincidir con los Authorized JavaScript origins del OAuth Client ID
  businessName: 'La Tapatía Ahogadas',
  branchId: 'morelia-san-juanito',
  branchName: 'Sucursal Morelia',
  phone: '4433288181',
  whatsapp: '524433288181',
  address: 'Av. San Juanito Itzicuaro 171, Arboledas de Valladolid, Morelia, Michoacán, México.',
  googleMapsUrl: 'https://maps.app.goo.gl/Cb7RmeSY7idKGYyk9?g_st=ic',
  coordinates: {
    // TODO: coordenadas reales confirmadas por el negocio (requiresValidation)
    lat: null,
    lng: null,
    requiresValidation: true
  },
  socialLinks: {
    facebook: 'https://www.facebook.com/Latapatiaahogadas',
    tiktok: 'https://www.tiktok.com/@ahogadas.la.tapat'
  },
  schedule: {
    // TODO: horario real confirmado por el negocio (requiresValidation)
    display: 'Horario por confirmar',
    requiresValidation: true
  },
  analytics: {
    // Placeholders — nunca inventar IDs reales.
    gaMeasurementId: null,
    gtmContainerId: null
  },
  googleClientId: '310299979506-4l63meciq33tdpf3mo0ktooe90pl3kfm.apps.googleusercontent.com', // OAuth 2.0 Client ID (Google Cloud Console, proyecto de ADDV) — no es secreto, es público por diseño de Google Identity Services
  appsScript: {
    // Se llena al desplegar el Web App de Apps Script (ver docs/apps-script-contract.md).
    // Es una URL pública de invocación, no un secreto — la autorización real
    // ocurre server-side verificando el ID token de Google en cada request.
    webAppUrl: 'https://script.google.com/macros/s/AKfycbz8c_YXW2h49oYcImM-nFRWbR8sARP8kWcauiKZ8OwZtZvOBO03q3ipGqpaUbYrsKC4/exec'
  },
  featureFlags: {
    deliveryEnabled: true, // se reconfirma en runtime contra la hoja CONFIG
    pwaInstallPrompt: true,
    guestCheckout: true
  },
  catalogSnapshotPath: '/data/catalog.json'
};
