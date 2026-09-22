(function () {
  let idToken = null;
  let allProducts = [];
  let activeCategory = 'todos';

  function render() {
    const tbody = document.getElementById('catalog-tbody');
    const search = document.getElementById('dish-search').value.toLowerCase().trim();
    tbody.innerHTML = '';

    const filtered = allProducts.filter((p) => {
      const matchesCategory = activeCategory === 'todos' || p.category_id === activeCategory;
      const matchesSearch = !search || p.name.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });

    filtered.forEach((p) => {
      const tr = document.createElement('tr');
      tr.className = 'dish-row hover:bg-crema-surface/60 transition-colors' + (p.requiresValidation ? ' bg-mustard-light/25' : '');
      tr.innerHTML =
        '<td class="py-3 px-4"><span class="font-headline-sm text-headline-sm text-on-surface">' + p.name + '</span></td>' +
        '<td class="py-3 px-3"><span class="px-2.5 py-1 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant">' + p.category + '</span></td>' +
        '<td class="py-3 px-3">' +
        '  <div class="relative flex items-center">' +
        '    <span class="absolute left-2.5 font-bold text-[14px]">$</span>' +
        '    <input class="price-input w-24 pl-6 pr-2 py-1.5 bg-surface-container-low font-headline-sm text-headline-sm rounded-md text-right font-bold" type="number" value="' + p.price + '">' +
        '  </div>' +
        '</td>' +
        '<td class="py-3 px-3 text-center validation-cell">' +
        (p.requiresValidation
          ? '<button class="approve-btn px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px] font-bold">Validar</button>'
          : '<span class="px-2 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-bold">Oficial</span>') +
        '</td>' +
        '<td class="py-3 px-3 text-center">' +
        '  <label class="relative inline-flex items-center cursor-pointer">' +
        '    <input type="checkbox" class="avail-toggle sr-only peer" ' + (p.active !== false ? 'checked' : '') + '>' +
        '    <div class="w-9 h-5 bg-surface-container-highest rounded-full peer peer-checked:bg-tertiary relative after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>' +
        '  </label>' +
        '</td>' +
        '<td class="py-3 px-4 text-right">' +
        '  <button class="save-btn p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg" title="Guardar"><svg class="w-5 h-5" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-check"/></svg></button>' +
        '</td>';

      tr.querySelector('.price-input').addEventListener('change', async (e) => {
        try {
          await window.LTA_API.callAction('catalog.updatePrice', { product_id: p.product_id, price: Number(e.target.value) }, idToken);
          p.price = Number(e.target.value);
          window.LTA_TOAST.show('Precio de "' + p.name + '" guardado.');
        } catch (err) {
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      });

      const approveBtn = tr.querySelector('.approve-btn');
      if (approveBtn) {
        approveBtn.addEventListener('click', async () => {
          try {
            await window.LTA_API.callAction('catalog.approvePrice', { product_id: p.product_id }, idToken);
            p.requiresValidation = false;
            window.LTA_TOAST.show('Precio validado y oficializado.');
            render();
          } catch (err) {
            window.LTA_TOAST.show('Error: ' + err.message, 'error');
          }
        });
      }

      tr.querySelector('.avail-toggle').addEventListener('change', async (e) => {
        try {
          await window.LTA_API.callAction('catalog.toggleAvailability', { product_id: p.product_id, active: e.target.checked }, idToken);
          p.active = e.target.checked;
          window.LTA_TOAST.show('"' + p.name + '" marcado como ' + (e.target.checked ? 'disponible' : 'agotado') + '.');
        } catch (err) {
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      });

      tr.querySelector('.save-btn').addEventListener('click', () => {
        tr.querySelector('.price-input').dispatchEvent(new Event('change'));
      });

      tbody.appendChild(tr);
    });

    document.getElementById('showing-count').textContent = 'Mostrando ' + filtered.length + ' de ' + allProducts.length + ' platillos';
    document.getElementById('kpi-total').textContent = allProducts.length;
    document.getElementById('kpi-pending').textContent = allProducts.filter((p) => p.requiresValidation).length;
  }

  function renderCategoryPills() {
    const categories = Array.from(new Set(allProducts.map((p) => p.category_id)));
    const container = document.getElementById('category-pills');
    container.innerHTML = '';
    const makePill = (id, label) => {
      const btn = document.createElement('button');
      btn.className = 'shrink-0 px-3.5 py-2 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap ' +
        (activeCategory === id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface');
      btn.textContent = label;
      btn.addEventListener('click', () => { activeCategory = id; renderCategoryPills(); render(); });
      return btn;
    };
    container.appendChild(makePill('todos', 'Todos (' + allProducts.length + ')'));
    categories.forEach((id) => {
      const product = allProducts.find((p) => p.category_id === id);
      const count = allProducts.filter((p) => p.category_id === id).length;
      container.appendChild(makePill(id, product.category + ' (' + count + ')'));
    });
  }

  async function loadCatalog() {
    const data = await window.LTA_API.callAction('catalog.readAll', {}, idToken);
    allProducts = data.products;
    renderCategoryPills();
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dish-search').addEventListener('keyup', render);

    window.LTA_ADMIN_AUTH.renderGate(document.getElementById('auth-gate'), {
      title: 'Gestor de Catálogo',
      subtitle: 'Acceso solo para staff autorizado de La Tapatía Ahogadas.',
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        try {
          await loadCatalog();
        } catch (err) {
          document.getElementById('admin-content').classList.add('hidden');
          document.getElementById('auth-gate').classList.remove('hidden');
          window.LTA_ADMIN_AUTH.showUnauthorized(document.getElementById('auth-gate'), err.message);
        }
      }
    });
  });
})();
