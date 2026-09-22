/**
 * Gate de autenticación para las 3 superficies restringidas (admin STAFF,
 * repartidor DRIVERS, analítica ADDV). Solo obtiene el token de Google en el
 * cliente — la autorización real (whitelist / dominio) la valida Apps Script
 * en cada request. Si el negocio aún no configuró `googleClientId` o
 * `appsScript.webAppUrl`, se muestra un aviso claro en vez de fallar en
 * silencio.
 */
(function () {
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

  function showUnauthorized(container, message) {
    container.innerHTML =
      '<div class="max-w-sm mx-auto text-center flex flex-col gap-3 p-6">' +
      '  <h2 class="font-headline-sm text-headline-sm text-error">No autorizado</h2>' +
      '  <p class="font-body-sm text-body-sm text-on-surface-variant">' + message + '</p>' +
      '  <button id="btn-signout" class="min-h-[44px] px-4 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">Cerrar sesión</button>' +
      '</div>';
    document.getElementById('btn-signout').addEventListener('click', () => {
      sessionStorage.removeItem('lta_id_token');
      window.LTA_AUTH.signOut();
      location.reload();
    });
  }

  window.LTA_ADMIN_AUTH = { renderGate, showUnauthorized };
})();
