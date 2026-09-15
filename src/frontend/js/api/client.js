/**
 * Centralized API client for Phone Hub
 */
export async function apiFetch(endpoint, options = {}) {
  const adminPass = sessionStorage.getItem('ph-pass');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (adminPass) {
    headers['x-admin-password'] = adminPass;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    // If not JSON
  }

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const API = {
  getProducts: () => apiFetch('/api/products'),
  getProductById: (id) => apiFetch(`/api/products/${id}`),
  createProduct: (data) => apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => apiFetch(`/api/products/${id}`, { method: 'DELETE' }),

  getOrders: () => apiFetch('/api/orders'),
  createOrder: (data) => apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) => apiFetch(`/api/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getSettings: () => apiFetch('/api/settings'),
  updateSettings: (data) => apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),

  adminLogin: (password) => apiFetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
};
