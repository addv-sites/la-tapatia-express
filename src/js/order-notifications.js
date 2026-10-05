/**
 * Campana de notificaciones del cliente: avisa cuando el estado de uno
 * de sus pedidos cambia. Solo aplica si el cliente inició sesión con
 * Google (checkout o cuenta/perfil) — sin eso no hay forma de saber
 * cuáles son "sus" pedidos (order.listMine resuelve por ID token, nunca
 * por dato declarado por el cliente).
 */
(function () {
  const POLL_MS = 25000;
  const SEEN_KEY = 'lta_order_status_seen';
  const MAX_NOTIFS = 10;

  const STATUS_LABELS = {
    pendiente: 'Pendiente de confirmar',
    confirmado: 'Confirmado',
    en_cocina: 'En cocina',
    listo: 'Listo',
    en_reparto: 'En camino',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
    abandonado: 'Cancelado'
  };

  let notifications = [];
  let unreadCount = 0;
  let pollTimer = null;

  function readSeen() {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeSeen(map) {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  }

  // ---- Ding suave, una sola vez — distinto de las alarmas de KDS/repartidor ----
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  (function primeAudioOnFirstGesture() {
    const unlock = () => {
      ensureAudio();
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchend', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchend', unlock);
  })();
  function playChime() {
    const ctx = ensureAudio();
    const t = ctx.currentTime + 0.02;
    const fundamental = 660;
    const partials = [
      { ratio: 1,    gain: 0.26, decay: 1.1 },
      { ratio: 2.01, gain: 0.14, decay: 0.9 },
      { ratio: 3.0,  gain: 0.08, decay: 0.7 }
    ];
    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.ratio, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(p.gain, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + p.decay + 0.05);
    });
  }

  function renderPanel() {
    const list = document.getElementById('bell-notif-list');
    if (!list) return;
    if (!notifications.length) {
      list.innerHTML = '<div class="p-6 text-center font-body-sm text-body-sm text-on-surface-variant">Sin novedades por ahora.</div>';
      return;
    }
    list.innerHTML = notifications.map((n) =>
      '<div class="flex gap-2.5 p-3 border-t border-surface-container-low first:border-t-0">' +
      '  <span class="w-2 h-2 rounded-full bg-tertiary shrink-0 mt-1.5"></span>' +
      '  <div class="min-w-0">' +
      '    <p class="font-label-sm text-label-sm font-bold text-on-surface">Pedido ' + n.orderId + ' — ' + n.label + '</p>' +
      '    <p class="font-label-sm text-[10.5px] text-on-surface-variant mt-0.5">' + n.when + '</p>' +
      '  </div>' +
      '</div>'
    ).join('');
  }

  function updateBadge() {
    const badge = document.getElementById('bell-badge');
    if (!badge) return;
    badge.textContent = unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);
    badge.classList.toggle('flex', unreadCount > 0);
  }

  function addNotification(orderId, status) {
    const label = status === 'en_reparto' ? 'Tu pedido va en camino 🛵' : (STATUS_LABELS[status] || status);
    notifications.unshift({
      orderId,
      label,
      when: 'hace un momento'
    });
    notifications = notifications.slice(0, MAX_NOTIFS);
    unreadCount++;
    updateBadge();
    renderPanel();

    const badge = document.getElementById('bell-badge');
    if (badge) { badge.classList.remove('cart-bump'); void badge.offsetWidth; badge.classList.add('cart-bump'); }
    const bellIcon = document.getElementById('bell-icon');
    if (bellIcon) { bellIcon.classList.remove('bell-ring'); void bellIcon.offsetWidth; bellIcon.classList.add('bell-ring'); }
    playChime();
    try { if ('vibrate' in navigator) navigator.vibrate([400, 150, 400]); } catch (e) {}
  }

  async function poll(token) {
    let data;
    try {
      data = await window.LTA_API.callAction('order.listMine', {}, token);
    } catch (err) {
      return; // sin conexión o token vencido — se reintenta en el próximo poll
    }
    const orders = data.orders || [];
    const seen = readSeen();
    let changed = false;
    orders.forEach((o) => {
      const prev = seen[o.order_id];
      if (prev !== undefined && prev !== o.status) {
        addNotification(o.order_id, o.status);
      }
      if (prev !== o.status) { seen[o.order_id] = o.status; changed = true; }
    });
    if (changed) writeSeen(seen);
  }

  function togglePanel() {
    const panel = document.getElementById('bell-panel');
    if (!panel) return;
    const opening = panel.classList.contains('hidden') || panel.classList.contains('opacity-0');
    if (opening) {
      panel.classList.remove('hidden', 'opacity-0', 'scale-95', 'pointer-events-none');
      unreadCount = 0;
      updateBadge();
    } else {
      panel.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    }
  }

  function init() {
    const token = localStorage.getItem('lta_id_token');
    const bellWrap = document.getElementById('bell-wrap');
    if (!token || !bellWrap) return; // sin sesión, no hay campana que mostrar

    bellWrap.classList.remove('hidden');
    document.getElementById('bell-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('bell-panel');
      if (panel && !panel.classList.contains('hidden') && !panel.classList.contains('opacity-0') && !bellWrap.contains(e.target)) {
        togglePanel();
      }
    });

    poll(token);
    pollTimer = setInterval(() => poll(token), POLL_MS);
  }

  window.addEventListener('beforeunload', () => { if (pollTimer) clearInterval(pollTimer); });

  document.addEventListener('DOMContentLoaded', init);
  window.LTA_ORDER_NOTIFS = { init };
})();
