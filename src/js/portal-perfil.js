(function () {
  let idToken = null;
  let editing = false;

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
      sessionStorage.removeItem('lta_id_token');
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
          await loadProfile();
        } catch (err) {
          window.LTA_TOAST.show('No se pudo cargar tu perfil: ' + err.message, 'error');
        }
      }
    });
  });
})();
