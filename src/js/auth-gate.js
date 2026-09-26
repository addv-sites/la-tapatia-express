/**
 * Gate de autenticación para las 3 superficies restringidas (admin STAFF,
 * repartidor DRIVERS, analítica ADDV). Solo obtiene el token de Google en el
 * cliente — la autorización real (whitelist / dominio) la valida Apps Script
 * en cada request. Si el negocio aún no configuró `googleClientId` o
 * `appsScript.webAppUrl`, se muestra un aviso claro en vez de fallar en
 * silencio.
 */
(function () {
  function decodeJwtPayload_(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      return null;
    }
  }

  // Token de relleno con forma de JWT (no firmado) para saltar el botón de
  // Google en localhost — solo pinta la UI ya autenticada. Apps Script sigue
  // verificando criptográficamente el idToken real en cada request, así que
  // esto no da acceso real a datos STAFF/DRIVERS/ADDV, solo evita el login
  // repetido mientras se revisa el diseño en el navegador local.
  function buildLocalDevToken_() {
    const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      email: 'dev@localhost',
      name: 'Dev Local',
      given_name: 'Dev',
      iat: nowSec,
      exp: nowSec + 6 * 3600
    };
    return b64url({ alg: 'none', typ: 'JWT' }) + '.' + b64url(payload) + '.local-dev';
  }

  function isLocalDev_() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }

  function renderGate(container, opts) {
    const cfg = window.SITE_CONFIG;
    container.innerHTML = '';

    if (!cfg.appsScript.webAppUrl || !cfg.googleClientId) {
      container.innerHTML =
        '<div class="max-w-sm mx-auto text-center flex flex-col gap-3 p-6">' +
        '  <h2 class="font-headline-sm text-headline-sm text-on-surface">Backend aún no configurado</h2>' +
        '  <p class="font-body-sm text-body-sm text-on-surface-variant">Falta desplegar Apps Script y/o el Google Client ID en <code>src/config/site.js</code>. Ver README.md.</p>' +
        '</div>';
      return;
    }

    if (isLocalDev_() && !sessionStorage.getItem('lta_id_token')) {
      console.info('[LTA] localhost detectado — se salta el login de Google (LTA_AUTH_GATE.signOut() para forzarlo de nuevo). Las llamadas reales a Apps Script seguirán fallando porque el token no está firmado.');
      sessionStorage.setItem('lta_id_token', buildLocalDevToken_());
    }

    // Sesión ya iniciada en esta pestaña (navegación entre páginas del
    // mismo admin) — evita repintar el botón de Google y pedir login otra
    // vez mientras el idToken siga vigente.
    const storedToken = sessionStorage.getItem('lta_id_token');
    if (storedToken) {
      const profile = decodeJwtPayload_(storedToken);
      const nowSec = Math.floor(Date.now() / 1000);
      if (profile && profile.exp && profile.exp > nowSec) {
        opts.onSignedIn(storedToken, profile);
        return;
      }
      sessionStorage.removeItem('lta_id_token');
    }

    const wrap = document.createElement('div');
    wrap.className = 'max-w-sm mx-auto text-center flex flex-col items-center gap-4 p-6';
    wrap.innerHTML =
      '<h1 class="font-headline-md text-headline-md text-on-surface">' + (opts.title || 'Acceso restringido') + '</h1>' +
      '<p class="font-body-sm text-body-sm text-on-surface-variant">' + (opts.subtitle || 'Inicia sesión con tu cuenta de Google autorizada.') + '</p>' +
      '<div id="google-signin-btn"></div>' +
      '<p id="auth-error" class="font-body-sm text-body-sm text-error hidden"></p>';
    container.appendChild(wrap);

    window.LTA_AUTH.init();
    window.LTA_AUTH.renderButton(document.getElementById('google-signin-btn'));

    window.LTA_AUTH.onAuthChange(({ idToken, profile }) => {
      if (!idToken) return;
      sessionStorage.setItem('lta_id_token', idToken);
      opts.onSignedIn(idToken, profile);
    });
  }

  function signOut() {
    sessionStorage.removeItem('lta_id_token');
    if (window.LTA_AUTH) window.LTA_AUTH.signOut();
    location.reload();
  }

  function wireSignOutButton(el) {
    if (el) el.addEventListener('click', signOut);
  }

  function showUnauthorized(container, message) {
    container.innerHTML =
      '<div class="max-w-sm mx-auto text-center flex flex-col gap-3 p-6">' +
      '  <h2 class="font-headline-sm text-headline-sm text-error">No autorizado</h2>' +
      '  <p class="font-body-sm text-body-sm text-on-surface-variant">' + message + '</p>' +
      '  <button id="btn-signout" class="min-h-[44px] px-4 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">Cerrar sesión</button>' +
      '</div>';
    wireSignOutButton(document.getElementById('btn-signout'));
  }

  window.LTA_AUTH_GATE = { renderGate, showUnauthorized, signOut, wireSignOutButton };
})();
