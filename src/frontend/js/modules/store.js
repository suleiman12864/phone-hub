import { API } from '../api/client.js';
import { formatMoney } from '../utils/formatters.js';
import { escapeHTML, $ } from '../utils/dom.js';
import { cartManager } from './cart.js';

let productsList = [];
let storeSettings = {};
let currentCategory = 'All';
let currentPriceTier = 'All';

export async function initStorefront() {
  try {
    const [products, settings] = await Promise.all([
      API.getProducts(),
      API.getSettings()
    ]);

    productsList = products || [];
    storeSettings = settings || {};

    renderContactInfo(storeSettings);
    renderFilters();
    renderProducts();
    setupFAQAccordion();

    cartManager.render(productsList);

    setupEventListeners();
  } catch (err) {
    console.error('Failed to load store products or settings:', err);
  }
}

function renderContactInfo(s) {
  const contactEl = $('#contactInfo');
  if (!contactEl || !s) return;

  const cards = [
    ['Phone', s.phone, '📞'],
    ['WhatsApp', s.whatsapp, '💬'],
    ['Email', s.email, '✉️'],
    ['Instagram', s.instagram, '📸'],
    ['Facebook', s.facebook, '🌐'],
    ['Address', s.address, '📍']
  ].filter(([, val]) => Boolean(val));

  contactEl.innerHTML = cards
    .map(
      ([label, val, icon]) => `
      <div class="card contact-card">
        <div class="contact-icon">${icon}</div>
        <div>
          <small class="contact-label">${escapeHTML(label)}</small>
          <p class="contact-val">${escapeHTML(val)}</p>
        </div>
      </div>
    `
    )
    .join('');
  contactEl.className = 'grid';
}

function renderFilters() {
  const filtersEl = $('#filters');
  if (!filtersEl) return;

  const categories = ['All', 'iPhone', 'Android', 'Samsung', 'Other Android'];
  const priceTiers = [
    { label: 'All Prices', val: 'All' },
    { label: 'Under ₦300k', val: 'under300' },
    { label: '₦300k – ₦600k', val: '300to600' },
    { label: 'Above ₦600k', val: 'above600' }
  ];

  filtersEl.innerHTML = `
    <div class="filter-group">
      <span class="filter-group-label">Category:</span>
      ${categories
        .map(
          (cat) => `
        <button class="filter ${cat === currentCategory ? 'active' : ''}" data-cat="${escapeHTML(cat)}">
          ${cat === 'All' ? 'All Devices' : escapeHTML(cat)}
        </button>
      `
        )
        .join('')}
    </div>
    <div class="filter-group" style="margin-top: 10px;">
      <span class="filter-group-label">Budget:</span>
      ${priceTiers
        .map(
          (tier) => `
        <button class="filter filter-price ${tier.val === currentPriceTier ? 'active' : ''}" data-price="${escapeHTML(tier.val)}">
          ${escapeHTML(tier.label)}
        </button>
      `
        )
        .join('')}
    </div>
  `;

  filtersEl.querySelectorAll('.filter[data-cat]').forEach((btn) => {
    btn.onclick = () => {
      currentCategory = btn.dataset.cat;
      renderFilters();
      renderProducts();
    };
  });

  filtersEl.querySelectorAll('.filter[data-price]').forEach((btn) => {
    btn.onclick = () => {
      currentPriceTier = btn.dataset.price;
      renderFilters();
      renderProducts();
    };
  });
}

function renderProducts() {
  const productsGrid = $('#products');
  const searchInput = $('#search');
  if (!productsGrid) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = productsList.filter((p) => {
    // 1. Category Filter
    const matchesCategory =
      currentCategory === 'All' ||
      p.category === currentCategory ||
      (currentCategory === 'Android' && p.category !== 'iPhone');

    // 2. Price Filter
    const price = Number(p.price || 0);
    let matchesPrice = true;
    if (currentPriceTier === 'under300') matchesPrice = price < 300000;
    else if (currentPriceTier === '300to600') matchesPrice = price >= 300000 && price <= 600000;
    else if (currentPriceTier === 'above600') matchesPrice = price > 600000;

    // 3. Search Query
    const searchBlob = `${p.model} ${p.category} ${p.storage} ${p.ram} ${p.color} ${p.condition}`.toLowerCase();
    const matchesSearch = !query || searchBlob.includes(query);

    return matchesCategory && matchesPrice && matchesSearch;
  });

  productsGrid.className = 'grid';

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: var(--text-muted);">
        <div style="font-size:42px; margin-bottom: 12px;">🔎</div>
        <h3 style="font-size:20px; font-weight:700; color:var(--text-primary);">No smartphones found</h3>
        <p style="margin-top: 6px;">Try adjusting your search terms or price filters.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = filtered
    .map((p) => {
      const isAvailable = p.availability === 'In Stock';
      const imageSrc = p.image || 'https://placehold.co/700x700/171717/D4AF37?text=PHONE+HUB';
      const waLink = getWhatsAppOrderUrl(p);

      // Determine tag color class
      let tagClass = 'tag-gold';
      if (p.condition === 'Brand New') tagClass = 'tag-green';
      else if (p.condition === 'Refurbished') tagClass = 'tag-purple';

      return `
      <article class="card">
        <div class="card-img-wrap">
          <img src="${escapeHTML(imageSrc)}" alt="${escapeHTML(p.model)}" loading="lazy">
          <span class="tag ${tagClass}">${escapeHTML(p.condition || 'Pre-owned')}</span>
        </div>
        <div class="card-content">
          <h3>${escapeHTML(p.model)}</h3>
          <p class="muted">${escapeHTML(p.category)} · ${escapeHTML(p.storage || '')} · ${escapeHTML(p.ram || '')} · ${escapeHTML(p.color || '')}</p>
          <div class="price">${formatMoney(p.price)}</div>
          <div class="actions">
            <button class="btn-details-trigger btn-secondary" data-id="${escapeHTML(p.id)}">Details</button>
            <button class="add btn-add-trigger" data-id="${escapeHTML(p.id)}" ${!isAvailable ? 'disabled' : ''}>
              ${isAvailable ? '+ Add Cart' : 'Out of Stock'}
            </button>
          </div>
          ${
            isAvailable
              ? `<a href="${escapeHTML(waLink)}" target="_blank" rel="noopener" class="btn-whatsapp">
                  💬 Order via WhatsApp
                </a>`
              : ''
          }
        </div>
      </article>
    `;
    })
    .join('');

  // Event Listeners
  productsGrid.querySelectorAll('.btn-details-trigger').forEach((btn) => {
    btn.onclick = () => showProductDetails(btn.dataset.id);
  });

  productsGrid.querySelectorAll('.btn-add-trigger').forEach((btn) => {
    btn.onclick = () => cartManager.addItem(btn.dataset.id, productsList);
  });
}

