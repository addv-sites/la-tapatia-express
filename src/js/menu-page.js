(function () {
  const CATEGORY_ORDER = ['tortas', 'tacos', 'tostadas', 'combo-infantil', 'extras', 'postres'];

  function toggleVisible(el, visible, displayClass) {
    el.classList.toggle('hidden', !visible);
    el.classList.toggle(displayClass, visible);
  }

  function whatsappUrl(text) {
    const cfg = window.SITE_CONFIG;
    return 'https://wa.me/' + cfg.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  function buildWhatsappMessage(folio, items, totals, customer) {
    const lines = [];
    if (folio) lines.push('*Folio: ' + folio + '*', '');
    lines.push('Hola, quiero confirmar mi pedido en ' + window.SITE_CONFIG.businessName + ':', '');
    items.forEach((it) => {
      lines.push('1. ' + it.name + ' x' + it.quantity + (it.salsa ? '  (Salsa: ' + it.salsa + ')' : ''));
    });
    lines.push('', 'Subtotal: ' + window.LTA_CATALOG.formatPrice(totals.subtotal));
    if (totals.deliveryFee) lines.push('Envío: ' + window.LTA_CATALOG.formatPrice(totals.deliveryFee));
    lines.push('Total: ' + window.LTA_CATALOG.formatPrice(totals.total), '');
    lines.push('Nombre: ' + customer.name);
    lines.push('Teléfono: ' + customer.phone);
    if (customer.orderType === 'delivery') lines.push('Dirección: ' + customer.address);
    if (customer.notes) lines.push('', 'Notas:', customer.notes);
    return lines.join('\n');
  }

  function renderProductCard(product, onAdd) {
    const article = document.createElement('article');
    article.className = 'bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col';
    const badge = product.requiresValidation
      ? '<span class="inline-block px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] uppercase tracking-wider">Precio requiere validación</span>'
      : '<span></span>';
    const unavailable = product.active === false;
    article.innerHTML =
      '<div class="p-4 flex items-center justify-between gap-3' + (unavailable ? ' opacity-50' : '') + '">' +
      '  <div class="min-w-0">' +
      '    <h3 class="font-headline-sm text-headline-sm text-on-surface leading-tight">' + product.name + '</h3>' +
      '    <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">' + (product.short_description || '') + '</p>' +
      '    <div class="pt-1">' + badge + '</div>' +
      '  </div>' +
      '  <div class="flex flex-col items-end gap-1.5 shrink-0">' +
      '    <span class="font-price-md text-price-md text-primary font-bold">' + window.LTA_CATALOG.formatPrice(product.price) + '</span>' +
      (unavailable
        ? '    <span class="font-label-sm text-label-sm text-error font-bold">Agotado</span>'
        : '    <button class="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm active:scale-90 transition-transform" type="button" aria-label="Agregar ' + product.name + '"><svg class="w-[18px] h-[18px]" aria-hidden="true"><use href="../assets/icons/sprite.svg#icon-plus"/></svg></button>') +
      '  </div>' +
      '</div>';
    if (!unavailable) article.querySelector('button').addEventListener('click', () => onAdd(product));
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

  async function restoreSession() {
    const token = sessionStorage.getItem('lta_id_token');
    if (!token) return;
    try {
      const data = await window.LTA_API.callAction('client.getProfile', {}, token);
      currentIdToken = token;
      applyProfile(data.profile);
      document.getElementById('signin-invite-checkout').hidden = true;
    } catch (err) {
      sessionStorage.removeItem('lta_id_token');
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
        items.forEach((item, i) => cartList.appendChild(renderCartLine(item, i, (idx) => {
          window.LTA_CART.removeAt(idx);
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

    orderTypeRadios.forEach((r) => r.addEventListener('change', renderCart));
    document.addEventListener('cart-changed', renderCart);

    window.LTA_CATALOG.load().then((data) => {
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
          list.appendChild(renderProductCard(product, (p) => window.LTA_CART.addItem(p, {})));
        });
        section.appendChild(list);
        sections.appendChild(section);
      });

      renderCart();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      const items = window.LTA_CART.read();
      const customer = {
        name: document.getElementById('field-name').value.trim(),
        phone: document.getElementById('field-phone').value.trim(),
        address: document.getElementById('field-address-input').value.trim(),
        notes: document.getElementById('field-notes').value.trim(),
        orderType: currentOrderType()
      };
      const subtotal = window.LTA_CART.subtotal();
      let totals = { subtotal, deliveryFee: 0, total: subtotal };
      let folio = null;

      try {
        const result = await window.LTA_API.callAction('order.create', {
          branch_id: window.SITE_CONFIG.branchId,
          customer_name: customer.name,
          customer_phone: customer.phone,
          order_type: customer.orderType,
          delivery_address: customer.address,
          notes: customer.notes,
          items: items
        }, currentIdToken);
        folio = result.order_id;
        totals = { subtotal, deliveryFee: result.delivery_fee || 0, total: result.total };
      } catch (err) {
        console.warn('No se pudo registrar el pedido en el sistema todavía (Apps Script sin desplegar o sin conexión). Se continúa directo a WhatsApp.', err);
      }

      if (currentIdToken) await saveProfileFromForm();

      const message = buildWhatsappMessage(folio, items, totals, customer);
      window.open(whatsappUrl(message), '_blank', 'noopener');
      window.LTA_CART.clear();

      form.classList.add('hidden');
      const successEl = document.getElementById('order-success');
      successEl.classList.remove('hidden');
      successEl.classList.add('flex');
      document.getElementById('success-folio').textContent = folio || '(sin confirmar en sistema)';
      document.getElementById('success-tracking-link').href =
        '../cuenta/rastreo/?folio=' + encodeURIComponent(folio || '') + '&tel=' + encodeURIComponent(customer.phone);

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

      submitBtn.disabled = false;
      submitBtn.textContent = 'Continuar por WhatsApp';
    });
  });
})();
