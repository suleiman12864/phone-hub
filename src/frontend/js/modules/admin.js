import { API } from '../api/client.js';
import { formatMoney, formatDate } from '../utils/formatters.js';
import { escapeHTML, $ } from '../utils/dom.js';
import { showToast } from './toast.js';

let pass = sessionStorage.getItem('ph-pass') || '';
let products = [];
let orders = [];
let editingProduct = null;

const FIELDS = [
  ['model', 'Model', 'text'],
  ['storage', 'Storage', 'text'],
  ['ram', 'RAM', 'text'],
  ['color', 'Color', 'text'],
  ['price', 'Price', 'number'],
  ['image', 'Image URL', 'text'],
  ['screenCondition', 'Screen Condition', 'text'],
  ['crackedScreen', 'Cracked Screen', 'select:No|Yes'],
  ['changedScreen', 'Changed Screen', 'select:No|Yes'],
  ['changedParts', 'Changed Parts', 'text'],
  ['lla', 'LLA', 'select:Yes|No'],
  ['batteryHealth', 'Battery Health', 'text'],
  ['biometric', 'Face ID / Biometric', 'select:Working|Not Working|Not Available'],
  ['trueTone', 'True Tone', 'select:Working|Not Working'],
  ['networkLock', 'Network Lock', 'select:Unlocked|Locked'],
  ['simType', 'SIM Type', 'select:eSIM|Physical SIM|eSIM + Physical SIM'],
  ['condition', 'Overall Condition', 'select:Brand New|UK Used|Nigerian Used|Refurbished'],
  ['bodyCondition', 'Body Condition', 'select:Excellent|Good|Fair'],
  ['repairHistory', 'Repair History', 'text'],
  ['accessories', 'Accessories', 'text'],
  ['availability', 'Availability', 'select:In Stock|Out of Stock']
];

export async function initAdmin() {
  setupPasswordToggle();

  if (pass) {
    await showDashboard();
  }
}

function setupPasswordToggle() {
  const toggleBtn = $('#togglePassword');
  const passInput = $('#password');

  if (toggleBtn && passInput) {
    toggleBtn.onclick = () => {
      const isVisible = passInput.type === 'text';
      passInput.type = isVisible ? 'password' : 'text';
      toggleBtn.textContent = isVisible ? 'Show' : 'Hide';
    };
  }
}

export async function login() {
  const passInput = $('#password');
  const entered = passInput ? passInput.value.trim() : '';

  if (!entered) {
    alert('Please enter the admin password.');
    return;
  }

  try {
    await API.adminLogin(entered);
    pass = entered;
    sessionStorage.setItem('ph-pass', pass);
    await showDashboard();
    showToast('Signed in successfully');
  } catch (e) {
    alert('Login failed: ' + (e.message || 'Invalid admin password'));
  }
}

export async function showDashboard() {
  if (!pass) return;

  try {
    // Verify admin credentials
    await API.getOrders();
  } catch (e) {
    sessionStorage.removeItem('ph-pass');
    pass = '';
    return;
  }

  const loginEl = $('#login');
  const dashEl = $('#dash');

  if (loginEl) loginEl.classList.add('hidden');
  if (dashEl) dashEl.classList.remove('hidden');

  await loadAdminData();
}

async function loadAdminData() {
  try {
    const [prods, ords, settings] = await Promise.all([
      API.getProducts(),
      API.getOrders(),
      API.getSettings()
    ]);

    products = prods || [];
    orders = ords || [];

    renderStats();
    renderProductsTable();
    renderOrdersTable();
    renderSettingsForm(settings);
  } catch (e) {
    alert('Could not load dashboard data: ' + e.message);
  }
}

function renderStats() {
  const statsEl = $('#stats');
  if (!statsEl) return;

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === 'New').length;
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  statsEl.innerHTML = `
    <div class="stats">
      <div class="stat"><span>Products</span><b>${totalProducts}</b></div>
      <div class="stat"><span>Orders</span><b>${totalOrders}</b></div>
      <div class="stat"><span>New Orders</span><b>${newOrders}</b></div>
      <div class="stat"><span>Total Sales</span><b>${formatMoney(totalSales)}</b></div>
    </div>
  `;
}

