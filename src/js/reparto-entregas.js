(function () {
  function parseItems(order) {
    try { return JSON.parse(order.items || '[]'); } catch (e) { return []; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Mis Entregas',
      subtitle: 'Acceso solo para repartidores autorizados.',
      onSignedIn: async (token) => {
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');
        document.getElementById('deliveries-list').innerHTML =
          '<div class="skeleton rounded-xl h-20"></div>'.repeat(3);
        try {
          const data = await window.LTA_API.callAction('driver.myDeliveries', {}, token);
          const orders = data.orders || [];
          const list = document.getElementById('deliveries-list');
          if (!orders.length) {
            list.innerHTML = '';
            document.getElementById('empty').classList.remove('hidden');
            return;
          }
          list.innerHTML = orders
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
            .map((o) => {
              const items = parseItems(o);
              return '<div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-1">' +
                '<div class="flex justify-between"><span class="font-headline-sm text-headline-sm text-primary">' + o.order_id + '</span>' +
                '<span class="font-price-md text-price-md">' + window.LTA_CATALOG.formatPrice(o.total) + '</span></div>' +
                '<p class="font-body-sm text-body-sm text-on-surface-variant">' + items.map((it) => it.quantity + 'x ' + it.name).join(', ') + '</p>' +
                '<p class="font-label-sm text-label-sm text-on-surface-variant">' + o.created_at + '</p>' +
                '</div>';
            }).join('');
        } catch (err) {
          document.getElementById('deliveries-list').innerHTML = '';
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      }
    });
  });
})();
