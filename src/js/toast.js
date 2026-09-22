(function () {
  function show(message, variant) {
    let el = document.getElementById('lta-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lta-toast';
      el.className = 'fixed bottom-6 right-6 z-[100] transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none px-5 py-3.5 rounded-xl shadow-2xl font-label-md text-label-md text-inverse-on-surface bg-inverse-surface';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.toggle('bg-error', variant === 'error');
    el.classList.toggle('bg-inverse-surface', variant !== 'error');
    el.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3200);
  }
  window.LTA_TOAST = { show };
})();
