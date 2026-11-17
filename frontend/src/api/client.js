// Frontend API Client for AI CivicFix

const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('civicfix_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('civicfix_token', token);
  } else {
    localStorage.removeItem('civicfix_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...options.headers
  };

  // If body is FormData, don't set Content-Type header so browser adds multipart boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  demoLogin: (role) =>
    request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request('/auth/me'),
  getWorkers: (department) =>
    request(`/auth/workers${department ? `?department=${encodeURIComponent(department)}` : ''}`),

  // Complaints
  getComplaints: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.append(k, v);
    });
    return request(`/complaints?${q.toString()}`);
  },
  getComplaint: (id) => request(`/complaints/${id}`),
  createComplaint: (formData) =>
    request('/complaints', { method: 'POST', body: formData }),
  assignWorker: (id, payload) =>
    request(`/complaints/${id}/assign`, { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id, status, notes) =>
    request(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    }),
  submitResolutionProof: (id, formData) =>
    request(`/complaints/${id}/resolve`, { method: 'POST', body: formData }),
  citizenConfirm: (id, payload) =>
    request(`/complaints/${id}/confirm`, { method: 'POST', body: JSON.stringify(payload) }),
  toggleEmergency: (id) =>
    request(`/complaints/${id}/emergency`, { method: 'POST' }),

  // AI & Vision
  scanImage: (formData) =>
    request('/ai/scan', { method: 'POST', body: formData }),
  calculatePriority: (payload) =>
    request('/ai/calculate-priority', { method: 'POST', body: JSON.stringify(payload) }),
  copilotChat: (prompt) =>
    request('/ai/copilot', { method: 'POST', body: JSON.stringify({ prompt }) }),

  // Analytics & City Health
  getAnalytics: () => request('/analytics'),
  getHealthScore: () => request('/analytics/health'),
  getDepartments: () => request('/analytics/departments'),

  // Simulator
  runSimulation: (params) =>
    request('/simulator/run', { method: 'POST', body: JSON.stringify(params) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' })
};
