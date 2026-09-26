(function () {
  function wireShareButton() {
    const btn = document.getElementById('btn-share-repartidor');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const url = new URL('../repartidor/', location.href).href;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'App Repartidor — La Tapatía Express', url });
        } catch (err) {
          // Usuario canceló el share sheet — no es un error a mostrar.
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        window.LTA_TOAST.show('Enlace copiado.');
      } else {
        window.LTA_TOAST.show(url);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireShareButton();
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
            document.getElementById('pedidos-card').classList.add('pedidos-alert');
          }
        } catch (err) {
          // Si falla, la tarjeta de Pedidos se queda sin contador — nunca un número inventado.
        }
      }
    });
  });
})();
