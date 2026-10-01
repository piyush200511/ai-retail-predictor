import api from './client';

// ---------------- Auth ----------------
export const authApi = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (data) => api.post('/auth/register/', data),
  profile: () => api.get('/auth/profile/'),
  users: () => api.get('/auth/users/'),
};

// ---------------- Master Data ----------------
export const suppliersApi = {
  list: (params) => api.get('/suppliers/', { params }),
  get: (id) => api.get(`/suppliers/${id}/`),
  create: (data) => api.post('/suppliers/', data),
  update: (id, data) => api.put(`/suppliers/${id}/`, data),
  remove: (id) => api.delete(`/suppliers/${id}/`),
};

export const productsApi = {
  list: (params) => api.get('/products/', { params }),
  get: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}/`, data),
  remove: (id) => api.delete(`/products/${id}/`),
};

export const categoriesApi = {
  list: () => api.get('/categories/'),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}/`, data),
  remove: (id) => api.delete(`/categories/${id}/`),
};

export const brandsApi = {
  list: () => api.get('/brands/'),
  create: (data) => api.post('/brands/', data),
  update: (id, data) => api.put(`/brands/${id}/`, data),
  remove: (id) => api.delete(`/brands/${id}/`),
};

export const unitsApi = {
  list: () => api.get('/units/'),
  create: (data) => api.post('/units/', data),
};

export const warehousesApi = {
  list: (params) => api.get('/warehouses/', { params }),
  create: (data) => api.post('/warehouses/', data),
  update: (id, data) => api.put(`/warehouses/${id}/`, data),
  remove: (id) => api.delete(`/warehouses/${id}/`),
};

// ---------------- Inventory ----------------
export const inventoryApi = {
  list: (params) => api.get('/inventory/', { params }),
  adjust: (data) => api.post('/inventory/adjust/', data),
  movements: (params) => api.get('/stock-movements/', { params }),
  transfers: (params) => api.get('/stock-transfers/', { params }),
};

// ---------------- Purchases ----------------
export const purchasesApi = {
  list: (params) => api.get('/purchase-orders/', { params }),
  get: (id) => api.get(`/purchase-orders/${id}/`),
  create: (data) => api.post('/purchase-orders/', data),
  update: (id, data) => api.put(`/purchase-orders/${id}/`, data),
  remove: (id) => api.delete(`/purchase-orders/${id}/`),
  submit: (id) => api.post(`/purchase-orders/${id}/submit/`),
  approve: (id) => api.post(`/purchase-orders/${id}/approve/`),
  cancel: (id) => api.post(`/purchase-orders/${id}/cancel/`),
  receive: (id, data) => api.post(`/purchase-orders/${id}/receive/`, data),
  receipts: (params) => api.get('/goods-receipts/', { params }),
};
// ---------------- Sales ----------------
export const salesApi = {
  // Orders
  list: (params) => api.get('/sales-orders/', { params }),
  get: (id) => api.get(`/sales-orders/${id}/`),
  create: (data) => api.post('/sales-orders/', data),
  update: (id, data) => api.put(`/sales-orders/${id}/`, data),
  remove: (id) => api.delete(`/sales-orders/${id}/`),
  confirm: (id) => api.post(`/sales-orders/${id}/confirm/`),
  complete: (id) => api.post(`/sales-orders/${id}/complete/`),
  cancel: (id) => api.post(`/sales-orders/${id}/cancel/`),
  returnOrder: (id) => api.post(`/sales-orders/${id}/return/`),

  // Customers
  customers: (params) => api.get('/customers/', { params }),
  createCustomer: (data) => api.post('/customers/', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}/`, data),
};
// ---------------- Alerts ----------------
export const alertsApi = {
  list: (params) => api.get('/alerts/', { params }),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge/`),
  resolve: (id) => api.post(`/alerts/${id}/resolve/`),
  reopen: (id) => api.post(`/alerts/${id}/reopen/`),
};

// ---------------- Forecasting ----------------
export const forecastingApi = {
  demandHistory: (params) => api.get('/demand-history/', { params }),
  rebuildDemand: () => api.post('/demand-history/rebuild/'),
  runs: (params) => api.get('/forecast-runs/', { params }),
  startRun: (data) => api.post('/forecast-runs/start/', data),
  forecasts: (params) => api.get('/forecasts/', { params }),
  reorder: (params) => api.get('/reorder-recommendations/', { params }),
  dismissReorder: (id) => api.post(`/reorder-recommendations/${id}/dismiss/`),
  reviewReorder: (id) => api.post(`/reorder-recommendations/${id}/review/`),
};
// ---------------- Analytics ----------------
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard/'),
  sales: () => api.get('/analytics/sales/'),
  inventory: () => api.get('/analytics/inventory/'),
  purchasing: () => api.get('/analytics/purchasing/'),
};

// ---------------- Reports ----------------
const API_BASE_URL = 'http://127.0.0.1:8000/api';
export const reportsApi = {
  salesCsv: () => `${API_BASE_URL}/reports/sales.csv`,
  inventoryCsv: () => `${API_BASE_URL}/reports/inventory.csv`,
  movementsCsv: () => `${API_BASE_URL}/reports/stock-movements.csv`,
  forecastsCsv: () => `${API_BASE_URL}/reports/forecasts.csv`,
};