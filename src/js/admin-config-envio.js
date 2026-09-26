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

  function fill(config) {
    document.getElementById('cfg-delivery-enabled').checked = !!config.delivery_enabled;
    document.getElementById('cfg-z1-km').value = config.delivery_zone_1_km_max || '';
    document.getElementById('cfg-z1-cost').value = config.delivery_zone_1_cost || '';
    document.getElementById('cfg-z2-km').value = config.delivery_zone_2_km_max || '';
    document.getElementById('cfg-z2-cost').value = config.delivery_zone_2_cost || '';
    document.getElementById('cfg-z3-km').value = config.delivery_zone_3_km_max || '';
    document.getElementById('cfg-z3-cost').value = config.delivery_zone_3_cost || '';
    document.getElementById('cfg-driver-commission').value = config.driver_fixed_commission || '';
    DAYS.forEach((d) => {
      document.getElementById('cfg-hours-' + d.key + '-open').value = config['hours_' + d.key + '_open'] || '';
      document.getElementById('cfg-hours-' + d.key + '-close').value = config['hours_' + d.key + '_close'] || '';
    });
  }

  async function save() {
    const payload = {
      delivery_enabled: document.getElementById('cfg-delivery-enabled').checked,
      delivery_zone_1_km_max: Number(document.getElementById('cfg-z1-km').value),
      delivery_zone_1_cost: Number(document.getElementById('cfg-z1-cost').value),
      delivery_zone_2_km_max: Number(document.getElementById('cfg-z2-km').value),
      delivery_zone_2_cost: Number(document.getElementById('cfg-z2-cost').value),
      delivery_zone_3_km_max: Number(document.getElementById('cfg-z3-km').value),
      delivery_zone_3_cost: Number(document.getElementById('cfg-z3-cost').value),
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
