/**
 * Carrito compartido en localStorage entre Home y /menu/. No se envía a
 * Sheets aquí — eso ocurre en order.create justo antes de abrir WhatsApp
 * (ver /menu/ checkout).
 */
(function () {
  const KEY = 'lta_cart_v1';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart-changed', { detail: { items } }));
  }

  function addItem(product, options) {
    const items = read();
    const line = {
      product_id: product.product_id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      salsa: (options && options.salsa) || null,
      extras: (options && options.extras) || []
    };
    items.push(line);
    write(items);
    return items;
  }

  function removeAt(index) {
    const items = read();
    items.splice(index, 1);
    write(items);
    return items;
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().length;
  }

  function subtotal() {
    return read().reduce((sum, it) => {
      const extrasTotal = (it.extras || []).reduce((s, ex) => s + Number(ex.price || 0), 0);
      return sum + (Number(it.price) + extrasTotal) * Number(it.quantity || 1);
    }, 0);
  }

  window.LTA_CART = { read, addItem, removeAt, clear, count, subtotal };
})();
