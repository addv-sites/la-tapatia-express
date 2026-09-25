/**
 * Animación "volar al carrito": una burbuja roja viaja del botón que
 * agregó el platillo hasta el tab "Pedido" de la barra inferior, en
 * arco (curva seno), y dispara un bump en el contador al aterrizar.
 */
(function () {
  function fly(fromEl, toEl, onArrive) {
    if (!fromEl || !toEl) { if (onArrive) onArrive(); return; }

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + 8;

    const dx = endX - startX;
    const dy = endY - startY;
    const arcHeight = 110;

    const STEPS = 10;
    const keyframes = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const x = dx * t;
      const y = dy * t - Math.sin(Math.PI * t) * arcHeight;
      const scale = 1 - 0.7 * t;
      keyframes.push({
        transform: 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')',
        offset: t,
        opacity: t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15 * 0.4
      });
    }

    const flyer = document.createElement('div');
    flyer.className = 'cart-flyer';
    flyer.style.left = (startX - 7) + 'px';
    flyer.style.top = (startY - 7) + 'px';
    document.body.appendChild(flyer);

    const anim = flyer.animate(keyframes, { duration: 900, easing: 'cubic-bezier(.45,.05,.55,.95)' });
    anim.onfinish = function () {
      flyer.remove();
      if (onArrive) onArrive();
    };
  }

  /** Actualiza el badge numérico del tab "Pedido" y lo hace rebotar. */
  function bumpBadge(badgeEl, count) {
    if (!badgeEl) return;
    badgeEl.textContent = count;
    badgeEl.classList.toggle('show', count > 0);
    badgeEl.classList.remove('cart-bump');
    void badgeEl.offsetWidth;
    badgeEl.classList.add('cart-bump');
  }

  window.LTA_CART_FLY = { fly: fly, bumpBadge: bumpBadge };
})();
