(function () {
  const POLL_MS = 15000;
  let idToken = null;
  let pollTimer = null;

  const COLUMNS = [
    { id: 'pendiente', title: 'Por Confirmar', statuses: ['pendiente'] },
    { id: 'cocina', title: 'En Cocina', statuses: ['confirmado', 'en_cocina'] },
    { id: 'listo', title: 'Listo / En Reparto', statuses: ['listo', 'en_reparto'] }
  ];

  function parseItems(order) {
    try { return JSON.parse(order.items || '[]'); } catch (e) { return []; }
  }

  function orderCard(order) {
    const items = parseItems(order);
    const summary = items.map((it) => it.quantity + 'x ' + it.name).join(', ');
    const card = document.createElement('div');
    card.className = 'bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2';
    card.innerHTML =
      '<div class="flex items-start justify-between">' +
      '  <span class="font-headline-sm text-headline-sm text-primary">' + order.order_id + '</span>' +
      '  <span class="font-label-sm text-label-sm text-on-surface-variant">' + (order.order_type === 'delivery' ? 'A domicilio' : 'Para llevar') + '</span>' +
      '</div>' +
      '<p class="font-label-md text-label-md font-bold text-on-surface">' + order.customer_name + '</p>' +
      '<p class="font-body-sm text-body-sm text-on-surface-variant">' + summary + '</p>' +
      '<div class="flex items-center justify-between pt-1">' +
      '  <span class="font-price-md text-price-md text-on-surface font-bold">' + window.LTA_CATALOG.formatPrice(order.total) + '</span>' +
      '  <a href="https://wa.me/' + String(order.customer_phone).replace(/\D/g, '') + '" target="_blank" rel="noopener" class="text-whatsapp-green"><svg class="w-5 h-5" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-whatsapp"/></svg></a>' +
      '</div>' +
      '<div class="flex items-center gap-2 pt-2 action-slot"></div>';

    const actionSlot = card.querySelector('.action-slot');

    if (order.status === 'pendiente') {
      actionSlot.appendChild(actionBtn('Aceptar', 'bg-tertiary text-on-tertiary', () => updateStatus(order.order_id, 'confirmado')));
      actionSlot.appendChild(actionBtn('Eliminar', 'bg-surface-container text-error', () => deleteOrder(order.order_id)));
    } else if (order.status === 'confirmado' || order.status === 'en_cocina') {
      actionSlot.appendChild(actionBtn('Marcar Listo', 'bg-secondary text-on-secondary w-full', () => updateStatus(order.order_id, 'listo')));
    } else if (order.status === 'listo' || order.status === 'en_reparto') {
      actionSlot.appendChild(actionBtn('Finalizar y Entregar', 'bg-tertiary text-on-tertiary w-full', () => updateStatus(order.order_id, 'entregado')));
    }

    return card;
  }

  function actionBtn(label, classes, onClick) {
    const btn = document.createElement('button');
    btn.className = 'flex-1 py-1.5 px-3 rounded-lg font-label-sm text-label-sm font-bold ' + classes;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  async function updateStatus(orderId, status) {
    try {
      await window.LTA_API.callAction('order.updateStatus', { order_id: orderId, status }, idToken);
      window.LTA_TOAST.show(orderId + ' → ' + status);
      loadOrders();
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    }
  }

  async function deleteOrder(orderId) {
    try {
      await window.LTA_API.callAction('order.delete', { order_id: orderId }, idToken);
      window.LTA_TOAST.show(orderId + ' eliminado.');
      loadOrders();
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    }
  }

  async function loadOrders() {
    const data = await window.LTA_API.callAction('order.list', {}, idToken);
    const orders = (data.orders || []).filter((o) => o.status !== 'entregado' && o.status !== 'cancelado' && o.status !== 'abandonado');

    COLUMNS.forEach((col) => {
      const container = document.getElementById('col-' + col.id);
      container.innerHTML = '';
      const colOrders = orders.filter((o) => col.statuses.includes(o.status));
      document.getElementById('count-' + col.id).textContent = colOrders.length;
      colOrders.forEach((o) => container.appendChild(orderCard(o)));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.LTA_ADMIN_AUTH.renderGate(document.getElementById('auth-gate'), {
      title: 'Gestión de Pedidos',
      subtitle: 'Acceso solo para staff autorizado de La Tapatía Ahogadas.',
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        try {
          await loadOrders();
          pollTimer = setInterval(loadOrders, POLL_MS);
        } catch (err) {
          document.getElementById('admin-content').classList.add('hidden');
          document.getElementById('auth-gate').classList.remove('hidden');
          window.LTA_ADMIN_AUTH.showUnauthorized(document.getElementById('auth-gate'), err.message);
        }
      }
    });
  });

  window.addEventListener('beforeunload', () => { if (pollTimer) clearInterval(pollTimer); });
})();
