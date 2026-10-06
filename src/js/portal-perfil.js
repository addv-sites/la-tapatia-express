(function () {
  let idToken = null;
  let editing = false;
  let promoThreshold = 0;

  const editableFields = () => [
    document.getElementById('field-name'),
    document.getElementById('field-phone'),
    document.getElementById('field-address'),
    document.getElementById('field-address-ref'),
    document.getElementById('field-opt-in')
  ];

  function setEditing(value) {
    editing = value;
    const btn = document.getElementById('save-profile');
    editableFields().forEach((f) => { f.disabled = !editing; });
    btn.textContent = editing ? 'Guardar' : 'Editar';
    btn.classList.toggle('bg-secondary', editing);
    btn.classList.toggle('bg-primary', !editing);
  }

  async function loadProfile() {
    const data = await window.LTA_API.callAction('client.getProfile', {}, idToken);
    const p = data.profile || {};
    document.getElementById('field-name').value = p.name || '';
    document.getElementById('field-phone').value = p.phone || '';
    document.getElementById('field-address').value = p.address || '';
    document.getElementById('field-address-ref').value = p.address_reference || '';
    document.getElementById('field-opt-in').checked = !!p.marketing_opt_in;
    renderPromo(p);
  }

  /** Tarjeta de sellos: cada pedido entregado llena un sello; el siguiente queda marcado como "meta". */
  function renderPromo(p) {
    const card = document.getElementById('promo-card');
    if (!promoThreshold) { card.classList.add('hidden'); card.classList.remove('flex'); return; }
    card.classList.remove('hidden');
    card.classList.add('flex');

    const credits = Number(p.promo_free_delivery_credits || 0);
    const consecutive = Number(p.promo_consecutive_orders || 0);
    const progressInCycle = consecutive % promoThreshold;

    const row = document.getElementById('promo-stamp-row');
    row.innerHTML = '';
    for (let i = 0; i < promoThreshold; i++) {
      const stamp = document.createElement('div');
      stamp.className = 'w-9 h-9 rounded-full flex items-center justify-center shrink-0';
      if (i < progressInCycle) {
        stamp.style.background = '#006d30';
        stamp.innerHTML = '<svg class="w-4 h-4" style="color:#8bed9d" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-check"/></svg>';
      } else if (i === progressInCycle) {
        stamp.style.cssText = 'border:2px dashed #93000b;background:#ffdad633';
        stamp.innerHTML = '<svg class="w-4 h-4" style="color:#93000b" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-navigation"/></svg>';
      } else {
        stamp.style.cssText = 'border:2px dashed #e4beb9';
      }
      row.appendChild(stamp);
    }

    const chip = document.getElementById('promo-credits-chip');
    const progressText = document.getElementById('promo-progress-text');
    if (credits > 0) {
      chip.textContent = credits + (credits === 1 ? ' disponible' : ' disponibles');
      chip.style.background = '#ffdad6';
      chip.style.color = '#93000b';
      chip.classList.remove('hidden');
      progressText.innerHTML = 'Ya tienes <strong>' + credits + (credits === 1 ? ' crédito' : ' créditos') +
        '</strong> de envío gratis — se aplica solo en tu próximo pedido a domicilio.';
    } else {
      chip.classList.add('hidden');
      const remaining = promoThreshold - progressInCycle;
      progressText.textContent = remaining + (remaining === 1 ? ' pedido más' : ' pedidos más') + ' y tu envío es gratis.';
    }
  }

  async function save() {
    const btn = document.getElementById('save-profile');
    btn.disabled = true;
    try {
      await window.LTA_API.callAction('client.upsertProfile', {
        name: document.getElementById('field-name').value.trim(),
        phone: document.getElementById('field-phone').value.trim(),
        address: document.getElementById('field-address').value.trim(),
        address_reference: document.getElementById('field-address-ref').value.trim()
      }, idToken);
      await window.LTA_API.callAction('client.optInMarketing', {
        optIn: document.getElementById('field-opt-in').checked
      }, idToken);
      window.LTA_TOAST.show('Perfil guardado.');
      setEditing(false);
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    }
    btn.disabled = false;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('save-profile').addEventListener('click', () => {
      if (editing) {
        save();
      } else {
        setEditing(true);
      }
    });
    document.getElementById('profile-form').addEventListener('submit', (e) => e.preventDefault());
    document.getElementById('btn-signout').addEventListener('click', () => {
      localStorage.removeItem('lta_id_token');
      window.LTA_AUTH.signOut();
      location.reload();
    });

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Mi Cuenta',
      subtitle: 'Inicia sesión con tu cuenta de Google para ver y editar tus datos guardados.',
      onSignedIn: async (token, profile) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('profile-content').classList.remove('hidden');
        document.getElementById('account-email').textContent = profile.email || '';
        try {
          const configData = await window.LTA_API.callAction('config.read', {}, token);
          const config = configData.config || {};
          promoThreshold = config.promo_enabled ? Number(config.promo_orders_threshold || 0) : 0;
        } catch (err) { promoThreshold = 0; }
        try {
          await loadProfile();
        } catch (err) {
          window.LTA_TOAST.show('No se pudo cargar tu perfil: ' + err.message, 'error');
        }
      }
    });
  });
})();
