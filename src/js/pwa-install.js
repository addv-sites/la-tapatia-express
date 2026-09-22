/**
 * Botón "Instalar": prompt real en Android/desktop (beforeinstallprompt),
 * modal de instrucciones manuales en iOS (Safari no dispara ese evento),
 * oculto si ya corre en modo standalone.
 */
(function () {
  let deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
  }

  function show(el) { el.classList.remove('hidden'); el.classList.add('flex'); }
  function hide(el) { el.classList.add('hidden'); el.classList.remove('flex'); }

  function setup(buttonEl, iosModalEl) {
    if (!buttonEl) return;
    hide(buttonEl);
    if (isStandalone()) return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      show(buttonEl);
    });

    buttonEl.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        return;
      }
      if (isIos() && iosModalEl) {
        iosModalEl.style.display = 'flex';
      }
    });

    if (isIos() && !isStandalone()) {
      show(buttonEl); // en iOS no hay beforeinstallprompt: mostramos igual, abre el modal instructivo
    }
  }

  window.LTA_PWA_INSTALL = { setup, isStandalone, isIos };
})();
