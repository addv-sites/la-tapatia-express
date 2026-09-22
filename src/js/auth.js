/**
 * Envoltura compartida de Google Identity Services (Sign-In).
 * La AUTORIZACIÓN real (whitelist STAFF/DRIVERS, dominio @addv.mx) ocurre
 * server-side en Apps Script verificando el idToken — esto solo obtiene el
 * token del lado del cliente, nunca decide por sí mismo quién tiene acceso.
 */
(function () {
  let currentIdToken = null;
  let currentProfile = null;
  const listeners = [];

  function onCredentialResponse(response) {
    currentIdToken = response.credential;
    currentProfile = decodeJwtPayload_(response.credential);
    listeners.forEach((fn) => fn({ idToken: currentIdToken, profile: currentProfile }));
  }

  function decodeJwtPayload_(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      return null;
    }
  }

  function init() {
    if (!window.SITE_CONFIG.googleClientId) return;
    if (!window.google || !window.google.accounts) return;
    window.google.accounts.id.initialize({
      client_id: window.SITE_CONFIG.googleClientId,
      callback: onCredentialResponse,
      auto_select: false
    });
  }

  function renderButton(container, options) {
    if (!window.google || !window.google.accounts) return;
    window.google.accounts.id.renderButton(container, Object.assign({
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      locale: 'es_MX'
    }, options || {}));
  }

  function signOut() {
    currentIdToken = null;
    currentProfile = null;
    if (window.google && window.google.accounts) window.google.accounts.id.disableAutoSelect();
    listeners.forEach((fn) => fn({ idToken: null, profile: null }));
  }

  function onAuthChange(fn) {
    listeners.push(fn);
  }

  function getToken() { return currentIdToken; }
  function getProfile() { return currentProfile; }

  window.LTA_AUTH = { init, renderButton, signOut, onAuthChange, getToken, getProfile };
})();
