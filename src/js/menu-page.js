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
  let addressMap = null;
  let addressMarker = null;

  // Centro aproximado de Morelia — mismo fallback que ya usa analitica-panel.js
  // cuando no hay una ubicación más precisa disponible.
  const MORELIA_CENTER = [19.7008, -101.1844];

  async function onAddressPinDragEnd() {
    const ll = addressMarker.getLatLng();
    const input = document.getElementById('field-address-input');
    const previous = input.value;
    input.value = 'Buscando dirección...';
    try {
      const data = await window.LTA_API.readAction('geo.reverseGeocode', { lat: ll.lat, lng: ll.lng });
      input.value = data.address;
    } catch (err) {
      input.value = previous;
      window.LTA_TOAST && window.LTA_TOAST.show('No se pudo obtener la dirección de ese punto — intenta de nuevo.', 'error');
    }
  }

  function initAddressMap() {
    if (addressMap || !window.L) return;
    addressMap = L.map('address-map', { zoomControl: true }).setView(MORELIA_CENTER, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(addressMap);
    addressMarker = L.marker(MORELIA_CENTER, { draggable: true }).addTo(addressMap);
    addressMarker.on('dragend', onAddressPinDragEnd);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        addressMap.setView(ll, 16);
        addressMarker.setLatLng(ll);
      }, () => { /* sin permiso o sin señal — se queda el centro de Morelia */ }, { enableHighAccuracy: true, timeout: 5000 });
    }
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
    const nameEl = document.getElementById('field-name');
    const phoneEl = document.getElementById('field-phone');
    const addrEl = document.getElementById('field-address-input');
    if (!nameEl.value && profile.name) nameEl.value = profile.name;
    if (!phoneEl.value && profile.phone) phoneEl.value = profile.phone;
    if (!addrEl.value && profile.address) addrEl.value = profile.address;
  }

  async function saveProfileFromForm() {
    if (!currentIdToken) return;
    try {
      await window.LTA_API.callAction('client.upsertProfile', {
        name: document.getElementById('field-name').value.trim(),
        phone: document.getElementById('field-phone').value.trim(),
        address: document.getElementById('field-address-input').value.trim()
      }, currentIdToken);
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
    });

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

    function renderCart() {
      const items = window.LTA_CART.read();
      cartList.innerHTML = '';
      if (items.length === 0) {
        cartEmpty.hidden = false;
        submitBtn.disabled = true;
      } else {
        cartEmpty.hidden = true;
        submitBtn.disabled = false;
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
      cartTotal.textContent = window.LTA_CATALOG.formatPrice(subtotal);
      toggleVisible(addressField, isDelivery, 'flex-col');
    }

    // Sincroniza el badge del tab "Pedido" con lo que ya traiga el carrito
    // (ej. si vienes de Home con productos agregados). Aparte del flujo de
    // agregar/quitar — no cuelga de "cart-changed" para no adelantarse a la
    // animación de vuelo, que es la que actualiza el número al agregar.
    window.LTA_CART_FLY.setBadge(document.getElementById('nav-cart-badge'), window.LTA_CART.count());

    orderTypeRadios.forEach((r) => r.addEventListener('change', renderCart));
    document.addEventListener('cart-changed', renderCart);

    document.getElementById('btn-toggle-map').addEventListener('click', () => {
      const wrap = document.getElementById('address-map-wrap');
      const willShow = wrap.classList.contains('hidden');
      wrap.classList.toggle('hidden', !willShow);
      wrap.classList.toggle('flex', willShow);
      if (willShow) {
        setTimeout(() => {
          initAddressMap();
          if (addressMap) addressMap.invalidateSize();
        }, 50);
      }
    });

    function renderMenu(data) {
      runtimeConfig = Object.assign(runtimeConfig, data.config || {});
      toggleVisible(deliveryOption, !!runtimeConfig.delivery_enabled, 'grid');

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

      renderCart();
    }

    // Pinta rápido con el snapshot (no bloquea el LCP) y, apenas llegue,
    // vuelve a pintar con el refresco en vivo del Sheet — sin recargar la
    // página ni esperar al próximo build/deploy.
    window.LTA_CATALOG.onUpdate(renderMenu);
    window.LTA_CATALOG.load().then(renderMenu);

    const sendingEl = document.getElementById('order-sending');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      form.classList.add('hidden');
      sendingEl.classList.remove('hidden');
      sendingEl.classList.add('flex');

      const items = window.LTA_CART.read();
      const customer = {
        name: document.getElementById('field-name').value.trim(),
        phone: document.getElementById('field-phone').value.trim(),
        address: document.getElementById('field-address-input').value.trim(),
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
          notes: customer.notes,
          items: items
        }, currentIdToken);
      } catch (err) {
        sendingEl.classList.add('hidden');
        sendingEl.classList.remove('flex');
        form.classList.remove('hidden');
        submitBtn.disabled = false;
        window.LTA_TOAST && window.LTA_TOAST.show('No se pudo enviar tu pedido — revisa tu conexión e intenta de nuevo.', 'error');
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
    });
  });
})();
