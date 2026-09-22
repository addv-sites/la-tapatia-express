(function () {
  const STEPS = [
    { statuses: ['pendiente', 'confirmado', 'en_cocina', 'listo', 'en_reparto', 'entregado'], label: 'Recibido y confirmado' },
    { statuses: ['en_cocina', 'listo', 'en_reparto', 'entregado'], label: 'En la cocina' },
    { statuses: ['listo', 'en_reparto', 'entregado'], label: 'Listo' },
    { statuses: ['en_reparto', 'entregado'], label: 'En camino / para recoger' },
    { statuses: ['entregado'], label: 'Entregado' }
  ];

  function parseItems(order) {
    try { return JSON.parse(order.items || '[]'); } catch (e) { return []; }
  }

  function renderOrder(order) {
    document.getElementById('lookup-form').classList.add('hidden');
    const el = document.getElementById('tracking-result');
    el.classList.remove('hidden');
    el.classList.add('flex');

    document.getElementById('result-folio').textContent = order.order_id;
    document.getElementById('result-total').textContent = window.LTA_CATALOG.formatPrice(order.total);

    const items = parseItems(order);
    const itemsEl = document.getElementById('result-items');
    itemsEl.innerHTML = items.map((it) =>
      '<div class="flex justify-between font-body-sm text-body-sm text-on-surface-variant"><span>' + it.quantity + 'x ' + it.name + '</span></div>'
    ).join('');

    const stepsEl = document.getElementById('result-steps');
    stepsEl.innerHTML = '';
    let reachedCurrent = false;
    STEPS.forEach((step) => {
      const done = step.statuses.includes(order.status);
      const isCurrent = done && !reachedCurrent && (STEPS.filter(s => s.statuses.includes(order.status)).pop() === step);
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3' + (done ? '' : ' opacity-40');
      row.innerHTML =
        '<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' + (done ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high text-on-surface-variant') + '">' +
        (done ? '<svg class="w-4 h-4" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-check"/></svg>' : '') +
        '</div>' +
        '<span class="font-label-md text-label-md ' + (done ? 'text-on-surface font-bold' : 'text-on-surface-variant') + '">' + step.label + '</span>';
      stepsEl.appendChild(row);
    });

    const wa = document.getElementById('result-whatsapp');
    wa.href = 'https://wa.me/' + window.SITE_CONFIG.whatsapp + '?text=' + encodeURIComponent('Hola, tengo duda con mi pedido ' + order.order_id);
  }

  async function lookup(folio, tel) {
    const errorEl = document.getElementById('lookup-error');
    errorEl.classList.add('hidden');
    try {
      const data = await window.LTA_API.callAction('order.trackingRead', { order_id: folio, customer_phone: tel });
      renderOrder(data.order);
    } catch (err) {
      errorEl.textContent = 'No encontramos ese pedido con ese folio y teléfono. Revisa los datos.';
      errorEl.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    const folio = params.get('folio');
    const tel = params.get('tel');

    document.getElementById('lookup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      lookup(document.getElementById('input-folio').value.trim(), document.getElementById('input-tel').value.trim());
    });

    if (folio && tel) {
      document.getElementById('input-folio').value = folio;
      document.getElementById('input-tel').value = tel;
      lookup(folio, tel);
    }
  });
})();