function renderProductsTable() {
  const tableEl = $('#table');
  if (!tableEl) return;

  tableEl.innerHTML = `
    <table class="adminTable">
      <thead>
        <tr>
          <th>Model</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr>
            <td><b>${escapeHTML(p.model)}</b></td>
            <td>${escapeHTML(p.category)}</td>
            <td>${formatMoney(p.price)}</td>
            <td><span class="tag">${escapeHTML(p.availability)}</span></td>
            <td>
              <button class="edit-prod-btn btn-secondary" data-id="${escapeHTML(p.id)}">Edit</button>
              <button class="del-prod-btn btn-secondary" style="color:var(--status-danger);" data-id="${escapeHTML(p.id)}">Delete</button>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  tableEl.querySelectorAll('.edit-prod-btn').forEach((btn) => {
    btn.onclick = () => editProduct(btn.dataset.id);
  });

  tableEl.querySelectorAll('.del-prod-btn').forEach((btn) => {
    btn.onclick = () => deleteProduct(btn.dataset.id);
  });
}

function renderOrdersTable() {
  const ordersEl = $('#orders');
  if (!ordersEl) return;

  if (orders.length === 0) {
    ordersEl.innerHTML = `<p class="muted">No orders placed yet.</p>`;
    return;
  }

  const statuses = [
    'New',
    'Confirmed',
    'Processing',
    'Ready for Delivery',
    'Delivered',
    'Cancelled'
  ];

  ordersEl.innerHTML = `
    <table class="adminTable">
      <thead>
        <tr>
          <th>Order ID & Date</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Payment</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${orders
          .map(
            (o) => `
          <tr>
            <td>
              <b>${escapeHTML(o.orderId)}</b><br>
              <small class="muted">${formatDate(o.date)}</small>
            </td>
            <td>
              ${escapeHTML(o.name)}<br>
              <small class="muted">${escapeHTML(o.phone)} · ${escapeHTML(o.state || '')}</small>
            </td>
            <td><b>${formatMoney(o.total)}</b></td>
            <td>
              <span class="tag" style="${o.paymentStatus === 'Paid' ? 'background:rgba(46,204,113,0.2); color:#2ecc71; border:1px solid #2ecc71;' : ''}">
                ${escapeHTML(o.paymentMethod || 'Pay on Delivery')} (${escapeHTML(o.paymentStatus || 'Pending')})
              </span>
              ${o.paystackReference ? `<br><small class="muted" style="font-size:11px;">Ref: ${escapeHTML(o.paystackReference)}</small>` : ''}
            </td>
            <td>
              <select class="order-status-select" data-id="${escapeHTML(o.orderId)}">
                ${statuses
                  .map(
                    (s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`
                  )
                  .join('')}
              </select>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  ordersEl.querySelectorAll('.order-status-select').forEach((sel) => {
    sel.onchange = async () => {
      try {
        await API.updateOrderStatus(sel.dataset.id, sel.value);
        showToast(`Order status updated to ${sel.value}`);
        loadAdminData();
      } catch (e) {
        alert('Failed to update status: ' + e.message);
      }
    };
  });
}

function renderSettingsForm(s) {
  const formEl = $('#settings');
  if (!formEl || !s) return;

  formEl.className = 'formgrid';
  formEl.innerHTML = `
    <label>Phone<input name="phone" value="${escapeHTML(s.phone || '')}"></label>
    <label>WhatsApp<input name="whatsapp" value="${escapeHTML(s.whatsapp || '')}"></label>
    <label>Email<input name="email" value="${escapeHTML(s.email || '')}"></label>
    <label>Instagram<input name="instagram" value="${escapeHTML(s.instagram || '')}"></label>
    <label>Facebook<input name="facebook" value="${escapeHTML(s.facebook || '')}"></label>
    <label>Address<input name="address" value="${escapeHTML(s.address || '')}"></label>
    <label class="full">Paystack Public Key (Online Payment)
      <input name="paystackPublicKey" placeholder="pk_test_... or pk_live_..." value="${escapeHTML(s.paystackPublicKey || '')}">
      <small class="muted">Paste your Paystack Public Key here to accept online card & bank transfer payments.</small>
    </label>
    <div class="full">
      <button class="btn">SAVE SETTINGS</button>
    </div>
  `;

  formEl.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formEl));
    try {
      await API.updateSettings(data);
      showToast('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    }
  };
}


export function editProduct(id) {
  editingProduct = products.find((p) => p.id === id) || {};

  const formEl = $('#productForm');
  if (!formEl) return;

  formEl.className = 'formgrid';
  formEl.innerHTML = `
    <label class="full">Category
      <select name="category" id="cat">
        <option ${editingProduct.category === 'iPhone' ? 'selected' : ''}>iPhone</option>
        <option ${editingProduct.category === 'Android' ? 'selected' : ''}>Android</option>
        <option ${editingProduct.category === 'Samsung' ? 'selected' : ''}>Samsung</option>
        <option ${editingProduct.category === 'Other Android' ? 'selected' : ''}>Other Android</option>
      </select>
    </label>
    ${FIELDS.map(([k, l, t]) => {
      if (t.startsWith('select:')) {
        const opts = t.slice(7).split('|');
        return `
          <label name="lbl-${k}">${l}
            <select name="${k}">
              ${opts.map((v) => `<option ${editingProduct[k] === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </label>
        `;
      }
      return `
        <label name="lbl-${k}">${l}
          <input name="${k}" type="${t}" value="${escapeHTML(editingProduct[k] || '')}">
        </label>
      `;
    }).join('')}
    <div class="full" style="margin-top:16px;">
      <button class="btn full">SAVE PRODUCT</button>
    </div>
  `;

  const catSelect = $('#cat', formEl);
  const updateDynamicFields = () => {
    const isIPhone = catSelect.value === 'iPhone';
    ['lla', 'batteryHealth', 'trueTone', 'simType'].forEach((k) => {
      const lbl = $(`[name="lbl-${k}"]`, formEl);
      if (lbl) lbl.style.display = isIPhone ? 'flex' : 'none';
    });
  };

  catSelect.onchange = updateDynamicFields;
  updateDynamicFields();

  formEl.onsubmit = saveProduct;

  const editorModal = $('#editor');
  if (editorModal) editorModal.classList.remove('hidden');
}

async function saveProduct(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.price = Number(data.price);
  data.image = data.image || 'https://placehold.co/700x700/171717/D4AF37?text=PHONE+HUB';

  try {
    if (editingProduct && editingProduct.id) {
      await API.updateProduct(editingProduct.id, data);
      showToast('Product updated successfully!');
    } else {
      await API.createProduct(data);
      showToast('New product added!');
    }
    const editorModal = $('#editor');
    if (editorModal) editorModal.classList.add('hidden');
    await loadAdminData();
  } catch (err) {
    alert('Failed to save product: ' + err.message);
  }
}

async function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      await API.deleteProduct(id);
      showToast('Product deleted');
      await loadAdminData();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  }
}

export function logout() {
  sessionStorage.clear();
  location.reload();
}

window.login = login;
window.edit = editProduct;
window.logout = logout;
