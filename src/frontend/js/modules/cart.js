import { formatMoney } from '../utils/formatters.js';
import { escapeHTML, $ } from '../utils/dom.js';
import { showToast } from './toast.js';

const STORAGE_KEY = 'phonehub-cart';

class CartManager {
  constructor() {
    this.cart = this.loadCart();
  }

  loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cart));
  }

  getItems() {
    return this.cart;
  }

  addItem(id, products = []) {
    const existing = this.cart.find((item) => item.id === id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ id, qty: 1 });
    }
    this.saveCart();

    const product = products.find((p) => p.id === id);
    const title = product ? product.model : 'Item';
    showToast(`${escapeHTML(title)} added to cart!`);

    this.render(products);
  }

  increaseQty(id, products = []) {
    const existing = this.cart.find((item) => item.id === id);
    if (existing) {
      existing.qty++;
      this.saveCart();
      this.render(products);
    }
  }

  decreaseQty(id, products = []) {
    const existing = this.cart.find((item) => item.id === id);
    if (existing) {
      if (existing.qty > 1) {
        existing.qty--;
      } else {
        this.cart = this.cart.filter((item) => item.id !== id);
      }
      this.saveCart();
      this.render(products);
    }
  }

  removeItem(id, products = []) {
    this.cart = this.cart.filter((item) => item.id !== id);
    this.saveCart();
    this.render(products);
    showToast('Item removed from cart');
  }

  clear() {
    this.cart = [];
    this.saveCart();
  }

  getTotalCount() {
    return this.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  toggleDrawer() {
    const cartDrawer = $('#cart');
    let backdrop = $('.drawer-backdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'drawer-backdrop';
      document.body.appendChild(backdrop);
      backdrop.onclick = () => this.toggleDrawer();
    }

    if (cartDrawer) {
      cartDrawer.classList.toggle('open');
      backdrop.classList.toggle('active', cartDrawer.classList.contains('open'));
    }
  }

  render(products = []) {
    const countEl = $('#count');
    const fabCountEl = $('#fabCount');
    const itemsEl = $('#cartItems');
    const totalEl = $('#total');

    const count = this.getTotalCount();

    if (countEl) {
      countEl.textContent = count;
    }
    if (fabCountEl) {
      fabCountEl.textContent = count;
    }

    if (!itemsEl) return;

    let total = 0;

    if (this.cart.length === 0) {
      itemsEl.innerHTML = `
        <div style="text-align:center; padding: 40px 0; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 10px;">🛒</div>
          <p>Your cart is empty.</p>
        </div>
      `;
      if (totalEl) totalEl.textContent = formatMoney(0);
      return;
    }

    itemsEl.innerHTML = this.cart
      .map((item) => {
        const p = products.find((y) => y.id === item.id);
        if (!p) return '';
        const itemTotal = p.price * item.qty;
        total += itemTotal;

        const imageSrc = p.image || 'https://placehold.co/700x700/171717/D4AF37?text=PHONE+HUB';

        return `
        <div class="cartrow">
          <img src="${escapeHTML(imageSrc)}" alt="${escapeHTML(p.model)}">
          <div class="cartrow-info">
            <h4>${escapeHTML(p.model)}</h4>
            <p>${formatMoney(p.price)}</p>
            <div class="qty-controls">
              <button class="qty-btn dec-qty-btn" data-id="${escapeHTML(p.id)}">-</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn inc-qty-btn" data-id="${escapeHTML(p.id)}">+</button>
              <button class="remove-cart-item-btn" data-id="${escapeHTML(p.id)}">Remove</button>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    if (totalEl) {
      totalEl.textContent = formatMoney(total);
    }

    // Attach listeners safely
    itemsEl.querySelectorAll('.inc-qty-btn').forEach((btn) => {
      btn.onclick = () => this.increaseQty(btn.dataset.id, products);
    });

    itemsEl.querySelectorAll('.dec-qty-btn').forEach((btn) => {
      btn.onclick = () => this.decreaseQty(btn.dataset.id, products);
    });

    itemsEl.querySelectorAll('.remove-cart-item-btn').forEach((btn) => {
      btn.onclick = () => this.removeItem(btn.dataset.id, products);
    });
  }
}

export const cartManager = new CartManager();
