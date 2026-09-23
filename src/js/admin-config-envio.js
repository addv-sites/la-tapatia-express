(function () {
  let idToken = null;

  function fill(config) {
    document.getElementById('cfg-delivery-enabled').checked = !!config.delivery_enabled;
    document.getElementById('cfg-z1-km').value = config.delivery_zone_1_km_max || '';
    document.getElementById('cfg-z1-cost').value = config.delivery_zone_1_cost || '';
    document.getElementById('cfg-z2-km').value = config.delivery_zone_2_km_max || '';
    document.getElementById('cfg-z2-cost').value = config.delivery_zone_2_cost || '';
    document.getElementById('cfg-z3-km').value = config.delivery_zone_3_km_max || '';
    document.getElementById('cfg-z3-cost').value = config.delivery_zone_3_cost || '';
    document.getElementById('cfg-driver-commission').value = config.driver_fixed_commission || '';
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
    try {
      await window.LTA_API.callAction('config.update', payload, idToken);
      window.LTA_TOAST.show('Configuración de envío guardada.');
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('save-config').addEventListener('click', save);
    window.LTA_AUTH_GATE.wireSignOutButton(document.getElementById('btn-signout-header'));

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Configuración de Envío',
      subtitle: 'Acceso solo para staff autorizado de La Tapatía Ahogadas.',
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
