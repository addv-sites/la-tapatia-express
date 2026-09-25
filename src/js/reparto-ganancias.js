(function () {
  document.addEventListener('DOMContentLoaded', () => {
    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Ganancias',
      subtitle: 'Acceso solo para repartidores autorizados.',
      onSignedIn: async (token) => {
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');
        document.getElementById('total-earned').innerHTML = '<span class="skeleton rounded-lg inline-block h-9 w-28"></span>';
        document.getElementById('count-deliveries').innerHTML = '<span class="skeleton rounded-lg inline-block h-6 w-8"></span>';
        document.getElementById('commission-each').innerHTML = '<span class="skeleton rounded-lg inline-block h-6 w-14"></span>';
        try {
          const [deliveries, config] = await Promise.all([
            window.LTA_API.callAction('driver.myDeliveries', {}, token),
            window.LTA_API.callAction('config.read', {}, token)
          ]);
          const count = (deliveries.orders || []).length;
          const commission = Number((config.config || {}).driver_fixed_commission || 0);
          document.getElementById('count-deliveries').textContent = count;
          document.getElementById('commission-each').textContent = window.LTA_CATALOG.formatPrice(commission);
          document.getElementById('total-earned').textContent = window.LTA_CATALOG.formatPrice(count * commission);
        } catch (err) {
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      }
    });
  });
})();
