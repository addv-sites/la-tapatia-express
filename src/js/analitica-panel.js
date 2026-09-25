(function () {
  let idToken = null;
  let map = null;
  let markersLayer = null;
  let lastData = null;

  function fmt(n) { return window.LTA_CATALOG.formatPrice(n); }

  function renderKpis(k) {
    document.getElementById('kpi-orders').textContent = k.total_orders;
    document.getElementById('kpi-delivery').textContent = k.delivery_orders;
    document.getElementById('kpi-pin-rate').textContent = k.delivery_pin_rate + '%';
    document.getElementById('kpi-revenue').textContent = fmt(k.revenue);
    document.getElementById('kpi-avg-ticket').textContent = fmt(k.avg_ticket);
    document.getElementById('kpi-recurring').textContent = k.recurring_client_rate + '%';
  }

  function renderZones(zones) {
    const el = document.getElementById('zones-table');
    el.innerHTML = zones.map((z) =>
      '<div class="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">' +
      '  <span class="font-label-md text-label-md font-bold">' + z.zone + '</span>' +
      '  <span class="font-body-sm text-body-sm text-on-surface-variant">' + z.orders + ' pedidos</span>' +
      '  <span class="font-price-md text-price-md text-primary">' + fmt(z.revenue) + '</span>' +
      '  <span class="font-body-sm text-body-sm text-on-surface-variant">tk. ' + fmt(z.avgTicket) + '</span>' +
      '</div>'
    ).join('');
  }

  function renderTopClients(clients) {
    const el = document.getElementById('top-clients');
    if (!clients.length) {
      el.innerHTML = '<p class="font-body-sm text-body-sm text-on-surface-variant">Sin pedidos ligados a cuentas registradas en este periodo.</p>';
      return;
    }
    el.innerHTML = clients.map((c, i) =>
      '<div class="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">' +
      '  <div class="flex items-center gap-2">' +
      '    <span class="w-6 h-6 rounded-full bg-primary text-on-primary text-[12px] font-bold flex items-center justify-center">' + (i + 1) + '</span>' +
      '    <span class="font-label-md text-label-md">' + c.name + '</span>' +
      '  </div>' +
      '  <span class="font-body-sm text-body-sm text-on-surface-variant">' + c.orders + ' ped.</span>' +
      '  <span class="font-price-md text-price-md text-primary">' + fmt(c.spend) + '</span>' +
      '</div>'
    ).join('');
  }

  function renderHourly(hourly) {
    const el = document.getElementById('hourly-chart');
    const max = Math.max(1, ...hourly);
    el.innerHTML = hourly.map((count, h) =>
      '<div class="flex-1 flex flex-col items-center justify-end gap-1" title="' + h + ':00 — ' + count + ' pedidos">' +
      '  <div class="w-full bg-primary rounded-t" style="height:' + Math.round((count / max) * 100) + 'px"></div>' +
      '  <span class="text-[9px] text-on-surface-variant">' + (h % 3 === 0 ? h : '') + '</span>' +
      '</div>'
    ).join('');
  }

  function renderMap(points) {
    if (!window.L) return;
    if (!map) {
      map = L.map('heatmap').setView([19.7008, -101.1844], 12); // Morelia, centro aproximado de la ciudad
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);
      markersLayer = L.layerGroup().addTo(map);
    }
    markersLayer.clearLayers();
    points.forEach((p) => {
      L.circleMarker([p.lat, p.lng], {
        radius: 6,
        color: '#93000b',
        fillColor: '#b91c1c',
        fillOpacity: 0.6,
        weight: 1
      }).bindPopup(fmt(p.total)).addTo(markersLayer);
    });
  }

  function exportCsv() {
    if (!lastData) return;
    const lines = ['zone,orders,revenue,avg_ticket'];
    lastData.zones.forEach((z) => lines.push([z.zone, z.orders, z.revenue, z.avgTicket].join(',')));
    lines.push('');
    lines.push('client_name,orders,spend');
    lastData.top_clients.forEach((c) => lines.push([JSON.stringify(c.name), c.orders, c.spend].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'analitica-la-tapatia.csv';
    a.click();
  }

  function showSkeleton() {
    ['kpi-orders', 'kpi-delivery', 'kpi-pin-rate', 'kpi-revenue', 'kpi-avg-ticket', 'kpi-recurring'].forEach((id) => {
      document.getElementById(id).innerHTML = '<span class="skeleton rounded-lg inline-block h-6 w-12"></span>';
    });
    document.getElementById('zones-table').innerHTML = '<div class="skeleton rounded-lg h-10 mb-2"></div>'.repeat(3);
    document.getElementById('top-clients').innerHTML = '<div class="skeleton rounded-lg h-10 mb-2"></div>'.repeat(3);
    document.getElementById('hourly-chart').innerHTML = '<div class="skeleton rounded-lg w-full h-full"></div>';
  }

  async function load(range) {
    showSkeleton();
    const data = await window.LTA_API.callAction('analytics.read', { range }, idToken);
    lastData = data;
    renderKpis(data.kpis);
    renderZones(data.zones);
    renderTopClients(data.top_clients);
    renderHourly(data.hourly_demand);
    renderMap(data.points);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('export-csv').addEventListener('click', exportCsv);
    document.getElementById('range-select').addEventListener('change', (e) => load(e.target.value));

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Analítica La Tapatía Express',
      subtitle: 'Acceso restringido a personal de ADDV (@addv.mx).',
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('panel-content').classList.remove('hidden');
        document.getElementById('range-select').classList.remove('hidden');
        try {
          await load('30d');
        } catch (err) {
          document.getElementById('panel-content').classList.add('hidden');
          document.getElementById('auth-gate').classList.remove('hidden');
          window.LTA_AUTH_GATE.showUnauthorized(document.getElementById('auth-gate'), err.message);
        }
      }
    });
  });
})();
