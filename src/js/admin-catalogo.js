(function () {
  const MAX_PHOTO_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB — validación en front antes de leer/redimensionar el archivo

  let idToken = null;
  let allProducts = [];
  let activeCategory = 'todos';

  function assertPhotoSize_(file) {
    if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
      throw new Error('La imagen pesa más de 4MB, elige una más ligera.');
    }
  }

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
        '<td class="py-3 px-4">' +
        '  <div class="relative w-12 h-12 shrink-0">' +
        '    <img class="thumb-img w-12 h-12 rounded-lg object-cover bg-surface-container-high" src="' + (p.image || '') + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
        '    <input type="file" accept="image/*" class="photo-input hidden">' +
        '    <button class="photo-btn absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center" title="Cambiar foto">' +
        '      <svg class="w-3 h-3" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-plus"/></svg>' +
        '    </button>' +
        '  </div>' +
        '</td>' +
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
        '<td class="py-3 px-4 text-right whitespace-nowrap">' +
        '  <button class="save-btn p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg" title="Guardar"><svg class="w-5 h-5" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-save"/></svg></button>' +
        '  <button class="delete-btn p-2 text-on-surface-variant hover:text-error hover:bg-surface-container rounded-lg" title="Eliminar platillo"><svg class="w-5 h-5" aria-hidden="true"><use href="../../assets/icons/sprite.svg#icon-trash"/></svg></button>' +
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

      tr.querySelector('.delete-btn').addEventListener('click', async () => {
        if (!confirm('¿Eliminar "' + p.name + '"? Esta acción no se puede deshacer.')) return;
        try {
          await window.LTA_API.callAction('catalog.delete', { product_id: p.product_id }, idToken);
          allProducts = allProducts.filter((item) => item.product_id !== p.product_id);
          window.LTA_TOAST.show('"' + p.name + '" eliminado del catálogo.');
          renderCategoryPills();
          render();
        } catch (err) {
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        }
      });

      const photoInput = tr.querySelector('.photo-input');
      tr.querySelector('.photo-btn').addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', async () => {
        const file = photoInput.files[0];
        if (!file) return;
        try {
          assertPhotoSize_(file);
          const base64Data = await resizeImageToBase64_(file, 800, 0.8);
          const result = await window.LTA_API.callAction('catalog.uploadPhoto', {
            product_id: p.product_id,
            mimeType: 'image/jpeg',
            base64Data
          }, idToken);
          p.image = result.imageUrl;
          tr.querySelector('.thumb-img').src = result.imageUrl;
          tr.querySelector('.thumb-img').style.visibility = 'visible';
          window.LTA_TOAST.show('Foto de "' + p.name + '" actualizada.');
        } catch (err) {
          window.LTA_TOAST.show('Error: ' + err.message, 'error');
        } finally {
          photoInput.value = '';
        }
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

  function resizeImageToBase64_(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Archivo de imagen inválido'));
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            const scale = maxDim / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function loadCatalog() {
    const data = await window.LTA_API.callAction('catalog.readAll', {}, idToken);
    allProducts = data.products || [];
    document.getElementById('empty-state').classList.toggle('hidden', allProducts.length > 0);
    document.getElementById('catalog-table-wrap').classList.toggle('hidden', allProducts.length === 0);
    renderCategoryPills();
    render();
  }

  async function seedCatalog() {
    const btn = document.getElementById('btn-seed-catalog');
    btn.disabled = true;
    try {
      const res = await fetch('../../data/catalog.seed.json', { cache: 'no-store' });
      const snapshot = await res.json();
      const result = await window.LTA_API.callAction('catalog.seed', { products: snapshot.products || [] }, idToken);
      window.LTA_TOAST.show(result.added + ' productos precargados.');
      await loadCatalog();
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function populateAddDishCategorySelect_() {
    const select = document.getElementById('add-dish-category');
    const categories = Array.from(new Set(allProducts.map((p) => p.category_id)));
    select.innerHTML = '<option value="">Selecciona…</option>';
    categories.forEach((id) => {
      const product = allProducts.find((p) => p.category_id === id);
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = product.category;
      select.appendChild(opt);
    });
    const newOpt = document.createElement('option');
    newOpt.value = '__nueva__';
    newOpt.textContent = '+ Nueva categoría';
    select.appendChild(newOpt);
  }

  function openAddDishModal_() {
    populateAddDishCategorySelect_();
    document.getElementById('add-dish-form').reset();
    document.getElementById('add-dish-new-category-wrap').classList.add('hidden');
    document.getElementById('add-dish-modal').classList.remove('hidden');
    document.getElementById('add-dish-name').focus();
  }

  function closeAddDishModal_() {
    document.getElementById('add-dish-modal').classList.add('hidden');
  }

  async function submitAddDish_() {
    const submitBtn = document.getElementById('btn-submit-add-dish');
    const name = document.getElementById('add-dish-name').value.trim();
    const price = Number(document.getElementById('add-dish-price').value);
    const description = document.getElementById('add-dish-description').value.trim();
    const categorySelect = document.getElementById('add-dish-category');
    const isNewCategory = categorySelect.value === '__nueva__';
    const categoryLabel = isNewCategory
      ? document.getElementById('add-dish-new-category').value.trim()
      : (categorySelect.selectedOptions[0] ? categorySelect.selectedOptions[0].textContent : '');
    const categoryId = isNewCategory ? slugify_(categoryLabel) : categorySelect.value;
    const photoFile = document.getElementById('add-dish-photo').files[0];

    if (!name) { window.LTA_TOAST.show('Falta el nombre del platillo.', 'error'); return; }
    if (!categoryId || !categoryLabel) { window.LTA_TOAST.show('Falta la categoría.', 'error'); return; }
    if (!price || price <= 0) { window.LTA_TOAST.show('Precio inválido.', 'error'); return; }
    if (photoFile) {
      try {
        assertPhotoSize_(photoFile);
      } catch (err) {
        window.LTA_TOAST.show(err.message, 'error');
        return;
      }
    }

    submitBtn.disabled = true;
    try {
      const result = await window.LTA_API.callAction('catalog.create', {
        name,
        category_id: categoryId,
        category: categoryLabel,
        price,
        short_description: description
      }, idToken);

      if (photoFile) {
        const base64Data = await resizeImageToBase64_(photoFile, 800, 0.8);
        await window.LTA_API.callAction('catalog.uploadPhoto', {
          product_id: result.product.product_id,
          mimeType: 'image/jpeg',
          base64Data
        }, idToken);
      }

      window.LTA_TOAST.show('"' + name + '" agregado al catálogo.');
      closeAddDishModal_();
      await loadCatalog();
    } catch (err) {
      window.LTA_TOAST.show('Error: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  }

  function slugify_(text) {
    return String(text)
      .normalize('NFD').replace(new RegExp('[\u0300-\u036f]', 'g'), '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dish-search').addEventListener('keyup', render);
    document.getElementById('btn-seed-catalog').addEventListener('click', seedCatalog);
    window.LTA_AUTH_GATE.wireSignOutButton(document.getElementById('btn-signout-header'));

    document.getElementById('btn-add-dish').addEventListener('click', openAddDishModal_);
    document.getElementById('btn-close-add-dish').addEventListener('click', closeAddDishModal_);
    document.getElementById('btn-cancel-add-dish').addEventListener('click', closeAddDishModal_);
    document.getElementById('add-dish-category').addEventListener('change', (e) => {
      document.getElementById('add-dish-new-category-wrap').classList.toggle('hidden', e.target.value !== '__nueva__');
    });
    document.getElementById('add-dish-form').addEventListener('submit', (e) => {
      e.preventDefault();
      submitAddDish_();
    });

    window.LTA_AUTH_GATE.renderGate(document.getElementById('auth-gate'), {
      title: 'Gestor de Catálogo',
      subtitle: 'Acceso solo para staff autorizado de Ahogadas La Tapatía Express.',
      onSignedIn: async (token) => {
        idToken = token;
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        try {
          await loadCatalog();
        } catch (err) {
          document.getElementById('admin-content').classList.add('hidden');
          document.getElementById('auth-gate').classList.remove('hidden');
          window.LTA_AUTH_GATE.showUnauthorized(document.getElementById('auth-gate'), err.message);
        }
      }
    });
  });
})();
