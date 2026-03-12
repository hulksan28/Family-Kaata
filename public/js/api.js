/* ==========================================
   API Layer — Centralized fetch wrapper
   ========================================== */

const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ----- Users -----
const UsersAPI = {
  getAll: () => apiRequest('/users'),
  create: (data) => apiRequest('/users', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
};

// ----- Transactions -----
const TransactionsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return apiRequest(`/transactions?${query.toString()}`);
  },
  getSummary: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return apiRequest(`/transactions/summary?${query.toString()}`);
  },
  create: (data) => apiRequest('/transactions', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/transactions/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/transactions/${id}`, { method: 'DELETE' }),
};

// ----- Categories -----
const CategoriesAPI = {
  getAll: (type) => apiRequest(`/categories${type ? `?type=${type}` : ''}`),
  create: (data) => apiRequest('/categories', { method: 'POST', body: data }),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),
};
