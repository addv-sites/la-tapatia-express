(function () {
  function parseItems(order) {
    try { return JSON.parse(order.items || '[]'); } catch (e) { return []; }
  }

  function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    const empty = document.getElementById('orders-empty');
    if (!orders.length) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    list.innerHTML = '';
    orders
      .slice()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .forEach((order) => {
        const items = parseItems(order);
        const card = document.createElement('a');
        card.href = '../rastreo/?folio=' + encodeURIComponent(order.order_id) + '&tel=' + encodeURIComponent(order.customer_phone);
        card.className = 'block bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-1';
        card.innerHTML =
          '<div class="flex items-center justify-between">' +
          '  <span class="font-headline-sm text-headline-sm text-primary">' + order.order_id + '</span>' +
          '  <span class="font-price-md text-price-md text-on-surface">' + window.LTA_CATALOG.formatPrice(order.total) + '</span>' +
          '</div>' +
          '<p class="font-body-sm text-body-sm text-on-surface-variant">' + items.map((it) => it.quantity + 'x ' + it.name).join(', ') + '</p>' +
          '<p class="font-label-sm text-label-sm text-on-surface-variant">' + order.created_at + ' · ' + order.status + '</p>';
        list.appendChild(card);
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Historial de Pedidos',
      subtitle: 'Inicia sesión con tu cuenta de Google para ver tus pedidos anteriores.',
      onSignedIn: async (token) => {
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('history-content').classList.remove('hidden');
        document.getElementById('orders-list').innerHTML =
          '<div class="skeleton rounded-xl h-20"></div>'.repeat(3);
        try {
          const data = await window.LTA_API.callAction('order.listMine', {}, token);
          renderOrders(data.orders || []);
        } catch (err) {
          document.getElementById('orders-list').innerHTML = '';
          window.LTA_TOAST.show('No se pudo cargar tu historial: ' + err.message, 'error');
        }
      }
    });
  });
})();
