import { API } from './api/client.js';
import { formatMoney } from './utils/formatters.js';
import { escapeHTML, $ } from './utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cart = JSON.parse(localStorage.getItem('phonehub-cart') || '[]');
  const summaryEl = $('#summary');
  const formEl = $('#form');
  const submitBtn = $('#submitBtn');

  if (!cart.length) {
    if (summaryEl) {
      summaryEl.innerHTML = `<p class="muted" style="text-align:center;">Your cart is empty. <a href="index.html" style="color:var(--accent-gold);">Return to store</a></p>`;
    }
    return;
  }

  let products = [];
  let settings = {};
  try {
    const [prods, setts] = await Promise.all([
      API.getProducts(),
      API.getSettings()
    ]);
    products = prods || [];
    settings = setts || {};
  } catch (e) {
    console.error('Failed to load products or settings for checkout:', e);
  }

  const items = cart
    .map((x) => {
      const p = products.find((y) => y.id === x.id);
      return p ? { productId: p.id, model: p.model, quantity: x.qty, price: p.price } : null;
    })
    .filter(Boolean);

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:20px; border-radius:var(--radius-md); margin-bottom:24px;">
        <h2 style="font-size:24px; font-weight:800; color:var(--accent-gold);">Order Total: ${formatMoney(total)}</h2>
        <p class="muted" style="margin-top:4px;">${items.length} item(s) selected</p>
      </div>
    `;
  }

  if (submitBtn) {
    submitBtn.textContent = `PAY ${formatMoney(total)} WITH PAYSTACK`;
  }

  if (formEl) {
    formEl.onsubmit = async (e) => {
      e.preventDefault();

      if (!cart.length) {
        alert('Cart is empty');
        return;
      }

      const formData = new FormData(formEl);
      const body = Object.fromEntries(formData);
      body.products = items;
      body.total = total;

      const paystackKey = (settings.paystackPublicKey || '').trim();
      if (!paystackKey || paystackKey.includes('your_paystack_public_key')) {
        alert('Paystack Public Key is not configured yet.\n\nPlease paste your Paystack Public Key in the Admin Dashboard (Business Settings) or in the .env file under PAYSTACK_PUBLIC_KEY.');
        return;
      }

      if (typeof PaystackPop === 'undefined') {
        alert('Paystack SDK failed to load. Please check your internet connection and try again.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Opening Paystack Payment...';
      }

      const handler = PaystackPop.setup({
        key: paystackKey,
        email: body.email,
        amount: Math.round(total * 100), // amount in kobo
        currency: 'NGN',
        ref: 'PH-' + Math.floor(Math.random() * 1000000000 + 1),
        metadata: {
          custom_fields: [
            { display_name: 'Customer Name', variable_name: 'customer_name', value: body.name },
            { display_name: 'Phone Number', variable_name: 'phone_number', value: body.phone }
          ]
        },
        callback: async function (response) {
          body.paymentMethod = 'Paystack';
          body.paymentStatus = 'Paid';
          body.paystackReference = response.reference;

          try {
            const order = await API.createOrder(body);
            localStorage.removeItem('phonehub-cart');
            window.location.href = `confirmation.html?id=${encodeURIComponent(order.orderId)}&method=paystack&ref=${encodeURIComponent(response.reference)}`;
          } catch (err) {
            alert('Payment succeeded but failed to place order: ' + err.message);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = `PAY ${formatMoney(total)} WITH PAYSTACK`;
            }
          }
        },
        onClose: function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = `PAY ${formatMoney(total)} WITH PAYSTACK`;
          }
        }
      });

      handler.openIframe();
    };
  }
});