function getWhatsAppOrderUrl(product) {
  const number = (storeSettings.whatsapp || storeSettings.phone || '2348012345678').replace(/\D/g, '');
  const text = encodeURIComponent(
    `Hello Phone Hub! 👋 I am interested in purchasing:\n\n📱 Model: ${product.model}\n💰 Price: ${formatMoney(product.price)}\n💾 Specs: ${product.storage || ''} / ${product.ram || ''} (${product.color || ''})\n\nIs this device currently available for delivery?`
  );
  return `https://wa.me/${number}?text=${text}`;
}

function showProductDetails(id) {
  const p = productsList.find((x) => x.id === id);
  if (!p) return;

  const modalEl = $('#modal');
  const detailsEl = $('#details');
  if (!modalEl || !detailsEl) return;

  const isIPhone = p.category === 'iPhone';
  const waLink = getWhatsAppOrderUrl(p);

  const specsList = isIPhone
    ? [
        ['Model', p.model],
        ['Storage', p.storage],
        ['RAM', p.ram],
        ['Color', p.color],
        ['Screen Condition', p.screenCondition],
        ['Cracked Screen', p.crackedScreen],
        ['Changed Screen', p.changedScreen],
        ['Changed Parts', p.changedParts],
        ['LLA', p.lla],
        ['Battery Health', p.batteryHealth],
        ['Face ID / Biometric', p.biometric],
        ['True Tone', p.trueTone],
        ['Network Lock', p.networkLock],
        ['SIM Type', p.simType],
        ['Overall Condition', p.condition],
        ['Body Condition', p.bodyCondition],
        ['Repair History', p.repairHistory],
        ['Accessories', p.accessories]
      ]
    : [
        ['Model', p.model],
        ['Storage', p.storage],
        ['RAM', p.ram],
        ['Color', p.color],
        ['Screen Condition', p.screenCondition],
        ['Cracked Screen', p.crackedScreen],
        ['Changed Screen', p.changedScreen],
        ['Changed Parts', p.changedParts],
        ['Fingerprint / Biometric', p.biometric],
        ['Network Lock', p.networkLock],
        ['Overall Condition', p.condition],
        ['Body Condition', p.bodyCondition],
        ['Repair History', p.repairHistory],
        ['Accessories', p.accessories]
      ];

  detailsEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px;">
      <div>
        <span class="tag tag-gold" style="margin-bottom:8px;">${escapeHTML(p.condition)}</span>
        <h2 style="font-size: 28px; font-weight: 800;">${escapeHTML(p.model)}</h2>
        <p style="font-size: 22px; font-weight: 800; color: var(--accent-gold); margin-top: 4px;">${formatMoney(p.price)}</p>
      </div>
    </div>
    
    <div class="specs">
      ${specsList
        .map(
          ([label, val]) => `
        <div class="spec">
          <small>${escapeHTML(label)}</small>
          <b>${escapeHTML(val || '—')}</b>
        </div>
      `
        )
        .join('')}
    </div>
    
    <div style="margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <button class="btn modal-add-btn">ADD TO CART</button>
      <a href="${escapeHTML(waLink)}" target="_blank" rel="noopener" class="btn-whatsapp" style="margin:0; height:100%; display:flex; align-items:center; justify-content:center;">
        💬 ORDER ON WHATSAPP
      </a>
    </div>
  `;

  detailsEl.querySelector('.modal-add-btn').onclick = () => {
    cartManager.addItem(p.id, productsList);
    closeModal();
  };

  modalEl.classList.remove('hidden');
}

export function closeModal() {
  const modalEl = $('#modal');
  if (modalEl) modalEl.classList.add('hidden');
}

function setupFAQAccordion() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.onclick = () => {
        const isOpen = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach((el) => el.classList.remove('active'));
        if (!isOpen) {
          item.classList.add('active');
        }
      };
    }
  });
}

function setupEventListeners() {
  const searchInput = $('#search');
  const clearSearchBtn = $('#clearSearch');

  if (searchInput) {
    searchInput.oninput = () => {
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
      }
      renderProducts();
    };
  }

  if (clearSearchBtn && searchInput) {
    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      renderProducts();
    };
  }

  const cartBtn = $('#cartBtn');
  if (cartBtn) {
    cartBtn.onclick = () => cartManager.toggleDrawer();
  }

  const fabCartBtn = $('#fabCartBtn');
  if (fabCartBtn) {
    fabCartBtn.onclick = () => cartManager.toggleDrawer();
  }

  window.closeModal = closeModal;
  window.toggleCart = () => cartManager.toggleDrawer();
}
