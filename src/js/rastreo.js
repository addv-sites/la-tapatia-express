(function () {
  const STEPS = [
    { statuses: ['pendiente', 'confirmado', 'en_cocina', 'listo', 'en_reparto', 'entregado'], label: 'Recibido y confirmado' },
    { statuses: ['en_cocina', 'listo', 'en_reparto', 'entregado'], label: 'En la cocina' },
    { statuses: ['listo', 'en_reparto', 'entregado'], label: 'Listo' },
    { statuses: ['en_reparto', 'entregado'], label: 'En camino / para recoger' },
    { statuses: ['entregado'], label: 'Entregado' }
  ];

  function parseItems(order) {
    try { return JSON.parse(order.items || '[]'); } catch (e) { return []; }
  }

  const REFRESH_MS = 20000;
  let refreshTimer = null;
  let lastKnownStatus = null;
  let lastFolio = null;
  let lastTel = null;
  let lastCurrentStepIndex = null;

  // Alinea la línea conectora (track + relleno) con el centro real del
  // primer y último círculo — getBoundingClientRect en vez de matemática
  // fija de píxeles porque el label "En camino / para recoger" puede hacer
  // wrap en pantallas angostas y desalinearía una línea calculada a mano.
  function layoutStepsLine(container, firstCircle, lastCircle, trackEl, fillEl) {
    const containerRect = container.getBoundingClientRect();
    const firstRect = firstCircle.getBoundingClientRect();
    const lastRect = lastCircle.getBoundingClientRect();
    const left = firstRect.left - containerRect.left + firstRect.width / 2;
    const top = firstRect.top - containerRect.top + firstRect.height / 2;
    const totalH = (lastRect.top - containerRect.top + lastRect.height / 2) - top;
    trackEl.style.left = left + 'px';
    trackEl.style.top = top + 'px';
    trackEl.style.height = totalH + 'px';
    fillEl.style.left = left + 'px';
    fillEl.style.top = top + 'px';
    return totalH;
  }

  // Ding suave, una sola vez, cuando el estado cambia solo durante el
  // auto-refresh — no es la alarma del KDS/repartidor, es un aviso pasivo.
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
    [880, 1108].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.09);
      gain.gain.setValueAtTime(0, t + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.22, t + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.55);
    });
  }

  async function silentRefresh() {
    try {
      const data = await window.LTA_API.callAction('order.trackingRead', { order_id: lastFolio, customer_phone: lastTel });
      if (data.order.status !== lastKnownStatus) {
        playChime();
        renderOrder(data.order);
      }
    } catch (err) {
      // Pedido ya no encontrado / red caída — se reintenta en el próximo ciclo, sin romper la vista actual.
    }
  }

  function renderOrder(order) {
    lastKnownStatus = order.status;
    if (!refreshTimer && !['entregado', 'cancelado', 'abandonado'].includes(order.status)) {
      refreshTimer = setInterval(silentRefresh, REFRESH_MS);
    }
    if (['entregado', 'cancelado', 'abandonado'].includes(order.status) && refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }

    document.getElementById('lookup-form').classList.add('hidden');
    const el = document.getElementById('tracking-result');
    el.classList.remove('hidden');
    el.classList.add('flex');

    document.getElementById('result-folio').textContent = order.order_id;
    document.getElementById('result-total').textContent = window.LTA_CATALOG.formatPrice(order.total);

    const items = parseItems(order);
    const itemsEl = document.getElementById('result-items');
    itemsEl.innerHTML = items.map((it) =>
      '<div class="flex justify-between font-body-sm text-body-sm text-on-surface-variant"><span>' + it.quantity + 'x ' + it.name + '</span></div>'
    ).join('');

    const stepsEl = document.getElementById('result-steps');
    stepsEl.innerHTML =
      '<div class="rastreo-line-track absolute w-0.5 bg-surface-container-high" id="rastreo-line-track"></div>' +
      '<div class="rastreo-line-fill absolute w-0.5 bg-tertiary" id="rastreo-line-fill" style="height:0px"></div>';

    const doneFlags = STEPS.map((step) => step.statuses.includes(order.status));
    const isTerminal = order.status === 'entregado';
    let currentStepIndex = -1;
    for (let i = doneFlags.length - 1; i >= 0; i--) {
      if (doneFlags[i]) { currentStepIndex = i; break; }
    }

    STEPS.forEach((step, i) => {
      const done = doneFlags[i];
      const isCurrent = i === currentStepIndex && !isTerminal;
      const row = document.createElement('div');
      row.className = 'relative z-10 flex items-center gap-3' + (done ? '' : ' opacity-40');
      row.innerHTML =
        '<div class="step-circle relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' +
        (done ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high text-on-surface-variant') +
        (isCurrent ? ' rastreo-pulse' : '') + '">' +
        (done ? '<svg class="w-4 h-4" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-check"/></svg>' : '') +
        '</div>' +
        '<span class="font-label-md text-label-md ' + (done ? 'text-on-surface font-bold' : 'text-on-surface-variant') + '">' + step.label + '</span>';
      stepsEl.appendChild(row);
    });

    // Doble rAF: el primer frame ubica la línea y deja el relleno en 0,
    // el segundo dispara la transición de height hacia el valor real —
    // en un solo rAF el navegador a veces junta ambos cambios en el mismo
    // frame y la línea aparece ya rellena, sin animar.
    requestAnimationFrame(() => {
      const circles = stepsEl.querySelectorAll('.step-circle');
      const track = document.getElementById('rastreo-line-track');
      const fill = document.getElementById('rastreo-line-fill');
      const totalH = layoutStepsLine(stepsEl, circles[0], circles[circles.length - 1], track, fill);
      const doneCount = doneFlags.filter(Boolean).length;
      const fillH = doneCount > 1 ? (doneCount - 1) / (STEPS.length - 1) * totalH : 0;
      requestAnimationFrame(() => { fill.style.height = fillH + 'px'; });

      if (currentStepIndex !== -1 && lastCurrentStepIndex !== null && currentStepIndex !== lastCurrentStepIndex) {
        const circle = circles[currentStepIndex];
        circle.classList.add('rastreo-bounce');
        circle.addEventListener('animationend', () => circle.classList.remove('rastreo-bounce'), { once: true });
      }
      lastCurrentStepIndex = currentStepIndex;
    });

    const wa = document.getElementById('result-whatsapp');
    wa.href = 'https://wa.me/' + window.SITE_CONFIG.whatsapp + '?text=' + encodeURIComponent('Hola, tengo duda con mi pedido ' + order.order_id);
  }

  function showResultSkeleton() {
    document.getElementById('lookup-form').classList.add('hidden');
    const el = document.getElementById('tracking-result');
    el.classList.remove('hidden');
    el.classList.add('flex');
    document.getElementById('result-folio').innerHTML = '<span class="skeleton rounded-lg inline-block h-7 w-32"></span>';
    document.getElementById('result-total').innerHTML = '<span class="skeleton rounded-lg inline-block h-5 w-16"></span>';
    document.getElementById('result-steps').innerHTML = '<div class="skeleton rounded-xl h-8 mb-2"></div>'.repeat(5);
    document.getElementById('result-items').innerHTML = '<div class="skeleton rounded-lg h-4 mb-2"></div><div class="skeleton rounded-lg h-4"></div>';
  }

  async function lookup(folio, tel) {
    lastFolio = folio;
    lastTel = tel;
    lastCurrentStepIndex = null;
    const errorEl = document.getElementById('lookup-error');
    errorEl.classList.add('hidden');
    showResultSkeleton();
    try {
      const data = await window.LTA_API.callAction('order.trackingRead', { order_id: folio, customer_phone: tel });
      renderOrder(data.order);
    } catch (err) {
      document.getElementById('tracking-result').classList.add('hidden');
      document.getElementById('tracking-result').classList.remove('flex');
      document.getElementById('lookup-form').classList.remove('hidden');
      errorEl.textContent = 'No encontramos ese pedido con ese folio y teléfono. Revisa los datos.';
      errorEl.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    const folio = params.get('folio');
    const tel = params.get('tel');

    document.getElementById('lookup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      lookup(document.getElementById('input-folio').value.trim(), document.getElementById('input-tel').value.trim());
    });

    if (folio && tel) {
      document.getElementById('input-folio').value = folio;
      document.getElementById('input-tel').value = tel;
      lookup(folio, tel);
    }
  });

  window.addEventListener('beforeunload', () => { if (refreshTimer) clearInterval(refreshTimer); });
})();
