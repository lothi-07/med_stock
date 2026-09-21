import axios from 'axios';

const productionApiUrl = 'https://med-stock-l7vh.onrender.com/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? productionApiUrl : '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medstock_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking me
      if (!error.config.url.includes('/auth/me') && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('medstock_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth Services ─────────────────────────────────────────────────────────────
export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('medstock_token', res.data.access_token);
    }
    return res.data;
  },
  signup: async (data) => {
    const res = await api.post('/auth/signup', data);
    if (res.data.access_token) {
      localStorage.setItem('medstock_token', res.data.access_token);
    }
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('medstock_token');
  },
};

// ── Medicine Services ─────────────────────────────────────────────────────────
export const medicineService = {
  list: async (params = {}) => {
    const res = await api.get('/medicines', { params });
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get('/medicines/categories');
    return res.data;
  },
  search: async (q) => {
    const res = await api.get('/medicines/search', { params: { q } });
    return res.data;
  },
  lookupBarcode: async (barcode) => {
    const res = await api.get(`/medicines/barcode/${barcode}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/medicines', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/medicines/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/medicines/${id}`);
    return res.data;
  },
};

// ── Batch Services ────────────────────────────────────────────────────────────
export const batchService = {
  getByMedicine: async (medicineId) => {
    const res = await api.get(`/batches/medicine/${medicineId}`);
    return res.data;
  },
  getFefoBatches: async (medicineId) => {
    const res = await api.get(`/batches/fefo/${medicineId}`);
    return res.data;
  },
  getExpiring: async (days = 30) => {
    const res = await api.get('/batches/expiring', { params: { days } });
    return res.data;
  },
  create: async (medicineId, data) => {
    const res = await api.post(`/medicines/${medicineId}/batches`, data);
    return res.data;
  },
  update: async (batchId, data) => {
    const res = await api.put(`/batches/${batchId}`, data);
    return res.data;
  },
};

// ── Billing Services ──────────────────────────────────────────────────────────
export const billingService = {
  createBill: async (billData) => {
    const res = await api.post('/bills', billData);
    return res.data;
  },
  listBills: async (params = {}) => {
    const res = await api.get('/bills', { params });
    return res.data;
  },
  getBill: async (id) => {
    const res = await api.get(`/bills/${id}`);
    return res.data;
  },
};

// ── Alerts Services ───────────────────────────────────────────────────────────
export const alertService = {
  listAlerts: async (params = {}) => {
    const res = await api.get('/alerts', { params });
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/alerts/count');
    return res.data;
  },
  markRead: async (alertId) => {
    const res = await api.put(`/alerts/${alertId}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/alerts/read-all');
    return res.data;
  },
  generateAlerts: async () => {
    const res = await api.post('/alerts/generate');
    return res.data;
  },
};

// ── Donations Services ────────────────────────────────────────────────────────
export const donationService = {
  listAvailable: async () => {
    const res = await api.get('/donations/available');
    return res.data;
  },
  listOrgDonations: async () => {
    const res = await api.get('/donations/my');
    return res.data;
  },
  createDonation: async (data) => {
    const res = await api.post('/donations', data);
    return res.data;
  },
  claimDonation: async (id, qtyClaimed) => {
    const res = await api.put(`/donations/${id}/claim`, { qty_claimed: qtyClaimed });
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/donations/${id}/status`, null, { params: { status } });
    return res.data;
  },
};

// ── Reports Services ──────────────────────────────────────────────────────────
export const reportService = {
  getDashboardStats: async () => {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },
  getTopMovers: async (days = 7, limit = 10) => {
    const res = await api.get('/reports/top-movers', { params: { days, limit } });
    return res.data;
  },
  getSalesTrend: async (days = 7) => {
    const res = await api.get('/reports/sales-trend', { params: { days } });
    return res.data;
  },
  downloadInventoryCsv: () => {
    const token = localStorage.getItem('medstock_token');
    window.open(`/api/reports/export/inventory?token=${token || ''}`, '_blank');
  },
  downloadSalesCsv: (dateFrom, dateTo) => {
    const token = localStorage.getItem('medstock_token');
    let url = `/api/reports/export/sales?token=${token || ''}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    window.open(url, '_blank');
  },
};

export default api;
