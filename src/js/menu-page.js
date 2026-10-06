(function () {
  const CATEGORY_ORDER = ['tortas', 'tacos', 'tostadas', 'combo-infantil', 'extras', 'postres'];
  const FALLBACK_IMAGE = '../assets/img/catalogo/imagen-no-disponible.jpg';

  function toggleVisible(el, visible, displayClass) {
    el.classList.toggle('hidden', !visible);
    el.classList.toggle(displayClass, visible);
  }

  // Visor de imagen a detalle: tap en la miniatura abre grande + descripción.
  // El botón atrás del navegador/celular también lo cierra (popstate), en
  // vez de sacar al usuario de la página.
  let lightboxOpen = false;
  let lightboxProduct = null;
  let lightboxOnAdd = null;

  function openImageLightbox(product, onAdd) {
    lightboxProduct = product;
    lightboxOnAdd = onAdd;
    document.getElementById('image-lightbox-img').src = product.image || FALLBACK_IMAGE;
    document.getElementById('image-lightbox-name').textContent = product.name;
    document.getElementById('image-lightbox-price').textContent = window.LTA_CATALOG.formatPrice(product.price);
    document.getElementById('image-lightbox-desc').textContent = product.description || product.short_description || '';
    document.getElementById('image-lightbox').classList.remove('pointer-events-none', 'opacity-0');
    document.getElementById('image-lightbox-card').classList.remove('scale-95', 'translate-y-2');
    lightboxOpen = true;
    history.pushState({ ltaLightbox: true }, '', location.href);
  }
  function hideImageLightbox() {
    document.getElementById('image-lightbox').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('image-lightbox-card').classList.add('scale-95', 'translate-y-2');
    lightboxOpen = false;
    lightboxProduct = null;
    lightboxOnAdd = null;
  }
  function closeImageLightbox() {
    if (!lightboxOpen) return;
    history.back();
  }

  // Carrito como pantalla propia (overlay de pantalla completa) en vez de
  // ser el final del scroll del menú — mismo patrón de historial que el
  // visor de imagen, para que el botón atrás cierre en vez de salir de la
  // página. skipPush evita un 2do back innecesario cuando se llega ya con
  // #pedido en la URL (ej. desde el tab "Pedido" de Home).
  let cartOverlayOpen = false;
  function openCartOverlay(opts) {
    if (cartOverlayOpen) return;
    cartOverlayOpen = true;
    document.getElementById('cart-overlay').classList.remove('translate-y-[calc(100%+4rem)]');
    document.getElementById('cart-overlay').setAttribute('aria-hidden', 'false');
    if (!(opts && opts.skipPush)) history.pushState({ ltaCart: true }, '', location.href);
  }
  function hideCartOverlay() {
    document.getElementById('cart-overlay').classList.add('translate-y-[calc(100%+4rem)]');
    document.getElementById('cart-overlay').setAttribute('aria-hidden', 'true');
    cartOverlayOpen = false;
  }
  function closeCartOverlay() {
    if (!cartOverlayOpen) return;
    history.back();
  }

  function renderProductCard(product, onAdd) {
    const article = document.createElement('article');
    article.className = 'bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col';
    const badge = product.requiresValidation
      ? '<span class="inline-block px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] uppercase tracking-wider">Precio requiere validación</span>'
      : '<span></span>';
    const unavailable = product.active === false;
    const thumb = '<img class="thumb-img w-14 h-14 rounded-xl object-cover shrink-0 cursor-pointer" src="' + (product.image || FALLBACK_IMAGE) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMAGE + '\';">';
    article.innerHTML =
      '<div class="p-4 flex items-center justify-between gap-3' + (unavailable ? ' opacity-50' : '') + '">' +
      '  <div class="flex items-center gap-3 min-w-0">' +
      thumb +
      '  <div class="min-w-0">' +
      '    <h3 class="font-headline-sm text-headline-sm text-on-surface leading-tight">' + product.name + '</h3>' +
      '    <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">' + (product.short_description || '') + '</p>' +
      '    <div class="pt-1">' + badge + '</div>' +
      '  </div>' +
      '  </div>' +
      '  <div class="flex flex-col items-end gap-1.5 shrink-0">' +
      '    <span class="font-price-md text-price-md text-primary font-bold">' + window.LTA_CATALOG.formatPrice(product.price) + '</span>' +
      (unavailable
        ? '    <span class="font-label-sm text-label-sm text-error font-bold">Agotado</span>'
        : '    <button class="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm active:scale-90 transition-transform" type="button" aria-label="Agregar ' + product.name + '"><svg class="w-[18px] h-[18px]" aria-hidden="true"><use href="../assets/icons/sprite.svg#icon-plus"/></svg></button>') +
      '  </div>' +
      '</div>';
    if (!unavailable) {
      const addBtn = article.querySelector('button');
      addBtn.addEventListener('click', () => onAdd(product, addBtn));
    }
    article.querySelector('.thumb-img').addEventListener('click', () => openImageLightbox(product, onAdd));
    return article;
  }

  function renderCartLine(item, index, onRemove) {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-container-low';
    row.innerHTML =
      '<div class="min-w-0">' +
      '  <p class="font-label-md text-label-md text-on-surface font-bold truncate">' + item.quantity + 'x ' + item.name + '</p>' +
      (item.salsa ? '  <p class="font-body-sm text-body-sm text-on-surface-variant">' + item.salsa + '</p>' : '') +
      '</div>' +
      '<div class="flex items-center gap-2 shrink-0">' +
      '  <span class="font-price-md text-price-md text-on-surface">' + window.LTA_CATALOG.formatPrice(item.price * item.quantity) + '</span>' +
      '  <button class="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center" aria-label="Quitar" type="button"><svg class="w-4 h-4" aria-hidden="true"><use href="../assets/icons/sprite.svg#icon-close"/></svg></button>' +
      '</div>';
    row.querySelector('button').addEventListener('click', () => onRemove(index));
    return row;
  }

  let currentIdToken = null;
  let currentProfile = null;
  const TERMS_LS_KEY = 'lta_terms_accepted_version';
  let addressMap = null;
  let addressMarker = null;
  // 'empty' (nada capturado aún) | 'approx' (colonia/centro, nunca bloquea) | 'ok' (precisión de calle o pin confirmado)
  let addressState = 'empty';
  let addressColonia = '';
  let addressLocked = false;
  let currentDeliveryFee = 0;
  let deliveryUnavailable = false;

  // Centro aproximado de Morelia — mismo fallback que ya usa analitica-panel.js
  // cuando no hay una ubicación más precisa disponible.
  const MORELIA_CENTER = [19.7008, -101.1844];

  function debounce_(fn, ms) {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /** Arma el texto final que se manda a order.create (delivery_address) a partir de calle+número+colonia+CP. */
  function composeAddress() {
    const street = document.getElementById('field-calle').value.trim();
    const numero = document.getElementById('field-numero').value.trim();
    const cp = document.getElementById('field-cp').value.trim();
    const parts = [];
    if (street) parts.push(street + (numero ? ' ' + numero : ''));
    if (addressColonia) parts.push(addressColonia);
    if (cp) parts.push('CP ' + cp);
    parts.push('Morelia, Michoacán');
    document.getElementById('field-address-input').value = street ? parts.join(', ') : '';
    return parts.join(', ');
  }

  function revealMap() {
    const wrap = document.getElementById('address-map-wrap');
    wrap.classList.remove('hidden');
    wrap.classList.add('flex');
    initAddressMap();
    setTimeout(() => { if (addressMap) addressMap.invalidateSize(); }, 50);
  }

  /** El mapa nunca se queda sin pin — 'ok' (precisión de calle/pin ajustado) o 'approx' (colonia/centro) son los únicos estados finales; nunca bloquea el envío. */
  function setAddressState(state, message) {
    addressState = state;
    const badge = document.getElementById('address-map-badge');
    const dot = document.getElementById('address-map-badge-dot');
    const text = document.getElementById('address-map-badge-text');
    const feedback = document.getElementById('address-feedback');
    const styles = {
      ok: { dot: 'bg-tertiary', label: 'Precisión de calle', msg: message || 'Ubicación confirmada — el pin está en el lugar correcto.' },
      approx: { dot: 'bg-secondary', label: 'Ubicación aproximada', msg: message || 'No encontramos la calle exacta — ajusta el pin a tu casa.' },
      empty: { dot: 'bg-outline', label: '', msg: message || '' }
    };
    const s = styles[state] || styles.empty;
    if (state === 'empty') {
      badge.classList.add('hidden'); badge.classList.remove('flex');
    } else {
      badge.classList.remove('hidden'); badge.classList.add('flex');
      dot.className = 'w-1.5 h-1.5 rounded-full ' + s.dot;
      text.textContent = s.label;
    }
    feedback.textContent = s.msg;
    feedback.className = 'font-label-sm text-[11px] ' + (state === 'ok' ? 'text-tertiary font-semibold' : 'text-on-surface-variant');
    composeAddress();
    const confirmBtn = document.getElementById('btn-confirmar-direccion');
    if (confirmBtn) {
      confirmBtn.classList.toggle('hidden', state === 'empty');
      confirmBtn.disabled = state === 'empty';
    }
    refreshDeliveryQuote();
    if (window.LTA_updateSubmitState) window.LTA_updateSubmitState();
  }

  /** Vista fija: dirección ya confirmada (cuenta guardada o ya la confirmaste en este pedido). */
  function showLockedAddress(lat, lng) {
    addressLocked = true;
    document.getElementById('field-address-lat').value = lat;
    document.getElementById('field-address-lng').value = lng;
    document.getElementById('address-form').classList.add('hidden');
    document.getElementById('address-form').classList.remove('flex-col');
    document.getElementById('address-locked').classList.remove('hidden');
    document.getElementById('address-locked').classList.add('flex');
    document.getElementById('address-locked-text').textContent = document.getElementById('field-address-input').value || composeAddress();
    document.getElementById('address-locked-meta').textContent = currentIdToken
      ? 'Guardada en tu cuenta — la próxima vez no la vuelves a escribir.'
      : 'Confirmada para este pedido.';
    document.getElementById('address-locked-maps-link').href = 'https://maps.google.com/?q=' + lat + ',' + lng;
    if (window.LTA_updateSubmitState) window.LTA_updateSubmitState();
  }

  function enterEditAddress() {
    addressLocked = false;
    document.getElementById('address-locked').classList.add('hidden');
    document.getElementById('address-locked').classList.remove('flex');
    document.getElementById('address-form').classList.remove('hidden');
    document.getElementById('address-form').classList.add('flex-col');
    const lat = Number(document.getElementById('field-address-lat').value);
    const lng = Number(document.getElementById('field-address-lng').value);
    if (lat && lng) {
      revealMap();
      moveMarkerTo(lat, lng, 16);
    }
  }

  /**
   * Cotiza el envío en vivo (delivery.quote) antes de que el cliente pague —
   * el cálculo real y autoritativo se repite server-side en order.create;
   * esto solo evita que el costo "aparezca" hasta después de pagar.
   */
  async function refreshDeliveryQuote() {
    const feeRow = document.getElementById('delivery-fee-row');
    const feeValue = document.getElementById('delivery-fee-value');
    const externalNote = document.getElementById('delivery-external-note');
    deliveryUnavailable = false;

    if (currentOrderType() !== 'delivery') {
      currentDeliveryFee = 0;
      renderCartTotals();
      return;
    }
    const lat = document.getElementById('field-address-lat').value;
    const lng = document.getElementById('field-address-lng').value;
    if (!lat || !lng || (!addressLocked && addressState !== 'ok' && addressState !== 'approx')) {
      currentDeliveryFee = 0;
      feeValue.textContent = 'Se calcula al confirmar tu dirección';
      externalNote.classList.add('hidden');
      renderCartTotals();
      return;
    }
    feeValue.textContent = 'Calculando…';
    try {
      const data = await window.LTA_API.readAction('delivery.quote', {
        branch_id: window.SITE_CONFIG.branchId, lat: lat, lng: lng
      });
      if (currentOrderType() !== 'delivery') return; // el cliente cambió de opción mientras cotizaba
      if (!data.available) {
        deliveryUnavailable = true;
        currentDeliveryFee = 0;
        feeValue.textContent = 'Fuera de zona de cobertura';
        externalNote.classList.add('hidden');
      } else {
        currentDeliveryFee = Number(data.cost) || 0;
        feeValue.textContent = window.LTA_CATALOG.formatPrice(currentDeliveryFee) + ' (' + data.distance_km + ' km)';
        externalNote.classList.remove('hidden');
      }
    } catch (err) {
      currentDeliveryFee = 0;
      feeValue.textContent = 'No se pudo calcular — intenta de nuevo';
      externalNote.classList.add('hidden');
    }
    renderCartTotals();
    if (window.LTA_updateSubmitState) window.LTA_updateSubmitState();
  }

  /** Subtotal + envío (si aplica) — separado de renderCart() para no repintar todo el carrito solo por una cotización. */
  function renderCartTotals() {
    const subtotal = window.LTA_CART.subtotal();
    const isDelivery = currentOrderType() === 'delivery';
    const total = subtotal + (isDelivery ? currentDeliveryFee : 0);
    document.getElementById('cart-total').textContent = window.LTA_CATALOG.formatPrice(total);
  }

  async function onAddressPinDragEnd() {
    const ll = addressMarker.getLatLng();
    document.getElementById('field-address-lat').value = ll.lat;
    document.getElementById('field-address-lng').value = ll.lng;
    const calleEl = document.getElementById('field-calle');
    const previous = calleEl.value;
    setAddressState('approx', 'Buscando dirección de ese punto…');
    try {
      const data = await window.LTA_API.readAction('geo.reverseGeocode', { lat: ll.lat, lng: ll.lng });
      calleEl.value = data.address;
      if (data.cp) document.getElementById('field-cp').value = data.cp;
      addressColonia = data.colonia || addressColonia;
      syncColoniaSelect(addressColonia);
      setAddressState('ok', 'Pin ajustado a mano — así se entrega tu pedido.');
    } catch (err) {
      calleEl.value = previous;
      // Aunque falle el reverse-geocode, el pin ya quedó donde el cliente lo
      // puso a mano — eso sigue siendo válido para calcular el envío.
      setAddressState('approx', 'Pin ajustado a mano — no pudimos traducirlo a texto, pero la ubicación sí quedó guardada.');
    }
  }

  function moveMarkerTo(lat, lng, zoom) {
    document.getElementById('field-address-lat').value = lat;
    document.getElementById('field-address-lng').value = lng;
    if (!addressMap) return;
    addressMap.setView([lat, lng], zoom || 16);
    addressMarker.setLatLng([lat, lng]);
  }

  function initAddressMap() {
    if (addressMap || !window.L) return;
    addressMap = L.map('address-map', { zoomControl: true }).setView(MORELIA_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(addressMap);
    addressMarker = L.marker(MORELIA_CENTER, { draggable: true }).addTo(addressMap);
    addressMarker.on('dragend', onAddressPinDragEnd);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        addressMap.setView(ll, 15);
        addressMarker.setLatLng(ll);
      }, () => { /* sin permiso o sin señal — se queda el centro de Morelia */ }, { enableHighAccuracy: true, timeout: 5000 });
    }
  }

  /**
   * Catálogo CP -> colonias de Morelia, real (SEPOMEX vía
   * correosdemexico.gob.mx, exportado 2026-10-03), empaquetado estático en
   * data/cp-colonias-morelia.json — no depende de que Nominatim/OSM tenga
   * colonias etiquetadas con código postal (casi nunca las tiene en México,
   * por eso geo.colonias vía Nominatim nunca cargaba nada). Se carga una
   * sola vez y se consulta en memoria, sin round-trip a Apps Script.
   */
  let cpColoniasData = null;
  let cpColoniasPromise = null;
  function loadCpColonias_() {
    if (!cpColoniasPromise) {
      cpColoniasPromise = fetch('../data/cp-colonias-morelia.json')
        .then((r) => r.json())
        .then((d) => { cpColoniasData = d; return d; })
        .catch(() => { cpColoniasData = {}; return {}; });
    }
    return cpColoniasPromise;
  }

  /** Reconstruye el <select> de colonia con una lista de nombres (strings). */
  function renderColoniaOptions(names, preselect) {
    const select = document.getElementById('field-colonia');
    if (!names.length) {
      select.disabled = true;
      select.innerHTML = '<option value="">Ninguna colonia encontrada para ese CP</option>';
      return;
    }
    select.disabled = false;
    select.innerHTML = '<option value="">Elige tu colonia</option>' +
      names.map((name) => '<option value="' + name + '"' + (name === preselect ? ' selected' : '') + '>' + name + '</option>').join('');
  }

  /** Si la colonia que ya trae el pin (por búsqueda o drag) no está en la lista del CP, la agrega para que no se pierda la selección. */
  function syncColoniaSelect(colonia) {
    const select = document.getElementById('field-colonia');
    if (!colonia) return;
    const has = Array.from(select.options).some((o) => o.value === colonia);
    if (!has) {
      const opt = document.createElement('option');
      opt.value = colonia; opt.textContent = colonia;
      select.insertBefore(opt, select.firstChild.nextSibling);
    }
    select.value = colonia;
    select.disabled = false;
  }

  async function refreshColoniaOptionsForCp(cp) {
    await loadCpColonias_();
    const names = (cpColoniasData && cpColoniasData[cp]) || [];
    renderColoniaOptions(names, addressColonia);
    return names;
  }

  async function runAddressSearchNow(query) {
    const box = document.getElementById('address-predictions');
    const q = query.trim();
    if (q.length < 4) { box.classList.add('hidden'); return []; }
    try {
      const data = await window.LTA_API.readAction('geo.search', { q: q + ', Morelia, Michoacán' });
      return data.results || [];
    } catch (err) {
      return [];
    }
  }

  const runAddressSearch = debounce_(async (query) => {
    const box = document.getElementById('address-predictions');
    const results = await runAddressSearchNow(query);
    if (!results.length) { box.classList.add('hidden'); return; }
    box.innerHTML = results.map((r, i) =>
      '<button type="button" data-i="' + i + '" class="w-full text-left px-3 py-2.5 font-body-sm text-body-sm text-on-surface border-t border-surface-container-high first:border-t-0 hover:bg-surface-container-low">' + r.label + '</button>'
    ).join('');
    box.classList.remove('hidden');
    Array.from(box.children).forEach((btn, i) => btn.addEventListener('click', () => pickAddressResult(results[i])));
  }, 500);

  function pickAddressResult(r) {
    document.getElementById('field-calle').value = r.label;
    document.getElementById('address-predictions').classList.add('hidden');
    if (r.cp) document.getElementById('field-cp').value = r.cp;
    addressColonia = r.colonia || '';
    revealMap();
    moveMarkerTo(r.lat, r.lng, r.precise ? 17 : 15);
    setAddressState(r.precise ? 'ok' : 'approx');
    if (r.cp) refreshColoniaOptionsForCp(r.cp);
  }

  async function restoreSession() {
    const token = localStorage.getItem('lta_id_token');
    if (!token) return;
    try {
      const data = await window.LTA_API.callAction('client.getProfile', {}, token);
      currentIdToken = token;
      applyProfile(data.profile);
      document.getElementById('signin-invite-checkout').hidden = true;
    } catch (err) {
      localStorage.removeItem('lta_id_token');
    }
  }

  function applyProfile(profile) {
    if (!profile) return;
    currentProfile = profile;
    const nameEl = document.getElementById('field-name');
    const phoneEl = document.getElementById('field-phone');
    if (!nameEl.value && profile.name) nameEl.value = profile.name;
    if (!phoneEl.value && profile.phone) phoneEl.value = profile.phone;
    if (!addressLocked && !document.getElementById('field-calle').value && profile.address) {
      document.getElementById('field-address-input').value = profile.address;
      if (profile.address_lat && profile.address_lng) {
        // Ya tiene un pin confirmado de una sesión anterior — directo a la
        // vista fija, sin pedirle que lo vuelva a buscar.
        showLockedAddress(profile.address_lat, profile.address_lng);
      } else {
        // Perfil de antes de guardar lat/lng — precarga el texto nada más;
        // el mapa se revela hasta que el cliente elija "A domicilio" y toque
        // "Buscar dirección" (así queda guardado completo desde ese momento).
        document.getElementById('field-calle').value = profile.address;
      }
    }
  }

  async function saveProfileFromForm() {
    if (!currentIdToken) return;
    try {
      const payload = {
        name: document.getElementById('field-name').value.trim(),
        phone: document.getElementById('field-phone').value.trim(),
        address: document.getElementById('field-address-input').value.trim() || document.getElementById('field-calle').value.trim()
      };
      const lat = document.getElementById('field-address-lat').value;
      const lng = document.getElementById('field-address-lng').value;
      if (lat && lng) { payload.address_lat = lat; payload.address_lng = lng; }
      await window.LTA_API.callAction('client.upsertProfile', payload, currentIdToken);
    } catch (err) {
      console.warn('No se pudo guardar el perfil:', err.message);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
    window.LTA_PWA_INSTALL.setup(document.getElementById('btn-install'), null);
    restoreSession();

    document.getElementById('image-lightbox-close').addEventListener('click', closeImageLightbox);
    document.getElementById('image-lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'image-lightbox') closeImageLightbox();
    });
    document.getElementById('image-lightbox-add').addEventListener('click', () => {
      if (lightboxOnAdd && lightboxProduct) lightboxOnAdd(lightboxProduct, document.getElementById('image-lightbox-add'));
      closeImageLightbox();
    });
    window.addEventListener('popstate', () => {
      if (lightboxOpen) hideImageLightbox();
      if (cartOverlayOpen) hideCartOverlay();
    });

    document.getElementById('cart-back').addEventListener('click', closeCartOverlay);
    document.getElementById('nav-pedido').addEventListener('click', (e) => {
      e.preventDefault();
      openCartOverlay();
    });
    if (location.hash === '#pedido') openCartOverlay({ skipPush: true });

    window.LTA_INLINE_SIGNIN.render(document.getElementById('signin-invite-checkout'), {
      key: 'checkout',
      message: 'Guarda tu dirección y pide en 10 segundos la próxima vez.',
      iconBase: '../assets/icons/',
      onSignedIn: async (idToken, profile) => {
        currentIdToken = idToken;
        try {
          const data = await window.LTA_API.callAction('client.getProfile', {}, idToken);
          applyProfile(data.profile);
        } catch (err) { /* seguimos con lo que ya escribió */ }
        await saveProfileFromForm();
        window.LTA_TOAST && window.LTA_TOAST.show('Cuenta vinculada. Guardamos tus datos.');
      }
    });

    const sections = document.getElementById('category-sections');
    const cartList = document.getElementById('cart-list');
    const cartEmpty = document.getElementById('cart-empty');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    const deliveryFeeRow = document.getElementById('delivery-fee-row');
    const deliveryFeeValue = document.getElementById('delivery-fee-value');
    const addressField = document.getElementById('field-address');
    const orderTypeRadios = document.querySelectorAll('input[name="order_type"]');
    const deliveryOption = document.getElementById('delivery-option');
    const form = document.getElementById('checkout-form');
    const submitBtn = document.getElementById('submit-order');

    let runtimeConfig = { delivery_enabled: window.SITE_CONFIG.featureFlags.deliveryEnabled };

    function currentOrderType() {
      const checked = document.querySelector('input[name="order_type"]:checked');
      return checked ? checked.value : 'pickup';
    }

    let cartHasItems = false;

    /** Repartidor no puede navegar sin un pin — el submit exige carrito con
     * productos y, si es entrega, una dirección confirmada o bloqueada
     * (nunca se queda en un estado sin salida: 'ok'/'approx' siempre tienen
     * algún pin puesto, aunque sea aproximado). */
    function updateSubmitState() {
      const isDelivery = currentOrderType() === 'delivery';
      const addressOk = !isDelivery || addressLocked || addressState === 'ok' || addressState === 'approx';
      submitBtn.disabled = !cartHasItems || !addressOk || (isDelivery && deliveryUnavailable);
    }
    window.LTA_updateSubmitState = updateSubmitState;

    function renderCart() {
      const items = window.LTA_CART.read();
      cartList.innerHTML = '';
      cartHasItems = items.length > 0;
      if (items.length === 0) {
        cartEmpty.hidden = false;
      } else {
        cartEmpty.hidden = true;
        form.classList.remove('hidden');
        document.getElementById('order-sending').classList.add('hidden');
        document.getElementById('order-sending').classList.remove('flex');
        document.getElementById('order-success').classList.add('hidden');
        document.getElementById('order-success').classList.remove('flex');
        items.forEach((item, i) => cartList.appendChild(renderCartLine(item, i, (idx) => {
          window.LTA_CART.removeAt(idx);
          window.LTA_CART_FLY.bumpBadge(document.getElementById('nav-cart-badge'), window.LTA_CART.count());
          renderCart();
        })));
      }
      const subtotal = window.LTA_CART.subtotal();
      cartSubtotal.textContent = window.LTA_CATALOG.formatPrice(subtotal);
      const isDelivery = currentOrderType() === 'delivery';
      toggleVisible(deliveryFeeRow, isDelivery, 'flex');
      toggleVisible(addressField, isDelivery, 'flex-col');
      if (isDelivery && (addressState === 'ok' || addressState === 'approx') && document.getElementById('address-map-wrap').classList.contains('flex')) {
        setTimeout(() => { if (addressMap) addressMap.invalidateSize(); }, 50);
      }
      refreshDeliveryQuote();
      updateSubmitState();
    }

    // Sincroniza el badge del tab "Pedido" con lo que ya traiga el carrito
    // (ej. si vienes de Home con productos agregados). Aparte del flujo de
    // agregar/quitar — no cuelga de "cart-changed" para no adelantarse a la
    // animación de vuelo, que es la que actualiza el número al agregar.
    window.LTA_CART_FLY.setBadge(document.getElementById('nav-cart-badge'), window.LTA_CART.count());

    orderTypeRadios.forEach((r) => r.addEventListener('change', renderCart));
    document.addEventListener('cart-changed', renderCart);

    loadCpColonias_();

    /**
     * Busca la dirección con lo que ya se tiene (calle+número, colonia, CP) y
     * SIEMPRE deja un pin puesto — calle exacta ('ok'), si no colonia
     * ('approx'), si no el centro de Morelia ('approx' con aviso). Nunca
     * termina en un estado sin salida que le impida seguir con su pedido.
     */
    async function buscarDireccion() {
      const calle = document.getElementById('field-calle').value.trim();
      const numero = document.getElementById('field-numero').value.trim();
      document.getElementById('address-predictions').classList.add('hidden');
      revealMap();
      setAddressState('approx', 'Buscando tu dirección…');

      if (calle.length >= 3) {
        const fullQuery = [calle + (numero ? ' ' + numero : ''), addressColonia, 'Morelia, Michoacán'].filter(Boolean).join(', ');
        const results = await runAddressSearchNow(fullQuery);
        if (results.length) {
          const r = results[0];
          if (!addressColonia && r.colonia) { addressColonia = r.colonia; syncColoniaSelect(addressColonia); }
          moveMarkerTo(r.lat, r.lng, r.precise ? 17 : 15);
          setAddressState(r.precise ? 'ok' : 'approx', r.precise ? undefined : 'Ubicamos la zona, pero no la calle exacta — ajusta el pin a tu casa.');
          return;
        }
      }
      if (addressColonia) {
        try {
          const data = await window.LTA_API.readAction('geo.search', { q: addressColonia + ', Morelia, Michoacán, México' });
          const match = (data.results || [])[0];
          if (match) {
            moveMarkerTo(match.lat, match.lng, 15);
            setAddressState('approx', 'No encontramos esa calle — ubicamos tu colonia, ajusta el pin a tu casa.');
            return;
          }
        } catch (err) { /* sigue al último recurso */ }
      }
      moveMarkerTo(MORELIA_CENTER[0], MORELIA_CENTER[1], 13);
      setAddressState('approx', 'No encontramos tu dirección — arrastra el pin hasta tu casa.');
    }

    document.getElementById('btn-buscar-direccion').addEventListener('click', buscarDireccion);
    document.getElementById('btn-confirmar-direccion').addEventListener('click', () => {
      const lat = document.getElementById('field-address-lat').value;
      const lng = document.getElementById('field-address-lng').value;
      if (lat && lng) showLockedAddress(lat, lng);
    });
    document.getElementById('btn-edit-address').addEventListener('click', enterEditAddress);

    const calleInput = document.getElementById('field-calle');
    calleInput.addEventListener('input', (e) => runAddressSearch(e.target.value));
    calleInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault(); // no mandar el form — este input vive dentro de <form>
      buscarDireccion();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#field-address')) document.getElementById('address-predictions').classList.add('hidden');
    });

    document.getElementById('field-cp').addEventListener('input', (e) => {
      const cp = e.target.value.trim();
      if (cp.length === 5) {
        refreshColoniaOptionsForCp(cp);
      } else {
        renderColoniaOptions([], '');
        document.getElementById('field-colonia').innerHTML = '<option value="">Escribe tu CP primero</option>';
        document.getElementById('field-colonia').disabled = true;
      }
      composeAddress();
    });

    document.getElementById('field-colonia').addEventListener('change', (e) => {
      addressColonia = e.target.value;
      composeAddress();
    });

    function renderMenu(data) {
      runtimeConfig = Object.assign(runtimeConfig, data.config || {});
      toggleVisible(deliveryOption, !!runtimeConfig.delivery_enabled, 'grid');
      toggleVisible(document.getElementById('pickup-only-banner'), !runtimeConfig.delivery_enabled, 'flex');

      const groups = window.LTA_CATALOG.byCategory((data.products || []).sort((a, b) => a.sort_order - b.sort_order));
      const orderedGroups = CATEGORY_ORDER
        .map((id) => groups.find((g) => g.category_id === id))
        .filter(Boolean)
        .concat(groups.filter((g) => !CATEGORY_ORDER.includes(g.category_id)));

      sections.innerHTML = '';
      orderedGroups.forEach((group) => {
        const section = document.createElement('section');
        section.id = group.category_id;
        section.className = 'px-margin py-3 scroll-mt-32';
        const heading = document.createElement('h2');
        heading.className = 'font-headline-md text-headline-md text-on-surface mb-3';
        heading.textContent = group.category;
        section.appendChild(heading);
        const list = document.createElement('div');
        list.className = 'flex flex-col gap-2.5';
        group.items.forEach((product) => {
          list.appendChild(renderProductCard(product, (p, btn) => {
            window.LTA_CART.addItem(p, {});
            window.LTA_CART_FLY.fly(btn, document.getElementById('nav-pedido'), () => {
              window.LTA_CART_FLY.bumpBadge(document.getElementById('nav-cart-badge'), window.LTA_CART.count());
            });
          }));
        });
        section.appendChild(list);
        sections.appendChild(section);
      });

      setupCategorySpy();
      renderCart();
    }

    // Scroll-spy: la pastilla de categoría se resalta sola según qué
    // sección está en pantalla — antes ninguna reflejaba el scroll.
    let categorySpyObserver = null;
    function setupCategorySpy() {
      if (categorySpyObserver) categorySpyObserver.disconnect();
      const pills = Array.from(document.querySelectorAll('.category-pill'));
      if (!pills.length) return;

      function setActivePill(id) {
        pills.forEach((p) => {
          const active = p.getAttribute('href') === '#' + id;
          p.classList.toggle('bg-primary', active);
          p.classList.toggle('text-on-primary', active);
          p.classList.toggle('border-primary', active);
          p.classList.toggle('shadow-sm', active);
          p.classList.toggle('text-on-surface-variant', !active);
          p.classList.toggle('border-outline-variant', !active);
          if (active) p.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
      }

      const visible = new Set();
      categorySpyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        // El primero en orden del documento que sigue visible manda — evita
        // que una sección corta al final "gane" solo por asomar un pixel.
        const orderedIds = Array.from(sections.children).map((s) => s.id);
        const current = orderedIds.find((id) => visible.has(id));
        if (current) setActivePill(current);
      }, { rootMargin: '-130px 0px -60% 0px', threshold: 0 });

      Array.from(sections.children).forEach((sec) => categorySpyObserver.observe(sec));
      setActivePill(pills[0].getAttribute('href').slice(1));
    }

    // Pinta rápido con el snapshot (no bloquea el LCP) y, apenas llegue,
    // vuelve a pintar con el refresco en vivo del Sheet — sin recargar la
    // página ni esperar al próximo build/deploy.
    window.LTA_CATALOG.onUpdate(renderMenu);
    window.LTA_CATALOG.load().then(renderMenu);

    const sendingEl = document.getElementById('order-sending');

    async function submitOrder() {
      submitBtn.disabled = true;
      form.classList.add('hidden');
      sendingEl.classList.remove('hidden');
      sendingEl.classList.add('flex');

      const items = window.LTA_CART.read();
      const customer = {
        name: document.getElementById('field-name').value.trim(),
        phone: document.getElementById('field-phone').value.trim(),
        address: document.getElementById('field-address-input').value.trim(),
        lat: document.getElementById('field-address-lat').value,
        lng: document.getElementById('field-address-lng').value,
        notes: document.getElementById('field-notes').value.trim(),
        orderType: currentOrderType()
      };

      let result;
      try {
        result = await window.LTA_API.callAction('order.create', {
          branch_id: window.SITE_CONFIG.branchId,
          customer_name: customer.name,
          customer_phone: customer.phone,
          order_type: customer.orderType,
          delivery_address: customer.address,
          delivery_lat: customer.lat,
          delivery_lng: customer.lng,
          notes: customer.notes,
          items: items
        }, currentIdToken);
      } catch (err) {
        sendingEl.classList.add('hidden');
        sendingEl.classList.remove('flex');
        form.classList.remove('hidden');
        submitBtn.disabled = false;
        const msg = (err && err.message) || 'No se pudo enviar tu pedido — revisa tu conexión e intenta de nuevo.';
        window.LTA_TOAST && window.LTA_TOAST.show(msg, 'error');
        return;
      }

      const folio = result.order_id;

      if (currentIdToken) await saveProfileFromForm();
      window.LTA_CART.clear();

      sendingEl.classList.add('hidden');
      sendingEl.classList.remove('flex');
      const successEl = document.getElementById('order-success');
      successEl.classList.remove('hidden');
      successEl.classList.add('flex');
      document.getElementById('success-folio').textContent = folio;
      document.getElementById('success-tracking-link').href =
        '../cuenta/rastreo/?folio=' + encodeURIComponent(folio) + '&tel=' + encodeURIComponent(customer.phone);

      // El fee de envío se calcula server-side (geocoding + zona) — aquí solo
      // mostramos lo que Code.gs ya regresó en la respuesta de order.create.
      if (result.total != null) {
        document.getElementById('success-total-value').textContent = window.LTA_CATALOG.formatPrice(result.total);
        const totalRow = document.getElementById('success-total-row');
        totalRow.classList.remove('hidden');
        totalRow.classList.add('flex');
        if (customer.orderType === 'delivery' && result.delivery_fee) {
          document.getElementById('success-total-label').textContent = 'Total a pagar (incluye envío)';
          const feeNote = document.getElementById('success-fee-note');
          feeNote.textContent = 'Envío a tu zona: ' + window.LTA_CATALOG.formatPrice(result.delivery_fee);
          feeNote.classList.remove('hidden');
        }
      }

      if (!currentIdToken) {
        window.LTA_INLINE_SIGNIN.render(document.getElementById('signin-invite-postorder'), {
          key: 'postorder',
          message: '¿Guardamos estos datos para tu próximo pedido?',
          iconBase: '../assets/icons/',
          onSignedIn: async (idToken) => {
            currentIdToken = idToken;
            await window.LTA_API.callAction('client.upsertProfile', {
              name: customer.name, phone: customer.phone, address: customer.address
            }, idToken).catch(() => {});
            window.LTA_TOAST && window.LTA_TOAST.show('¡Guardado! La próxima vez pides más rápido.');
          }
        });
      }
    }

    function hasAcceptedTerms() {
      const version = runtimeConfig.terms_version;
      if (!version) return true; // sin versión configurada todavía, no hay nada que pedir
      if (currentIdToken) return !!(currentProfile && currentProfile.accepted_terms_version === version);
      return localStorage.getItem(TERMS_LS_KEY) === version;
    }

    async function recordTermsAccepted() {
      const version = runtimeConfig.terms_version;
      if (currentIdToken) {
        try { await window.LTA_API.callAction('client.acceptTerms', { version }, currentIdToken); } catch (err) { /* no bloquea el pedido por esto */ }
        currentProfile = Object.assign({}, currentProfile, { accepted_terms_version: version });
      } else {
        localStorage.setItem(TERMS_LS_KEY, version);
      }
    }

    function showTermsGate() {
      document.getElementById('terms-gate-modal').classList.remove('hidden');
      document.getElementById('terms-gate-modal').classList.add('flex');
    }
    function hideTermsGate() {
      document.getElementById('terms-gate-modal').classList.add('hidden');
      document.getElementById('terms-gate-modal').classList.remove('flex');
    }

    document.getElementById('terms-gate-check').addEventListener('change', (e) => {
      document.getElementById('terms-gate-continue').disabled = !e.target.checked;
    });
    document.getElementById('terms-gate-cancel').addEventListener('click', hideTermsGate);
    document.getElementById('terms-gate-continue').addEventListener('click', async () => {
      await recordTermsAccepted();
      hideTermsGate();
      await submitOrder();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!hasAcceptedTerms()) { showTermsGate(); return; }
      await submitOrder();
    });
  });
})();
