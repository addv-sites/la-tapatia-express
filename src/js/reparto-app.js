(function () {
  let idToken = null;
  let currentOrder = null;
  let watchId = null;
  let lastPingAt = 0;
  const PING_MIN_INTERVAL_MS = 20000;

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
      return;
    }
    renderOrder(orders[0]);
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
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
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

  window.addEventListener('beforeunload', stopGpsTracking);
})();
