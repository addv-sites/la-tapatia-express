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
      window.LTA_TOAST.show('Configuración de envío guardada.');
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHoursRows();
    document.getElementById('save-config').addEventListener('click', save);
    window.LTA_AUTH_GATE.wireSignOutButton(document.getElementById('btn-signout-header'));

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Configuración de Envío',
      subtitle: 'Acceso solo para staff autorizado de Ahogadas La Tapatía Express.',
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        try {
          const data = await window.LTA_API.callAction('config.read', {}, idToken);
          fill(data.config || {});
        } catch (err) {
          window.LTA_TOAST.show('No se pudo cargar la config actual: ' + err.message, 'error');
        }
      }
    });
  });
})();
