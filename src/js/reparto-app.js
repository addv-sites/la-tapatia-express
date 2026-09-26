(function () {
  let idToken = null;
  let currentOrder = null;
  let watchId = null;
  let lastPingAt = 0;
  let lastSeenOrderId = undefined; // undefined = aún no cargó nada; distinto de null/"" (sin pedido)
  let vibrating = false;
  const PING_MIN_INTERVAL_MS = 20000;

  // ---- Alerta sonora: mismo timbre de siempre, 6 segundos fijos ----
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function ding(ctx, time, freq) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.6);
  }
  function playAssignmentAlert() {
    const ctx = ensureAudio();
    const start = ctx.currentTime + 0.05;
    const interval = 1.1;
    for (let i = 0; i < Math.floor(6 / interval); i++) {
      const t = start + i * interval;
      ding(ctx, t, 880);
      ding(ctx, t + 0.14, 660);
    }
  }

  // ---- Vibración: constante mientras el popup esté abierto (no existe en iPhone/Safari) ----
  function startVibration() {
    if (!navigator.vibrate) return;
    vibrating = true;
    navigator.vibrate([400, 200, 400, 200, 400, 200, 400, 200]);
  }
  function stopVibration() {
    vibrating = false;
    if (navigator.vibrate) navigator.vibrate(0);
  }

  // ---- Popup de nuevo pedido asignado ----
  function showAssignPopup(order) {
    const overlay = document.getElementById('assign-popup');
    const card = document.getElementById('assign-popup-card');
    document.getElementById('assign-popup-detail').textContent =
      order.order_id + ' · ' + (order.delivery_address || 'Recoge en sucursal');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        card.classList.remove('opacity-0', 'scale-90', 'translate-y-3');
      });
    });
  }
  function hideAssignPopup() {
    const overlay = document.getElementById('assign-popup');
    const card = document.getElementById('assign-popup-card');
    overlay.classList.add('opacity-0');
    card.classList.add('opacity-0', 'scale-90', 'translate-y-3');
    setTimeout(() => { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }, 700);
    stopVibration();
  }

  function parseItems(order) {
    try { return JSON.parse(order.items || '[]'); } catch (e) { return []; }
  }

  function mapsUrl(address) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(address);
  }
  function wazeUrl(address) {
    return 'https://waze.com/ul?q=' + encodeURIComponent(address) + '&navigate=yes';
  }

  function renderMap(order) {
    const el = document.getElementById('route-map');
    if (!window.L || !order.delivery_lat || !order.delivery_lng) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    el.innerHTML = '';
    const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([order.delivery_lat, order.delivery_lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    L.marker([order.delivery_lat, order.delivery_lng]).addTo(map);
  }

  function renderOrder(order) {
    currentOrder = order;
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('order-card').classList.remove('hidden');

    document.getElementById('order-folio').textContent = order.order_id;
    document.getElementById('order-customer').textContent = order.customer_name;
    document.getElementById('order-total').textContent = window.LTA_CATALOG.formatPrice(order.total);
    document.getElementById('order-address').textContent = order.delivery_address || 'Recoge en sucursal';
    document.getElementById('order-notes').textContent = order.notes || '';
    document.getElementById('order-notes').classList.toggle('hidden', !order.notes);

    const items = parseItems(order);
    document.getElementById('order-items').innerHTML = items.map((it) =>
      '<div class="flex justify-between font-body-sm text-body-sm"><span>' + it.quantity + 'x ' + it.name + (it.salsa ? ' (' + it.salsa + ')' : '') + '</span></div>'
    ).join('');

    document.getElementById('wa-customer').href = 'https://wa.me/' + String(order.customer_phone).replace(/\D/g, '') +
      '?text=' + encodeURIComponent('Hola ' + order.customer_name + ', soy el repartidor de La Tapatía Express, voy en camino con tu pedido ' + order.order_id);
    document.getElementById('call-customer').href = 'tel:' + order.customer_phone;
    document.getElementById('nav-google').href = mapsUrl(order.delivery_address || '');
    document.getElementById('nav-waze').href = wazeUrl(order.delivery_address || '');

    renderMap(order);

    const startBtn = document.getElementById('btn-start-route');
    const deliverBtn = document.getElementById('btn-mark-delivered');
    if (order.status === 'listo') {
      startBtn.classList.remove('hidden');
      deliverBtn.classList.add('hidden');
    } else {
      startBtn.classList.add('hidden');
      deliverBtn.classList.remove('hidden');
      startGpsTracking();
    }
  }

  function startGpsTracking() {
    if (watchId !== null || !navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition((pos) => {
      const now = Date.now();
      if (now - lastPingAt < PING_MIN_INTERVAL_MS || !currentOrder) return;
      lastPingAt = now;
      window.LTA_API.callAction('driver.pingLocation', {
        order_id: currentOrder.order_id,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }, idToken).catch(() => {});
    }, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
  }

  function stopGpsTracking() {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  async function loadActiveOrder() {
    const data = await window.LTA_API.callAction('driver.myOrders', {}, idToken);
    const orders = data.orders || [];
    if (!orders.length) {
      document.getElementById('empty-state').classList.remove('hidden');
      document.getElementById('order-card').classList.add('hidden');
      stopGpsTracking();
      lastSeenOrderId = null;
      return;
    }
    const order = orders[0];
    if (lastSeenOrderId !== undefined && order.order_id !== lastSeenOrderId) {
      playAssignmentAlert();
      startVibration();
      showAssignPopup(order);
    }
    lastSeenOrderId = order.order_id;
    renderOrder(order);
  }

  async function startRoute() {
    await window.LTA_API.callAction('order.updateStatus', { order_id: currentOrder.order_id, status: 'en_reparto' }, idToken);
    window.LTA_TOAST.show('Ruta iniciada — GPS activo.');
    await loadActiveOrder();
  }

  function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); }
  function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-start-route').addEventListener('click', startRoute);
    document.getElementById('btn-mark-delivered').addEventListener('click', () => openModal('modal-confirm'));
    document.getElementById('btn-incident').addEventListener('click', () => openModal('modal-incident'));
    document.getElementById('modal-confirm-cancel').addEventListener('click', () => closeModal('modal-confirm'));
    document.getElementById('modal-incident-cancel').addEventListener('click', () => closeModal('modal-incident'));

    document.getElementById('assign-popup-ignore').addEventListener('click', hideAssignPopup);
    document.getElementById('assign-popup-review').addEventListener('click', () => {
      hideAssignPopup();
      const card = document.getElementById('order-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('modal-confirm-ok').addEventListener('click', async () => {
      try {
        await window.LTA_API.callAction('order.updateStatus', { order_id: currentOrder.order_id, status: 'entregado' }, idToken);
        stopGpsTracking();
        closeModal('modal-confirm');
        window.LTA_TOAST.show('¡Entrega completada!');
        await loadActiveOrder();
      } catch (err) {
        window.LTA_TOAST.show('Error: ' + err.message, 'error');
      }
    });

    document.querySelectorAll('.incident-reason').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await window.LTA_API.callAction('incident.report', { order_id: currentOrder.order_id, reason: btn.dataset.reason }, idToken);
          window.LTA_TOAST.show('Incidencia reportada a cocina.');
          closeModal('modal-incident');
        } catch (err) {
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      });
    });

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'App Repartidor',
      subtitle: 'Acceso solo para repartidores autorizados de La Tapatía Express.',
      onSignedIn: async (token, profile) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        const name = (profile && (profile.given_name || profile.name)) || '';
        document.getElementById('driver-greeting').textContent = name ? 'Hola, ' + name : '';
        document.getElementById('loading-skeleton').classList.remove('hidden');
        document.getElementById('loading-skeleton').classList.add('flex');
        try {
          await loadActiveOrder();
          document.getElementById('loading-skeleton').classList.add('hidden');
          document.getElementById('loading-skeleton').classList.remove('flex');
          setInterval(loadActiveOrder, 20000);
        } catch (err) {
          document.getElementById('loading-skeleton').classList.add('hidden');
          document.getElementById('loading-skeleton').classList.remove('flex');
          document.getElementById('app-content').classList.add('hidden');
          document.getElementById('auth-gate').classList.remove('hidden');
          window.LTA_AUTH_GATE.showUnauthorized(document.getElementById('auth-gate'), err.message);
        }
      }
    });
  });

  window.addEventListener('beforeunload', () => { stopGpsTracking(); stopVibration(); });
})();
