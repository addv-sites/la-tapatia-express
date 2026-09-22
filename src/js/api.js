/**
 * Cliente compartido para hablar con el Apps Script Web App.
 * Contrato completo: docs/apps-script-contract.md
 */
(function () {
  function getSessionId() {
    let id = sessionStorage.getItem('lta_session_id');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('lta_session_id', id);
    }
    return id;
  }

  const PAGE_LOADED_AT = Date.now();

  async function callAction(action, payload, idToken) {
    const url = window.SITE_CONFIG.appsScript.webAppUrl;
    if (!url) {
      throw new Error('appsScript.webAppUrl no configurado en src/config/site.js');
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS
      body: JSON.stringify({
        action,
        payload: Object.assign({ clientLoadedAt: PAGE_LOADED_AT }, payload || {}),
        idToken: idToken || null,
        sessionId: getSessionId()
      })
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error de servidor');
    return json.data;
  }

  async function readAction(action, params) {
    const url = new URL(window.SITE_CONFIG.appsScript.webAppUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('sessionId', getSessionId());
    Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error de servidor');
    return json.data;
  }

  window.LTA_API = { callAction, readAction };
})();
