/**
 * Invitación no-bloqueante a iniciar sesión con Google (checkout, portal).
 * Nunca bloquea el flujo — solo se muestra si hay Client ID configurado y no
 * fue descartada en esta sesión.
 */
(function () {
  function render(container, opts) {
    const cfg = window.SITE_CONFIG;
    if (!cfg.googleClientId) { container.hidden = true; return; }
    if (sessionStorage.getItem('lta_signin_dismissed_' + opts.key)) { container.hidden = true; return; }

    container.hidden = false;
    container.innerHTML =
      '<div class="flex items-start justify-between gap-3 p-3 bg-mustard-light/70 rounded-xl">' +
      '  <div class="flex-1">' +
      '    <p class="font-body-sm text-body-sm text-on-secondary-container font-medium mb-2">' + opts.message + '</p>' +
      '    <div id="gsi-btn-' + opts.key + '"></div>' +
      '  </div>' +
      '  <button type="button" class="dismiss-btn text-on-surface-variant p-1" aria-label="Cerrar">' +
      '    <svg class="w-4 h-4" aria-hidden="true"><use href="' + opts.iconBase + 'sprite.svg#icon-close"/></svg>' +
      '  </button>' +
      '</div>';

    container.querySelector('.dismiss-btn').addEventListener('click', () => {
      sessionStorage.setItem('lta_signin_dismissed_' + opts.key, '1');
      container.hidden = true;
    });

    window.LTA_AUTH.init();
    window.LTA_AUTH.renderButton(document.getElementById('gsi-btn-' + opts.key), { size: 'medium' });
    window.LTA_AUTH.onAuthChange(({ idToken, profile }) => {
      if (!idToken) return;
      localStorage.setItem('lta_id_token', idToken);
      container.hidden = true;
      opts.onSignedIn(idToken, profile);
    });
  }

  window.LTA_INLINE_SIGNIN = { render };
})();
