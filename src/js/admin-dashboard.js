(function () {
  document.addEventListener('DOMContentLoaded', () => {
    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Panel de Administración',
      subtitle: 'Inicia sesión con tu cuenta de Google autorizada para el equipo.',
      onSignedIn: async (token, profile) => {
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('dashboard-content').classList.remove('hidden');
        document.getElementById('btn-signout-header').classList.remove('hidden');
        window.LTA_AUTH_GATE.wireSignOutButton(document.getElementById('btn-signout-header'));

        const name = (profile && (profile.given_name || profile.name)) || '';
        document.getElementById('dashboard-greeting').textContent = name
          ? 'Hola, ' + name + ' — elige qué quieres hacer'
          : 'Elige qué quieres hacer';

        try {
          const data = await window.LTA_API.callAction('order.list', {}, token);
          const active = (data.orders || []).filter((o) =>
            o.status !== 'entregado' && o.status !== 'cancelado' && o.status !== 'abandonado'
          );
          if (active.length > 0) {
            document.getElementById('pedidos-count').textContent = active.length;
            document.getElementById('pedidos-count-wrap').classList.remove('hidden');
          }
        } catch (err) {
          // Si falla, la tarjeta de Pedidos se queda sin contador — nunca un número inventado.
        }
      }
    });
  });
})();
