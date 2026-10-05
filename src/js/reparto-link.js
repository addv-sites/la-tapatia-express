(function () {
  let currentOrder = null;
  let orderId = null;
  let token = null;
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

  function showExpired() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('order-card').classList.add('hidden');
    document.getElementById('order-card').classList.remove('flex');
    const el = document.getElementById('expired-state');
    el.classList.remove('hidden');
    el.classList.add('flex');
  }

  function renderOrder(data) {
    const order = data.order;
    currentOrder = order;

    document.getElementById('loading-state').classList.add('hidden');
    const card = document.getElementById('order-card');
    card.classList.remove('hidden');
    card.classList.add('flex');

    document.getElementById('order-folio').textContent = order.order_id;
    document.getElementById('order-customer').textContent = order.customer_name;
    document.getElementById('order-total').textContent = window.LTA_CATALOG.formatPrice(order.total);
    document.getElementById('order-pickup').textContent = 'Recoger en: ' + (data.pickup_address || 'Sucursal');
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

    // Lo que se cobra al cliente — con nota de cambio solo si el checkout capturó una denominación.
    document.getElementById('charge-card').classList.remove('hidden');
    document.getElementById('charge-card').classList.add('flex');
    document.getElementById('charge-total').textContent = window.LTA_CATALOG.formatPrice(order.total);
    if (order.cash_denomination) {
      const change = Number(order.cash_denomination) - Number(order.total);
      const note = document.getElementById('charge-cash-note');
      note.textContent = 'Paga en efectivo con billete de ' + window.LTA_CATALOG.formatPrice(order.cash_denomination) +
        (change > 0 ? ' — lleva ' + window.LTA_CATALOG.formatPrice(change) + ' de cambio.' : '.');
      note.classList.remove('hidden');
    }

    // Lo que le corresponde al repartidor — comisión fija configurada en Repartidores.
    if (data.driver_commission) {
      document.getElementById('commission-card').classList.remove('hidden');
      document.getElementById('commission-card').classList.add('flex');
      document.getElementById('commission-value').textContent = window.LTA_CATALOG.formatPrice(data.driver_commission);
    }

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
      if (now - lastPingAt < PING_MIN_INTERVAL_MS) return;
      lastPingAt = now;
      window.LTA_API.callAction('driver.pingLocation', {
        order_id: orderId, token: token, lat: pos.coords.latitude, lng: pos.coords.longitude
      }, null).catch(() => {});
    }, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
  }

  function stopGpsTracking() {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  async function loadOrder() {
    try {
      const data = await window.LTA_API.callAction('delivery.getByToken', { order_id: orderId, token: token }, null);
      renderOrder(data);
    } catch (err) {
      showExpired();
    }
  }

  async function startRoute() {
    try {
      await window.LTA_API.callAction('order.updateStatus', { order_id: orderId, token: token, status: 'en_reparto' }, null);
      window.LTA_TOAST.show('Ruta iniciada — GPS activo.');
      await loadOrder();
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    }
  }

  function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); }
  function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }

  document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(location.search);
    orderId = params.get('o');
    token = params.get('t');

    if (!orderId || !token) { showExpired(); return; }

    document.getElementById('btn-start-route').addEventListener('click', startRoute);
    document.getElementById('btn-mark-delivered').addEventListener('click', () => openModal('modal-confirm'));
    document.getElementById('btn-incident').addEventListener('click', () => openModal('modal-incident'));
    document.getElementById('modal-confirm-cancel').addEventListener('click', () => closeModal('modal-confirm'));
    document.getElementById('modal-incident-cancel').addEventListener('click', () => closeModal('modal-incident'));

    document.getElementById('modal-confirm-ok').addEventListener('click', async () => {
      try {
        await window.LTA_API.callAction('order.updateStatus', { order_id: orderId, token: token, status: 'entregado' }, null);
        stopGpsTracking();
        closeModal('modal-confirm');
        window.LTA_TOAST.show('¡Entrega completada!');
        showExpired();
      } catch (err) {
        window.LTA_TOAST.show('Error: ' + err.message, 'error');
      }
    });

    document.querySelectorAll('.incident-reason').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await window.LTA_API.callAction('incident.report', { order_id: orderId, token: token, reason: btn.dataset.reason }, null);
          window.LTA_TOAST.show('Incidencia reportada a cocina.');
          closeModal('modal-incident');
        } catch (err) {
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      });
    });

    await loadOrder();
  });

  window.addEventListener('beforeunload', stopGpsTracking);
})();
