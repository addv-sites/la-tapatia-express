(function () {
  let idToken = null;
  let allClients = [];
  let filteredClients = [];
  let activeEmail = null;
  const ordersCache = {};

  const COLUMNS = [
    { key: 'name', label: 'Nombre' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Dirección' },
    { key: 'address_reference', label: 'Referencias' },
    { key: 'orders', label: 'Pedidos' },
    { key: 'spend', label: 'Gasto total' },
    { key: 'marketing_opt_in', label: 'Opt-in marketing' },
    { key: 'created_at', label: 'Cliente desde' },
    { key: 'last_order_at', label: 'Última visita' }
  ];

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
  function money(n) {
    return window.LTA_CATALOG ? window.LTA_CATALOG.formatPrice(Number(n) || 0) : '$' + (Number(n) || 0);
  }

  function renderList() {
    const el = document.getElementById('client-list');
    document.getElementById('client-count').textContent =
      filteredClients.length + (filteredClients.length === 1 ? ' cliente' : ' clientes');
    if (!filteredClients.length) {
      el.innerHTML = '<p class="p-4 font-body-sm text-body-sm text-on-surface-variant">Sin resultados.</p>';
      return;
    }
    el.innerHTML = filteredClients.map((c) => (
      '<button type="button" data-email="' + c.email + '" class="client-row w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-surface-container-high last:border-b-0 text-left ' +
      (c.email === activeEmail ? 'bg-primary-fixed' : 'hover:bg-surface-container-low') + '">' +
      '<span class="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-[10px] font-bold text-on-surface-variant shrink-0">' + initials(c.name) + '</span>' +
      '<span class="min-w-0"><span class="block font-label-sm text-label-sm font-bold text-on-surface truncate">' + (c.name || c.email) + '</span>' +
      '<span class="block font-label-sm text-[10px] text-on-surface-variant">' + c.orders + ' pedidos · ' + money(c.spend) + '</span></span>' +
      '</button>'
    )).join('');
    Array.from(el.querySelectorAll('.client-row')).forEach((btn) => {
      btn.addEventListener('click', () => selectClient(btn.dataset.email));
    });
  }

  async function selectClient(email) {
    activeEmail = email;
    renderList();
    const client = allClients.find((c) => c.email === email);
    const detail = document.getElementById('client-detail');
    if (!client) return;
    detail.className = 'bg-surface-container-lowest border border-outline-variant rounded-2xl p-5';
    detail.innerHTML =
      '<div class="flex items-center gap-3 mb-5">' +
      '  <span class="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-headline-sm text-headline-sm shrink-0">' + initials(client.name) + '</span>' +
      '  <div class="min-w-0"><h2 class="font-headline-sm text-headline-sm text-on-surface truncate">' + (client.name || 'Sin nombre') + '</h2>' +
      '  <p class="font-body-sm text-body-sm text-on-surface-variant truncate">' + client.email + ' · ' + (client.phone || 'sin teléfono') + '</p></div>' +
      '</div>' +
      '<div class="grid grid-cols-3 gap-2.5 mb-5">' +
      '  <div class="bg-surface-container-low rounded-xl p-3"><p class="font-headline-sm text-headline-sm text-on-surface">' + client.orders + '</p><p class="font-label-sm text-[10px] uppercase tracking-wide text-on-surface-variant">Pedidos</p></div>' +
      '  <div class="bg-surface-container-low rounded-xl p-3"><p class="font-headline-sm text-headline-sm text-on-surface">' + money(client.spend) + '</p><p class="font-label-sm text-[10px] uppercase tracking-wide text-on-surface-variant">Gasto total</p></div>' +
      '  <div class="bg-surface-container-low rounded-xl p-3"><p class="font-headline-sm text-headline-sm text-on-surface">' + (client.last_order_at ? client.last_order_at.split(' ')[0] : '—') + '</p><p class="font-label-sm text-[10px] uppercase tracking-wide text-on-surface-variant">Última visita</p></div>' +
      '</div>' +
      '<div class="mb-4"><h3 class="font-label-sm text-[10.5px] uppercase tracking-wide text-on-surface-variant mb-1">Dirección guardada</h3>' +
      '  <p class="font-body-md text-body-md text-on-surface">' + (client.address || 'Sin dirección guardada') + '</p>' +
      (client.address_reference ? '  <p class="font-body-sm text-body-sm text-on-surface-variant">' + client.address_reference + '</p>' : '') +
      '</div>' +
      '<div class="mb-4"><h3 class="font-label-sm text-[10.5px] uppercase tracking-wide text-on-surface-variant mb-1">Marketing</h3>' +
      '  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-[10px] font-bold ' +
      (client.marketing_opt_in ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-high text-on-surface-variant') + '">' +
      (client.marketing_opt_in ? 'Acepta mensajes' : 'No acepta mensajes') + '</span></div>' +
      '<div><h3 class="font-label-sm text-[10.5px] uppercase tracking-wide text-on-surface-variant mb-1.5">Últimos pedidos</h3>' +
      '  <div id="client-orders" class="flex flex-col gap-1.5"><p class="font-body-sm text-body-sm text-on-surface-variant">Cargando…</p></div></div>';

    try {
      if (!ordersCache[email]) {
        const data = await window.LTA_API.callAction('client.orders', { email }, idToken);
        ordersCache[email] = data.orders || [];
      }
      const orders = ordersCache[email];
      const ordersEl = document.getElementById('client-orders');
      if (ordersEl) {
        ordersEl.innerHTML = orders.length
          ? orders.slice(0, 8).map((o) =>
              '<div class="flex items-center justify-between font-body-sm text-body-sm border-b border-surface-container-high py-1.5 last:border-b-0">' +
              '<span class="text-on-surface-variant">' + o.order_id + ' · ' + String(o.created_at).split(' ')[0] + '</span>' +
              '<span class="font-bold text-on-surface">' + money(o.total) + '</span></div>'
            ).join('')
          : '<p class="font-body-sm text-body-sm text-on-surface-variant">Sin pedidos registrados.</p>';
      }
    } catch (err) {
      const ordersEl = document.getElementById('client-orders');
      if (ordersEl) ordersEl.innerHTML = '<p class="font-body-sm text-body-sm text-error">No se pudo cargar el historial.</p>';
    }
  }

  function applyFilter(query) {
    const q = query.trim().toLowerCase();
    filteredClients = !q ? allClients.slice() : allClients.filter((c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
    renderList();
  }

  function downloadCsv(cols, rows, filename) {
    const header = cols.map((c) => c.label).join(',');
    const body = rows.map((r) => cols.map((c) => {
      let v = r[c.key];
      if (c.key === 'marketing_opt_in') v = v ? 'Sí' : 'No';
      if (c.key === 'spend') v = Number(v || 0);
      return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
    }).join(',')).join('\n');
    const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  const PRESETS = {
    all: COLUMNS.map((c) => c.key),
    contact: ['name', 'phone', 'email', 'address'],
    marketing: ['name', 'phone', 'marketing_opt_in']
  };

  function wireExportMenu() {
    const openBtn = document.getElementById('export-open');
    const menu = document.getElementById('export-menu');
    openBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.relative')) menu.classList.add('hidden'); });

    document.querySelectorAll('.export-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        const cols = COLUMNS.filter((c) => PRESETS[key].includes(c.key));
        const rows = key === 'marketing' ? allClients.filter((c) => c.marketing_opt_in) : allClients;
        downloadCsv(cols, rows, 'clientes_la_tapatia_' + key + '.csv');
        menu.classList.add('hidden');
      });
    });

    const customCols = document.getElementById('export-custom-cols');
    customCols.innerHTML = COLUMNS.map((c) =>
      '<label class="flex items-center gap-1.5 font-body-sm text-[11.5px] text-on-surface px-2 py-1.5 rounded-lg bg-surface-container-low">' +
      '<input type="checkbox" value="' + c.key + '" checked class="accent-primary">' + c.label + '</label>'
    ).join('');
    document.getElementById('export-custom-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('export-custom-panel').classList.toggle('hidden');
    });
    document.getElementById('export-custom-run').addEventListener('click', (e) => {
      e.stopPropagation();
      const keys = Array.from(customCols.querySelectorAll('input:checked')).map((i) => i.value);
      const cols = COLUMNS.filter((c) => keys.includes(c.key));
      downloadCsv(cols, filteredClients.length ? filteredClients : allClients, 'clientes_la_tapatia_personalizado.csv');
      menu.classList.add('hidden');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.LTA_AUTH_GATE.wireSignOutButton(document.getElementById('btn-signout-header'));
    wireExportMenu();

    document.getElementById('client-search').addEventListener('input', (e) => applyFilter(e.target.value));

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Clientes',
      subtitle: 'Acceso solo para staff autorizado de La Tapatía Express.',
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        document.getElementById('client-list').innerHTML = '<div class="skeleton rounded-xl h-14 m-2"></div>'.repeat(4);
        try {
          const data = await window.LTA_API.callAction('client.listAll', {}, token);
          allClients = (data.clients || []).sort((a, b) => b.spend - a.spend);
          filteredClients = allClients.slice();
          renderList();
        } catch (err) {
          document.getElementById('admin-content').classList.add('hidden');
          document.getElementById('auth-gate').classList.remove('hidden');
          window.LTA_AUTH_GATE.showUnauthorized(document.getElementById('auth-gate'), err.message);
        }
      }
    });
  });
})();
