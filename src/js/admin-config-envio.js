(function () {
  let idToken = null;

  const DAYS = [
    { key: 'mon', label: 'Lunes' },
    { key: 'tue', label: 'Martes' },
    { key: 'wed', label: 'Miércoles' },
    { key: 'thu', label: 'Jueves' },
    { key: 'fri', label: 'Viernes' },
    { key: 'sat', label: 'Sábado' },
    { key: 'sun', label: 'Domingo' }
  ];

  function renderHoursRows() {
    const container = document.getElementById('hours-rows');
    container.innerHTML = DAYS.map((d) =>
      '<div class="grid grid-cols-[64px_1fr_1fr] gap-2.5 items-center py-2 border-t border-surface-container-low first:border-t-0">' +
      '  <span class="font-label-sm text-label-sm font-bold">' + d.label.slice(0, 3) + '</span>' +
      '  <input id="cfg-hours-' + d.key + '-open" type="time" class="h-9 px-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm">' +
      '  <input id="cfg-hours-' + d.key + '-close" type="time" class="h-9 px-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm">' +
      '</div>'
    ).join('');
  }

  let tariffRows = []; // [{km, cost}, ...]

  function renderTariffRows() {
    const tbody = document.getElementById('tariff-rows');
    tbody.innerHTML = tariffRows.map((row, i) =>
      '<tr>' +
      '  <td class="py-1 pr-2"><input type="number" step="1" min="1" class="tariff-km h-9 w-16 px-2 rounded-lg bg-surface-container-low" data-i="' + i + '" value="' + row.km + '"></td>' +
      '  <td class="py-1 pr-2"><input type="number" step="1" min="0" class="tariff-cost h-9 w-24 px-2 rounded-lg bg-surface-container-low" data-i="' + i + '" value="' + row.cost + '"></td>' +
      '  <td class="py-1"><button type="button" class="tariff-remove w-8 h-8 rounded-lg text-error flex items-center justify-center" data-i="' + i + '" aria-label="Quitar escalón"><svg class="w-4 h-4" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-close"/></svg></button></td>' +
      '</tr>'
    ).join('');
    tbody.querySelectorAll('.tariff-km').forEach((el) => el.addEventListener('input', (e) => {
      tariffRows[Number(e.target.dataset.i)].km = Number(e.target.value) || 0;
    }));
    tbody.querySelectorAll('.tariff-cost').forEach((el) => el.addEventListener('input', (e) => {
      tariffRows[Number(e.target.dataset.i)].cost = Number(e.target.value) || 0;
    }));
    tbody.querySelectorAll('.tariff-remove').forEach((el) => el.addEventListener('click', (e) => {
      tariffRows.splice(Number(e.currentTarget.dataset.i), 1);
      renderTariffRows();
    }));
  }

  function fill(config) {
    document.getElementById('cfg-delivery-enabled').checked = !!config.delivery_enabled;
    try { tariffRows = JSON.parse(config.delivery_tariff_table || '[]'); } catch (e) { tariffRows = []; }
    if (!tariffRows.length) {
      // Semilla razonable si CONFIG todavía no trae tabla — el admin la ajusta y guarda.
      tariffRows = [1, 2, 3, 4, 5, 6, 7, 8].map((km) => ({ km, cost: '' }));
    }
    renderTariffRows();
    document.getElementById('cfg-extra-km-cost').value = config.delivery_extra_km_cost || '';
    document.getElementById('cfg-max-km').value = config.delivery_max_km || '';
    document.getElementById('cfg-driver-commission').value = config.driver_fixed_commission || '';
    DAYS.forEach((d) => {
      document.getElementById('cfg-hours-' + d.key + '-open').value = config['hours_' + d.key + '_open'] || '';
      document.getElementById('cfg-hours-' + d.key + '-close').value = config['hours_' + d.key + '_close'] || '';
    });
  }

  async function save() {
    const payload = {
      delivery_enabled: document.getElementById('cfg-delivery-enabled').checked,
      delivery_tariff_table: JSON.stringify(tariffRows.filter((r) => r.km > 0).sort((a, b) => a.km - b.km)),
      delivery_extra_km_cost: Number(document.getElementById('cfg-extra-km-cost').value),
      delivery_max_km: Number(document.getElementById('cfg-max-km').value),
      driver_fixed_commission: Number(document.getElementById('cfg-driver-commission').value)
    };
    DAYS.forEach((d) => {
      payload['hours_' + d.key + '_open'] = document.getElementById('cfg-hours-' + d.key + '-open').value;
      payload['hours_' + d.key + '_close'] = document.getElementById('cfg-hours-' + d.key + '-close').value;
    });
    try {
      await window.LTA_API.callAction('config.update', payload, idToken);
      window.LTA_TOAST.show('Configuración guardada.');
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    }
  }

  let drivers = [];

  function renderDrivers() {
    const list = document.getElementById('drivers-list');
    document.getElementById('drivers-empty').classList.toggle('hidden', drivers.length > 0);
    list.innerHTML = '';
    drivers.forEach((d) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg' + (d.active === false ? ' opacity-60' : '');
      row.innerHTML =
        '<div class="min-w-0">' +
        '  <p class="font-label-md text-label-md font-bold truncate">' + d.name + '</p>' +
        '  <p class="font-label-sm text-[11px] text-on-surface-variant truncate">' + d.email + '</p>' +
        '</div>' +
        '<label class="relative inline-flex items-center cursor-pointer shrink-0">' +
        '  <input type="checkbox" class="driver-toggle sr-only peer" ' + (d.active !== false ? 'checked' : '') + '>' +
        '  <div class="w-9 h-5 bg-surface-container-highest rounded-full peer peer-checked:bg-tertiary relative after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>' +
        '</label>';
      row.querySelector('.driver-toggle').addEventListener('change', async (e) => {
        try {
          await window.LTA_API.callAction('driver.toggleActive', { email: d.email, active: e.target.checked }, idToken);
          d.active = e.target.checked;
          window.LTA_TOAST.show('"' + d.name + '" marcado como ' + (e.target.checked ? 'activo' : 'inactivo') + '.');
          renderDrivers();
        } catch (err) {
          e.target.checked = !e.target.checked;
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      });
      list.appendChild(row);
    });
  }

  async function loadDrivers() {
    const data = await window.LTA_API.callAction('driver.listAll', {}, idToken);
    drivers = data.drivers || [];
    renderDrivers();
  }

  function openAddDriverModal_() {
    document.getElementById('add-driver-form').reset();
    document.getElementById('add-driver-modal').classList.remove('hidden');
    document.getElementById('add-driver-name').focus();
  }

  function closeAddDriverModal_() {
    document.getElementById('add-driver-modal').classList.add('hidden');
  }

  async function submitAddDriver_() {
    const submitBtn = document.getElementById('btn-submit-add-driver');
    const name = document.getElementById('add-driver-name').value.trim();
    const email = document.getElementById('add-driver-email').value.trim();
    if (!name) { window.LTA_TOAST.show('Falta el nombre.', 'error'); return; }
    if (!email || !email.includes('@')) { window.LTA_TOAST.show('Email inválido.', 'error'); return; }

    submitBtn.disabled = true;
    try {
      const result = await window.LTA_API.callAction('driver.create', { name, email }, idToken);
      drivers.push(result.driver);
      window.LTA_TOAST.show('"' + name + '" agregado como repartidor.');
      closeAddDriverModal_();
      renderDrivers();
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  }

  function showTab(which) {
    const panelEnvio = document.getElementById('panel-envio');
    const panelHorario = document.getElementById('panel-horario');
    const panelRepartidores = document.getElementById('panel-repartidores');
    const tabEnvio = document.getElementById('tab-envio');
    const tabHorario = document.getElementById('tab-horario');
    const tabRepartidores = document.getElementById('tab-repartidores');
    panelEnvio.style.display = which === 'envio' ? 'flex' : 'none';
    panelHorario.style.display = which === 'horario' ? 'flex' : 'none';
    panelRepartidores.style.display = which === 'repartidores' ? 'flex' : 'none';
    tabEnvio.classList.toggle('bg-primary-fixed', which === 'envio');
    tabEnvio.classList.toggle('text-on-primary-fixed', which === 'envio');
    tabEnvio.classList.toggle('text-on-surface-variant', which !== 'envio');
    tabHorario.classList.toggle('bg-primary-fixed', which === 'horario');
    tabHorario.classList.toggle('text-on-primary-fixed', which === 'horario');
    tabHorario.classList.toggle('text-on-surface-variant', which !== 'horario');
    tabRepartidores.classList.toggle('bg-primary-fixed', which === 'repartidores');
    tabRepartidores.classList.toggle('text-on-primary-fixed', which === 'repartidores');
    tabRepartidores.classList.toggle('text-on-surface-variant', which !== 'repartidores');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHoursRows();
    document.getElementById('save-config').addEventListener('click', save);
    document.getElementById('btn-add-tariff-row').addEventListener('click', () => {
      const lastKm = tariffRows.length ? tariffRows[tariffRows.length - 1].km : 0;
      tariffRows.push({ km: lastKm + 1, cost: '' });
      renderTariffRows();
    });
    document.getElementById('tab-envio').addEventListener('click', () => showTab('envio'));
    document.getElementById('tab-horario').addEventListener('click', () => showTab('horario'));
    document.getElementById('tab-repartidores').addEventListener('click', () => showTab('repartidores'));
    window.LTA_AUTH_GATE.wireSignOutButton(document.getElementById('btn-signout-header'));

    document.getElementById('btn-add-driver').addEventListener('click', openAddDriverModal_);
    document.getElementById('btn-close-add-driver').addEventListener('click', closeAddDriverModal_);
    document.getElementById('btn-cancel-add-driver').addEventListener('click', closeAddDriverModal_);
    document.getElementById('add-driver-form').addEventListener('submit', (e) => {
      e.preventDefault();
      submitAddDriver_();
    });

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Configuraciones',
      subtitle: 'Acceso solo para staff autorizado de La Tapatía Express.',
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        document.getElementById('save-bar').classList.remove('hidden');
        try {
          const data = await window.LTA_API.callAction('config.read', {}, idToken);
          fill(data.config || {});
        } catch (err) {
          window.LTA_TOAST.show('No se pudo cargar la config actual: ' + err.message, 'error');
        }
        try {
          await loadDrivers();
        } catch (err) {
          window.LTA_TOAST.show('No se pudo cargar repartidores: ' + err.message, 'error');
        }
      }
    });
  });
})();
