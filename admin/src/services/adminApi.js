const API_BASE = '/api/admin';

/** Admin endpoints answer with `{ success, data, message }`; screens expect `data`. */
const unwrap = (body) => (body && body.success === true && 'data' in body ? body.data : body);

const messageFrom = (body) => {
  if (!body) return null;
  if (body.error) return typeof body.error === 'string' ? body.error : body.error.message;
  return body.message || null;
};

export async function adminRequest(endpoint, options = {}) {
  const token = localStorage.getItem('creatoros_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(messageFrom(body) || `Admin API error (${res.status})`);
    }
    return unwrap(body);
  } catch (err) {
    console.error(`Admin API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const adminApi = {
  login: (data) => adminRequest('/login', { method: 'POST', body: JSON.stringify(data) }),
  getDashboard: () => adminRequest('/dashboard'),
  getUsers: () => adminRequest('/users'),
  updateUserStatus: (id, status) => adminRequest(`/users/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  getWorkspaces: () => adminRequest('/workspaces'),
  getPlatformHealth: () => adminRequest('/health'),
  getJobs: () => adminRequest('/jobs'),
  getAIUsage: () => adminRequest('/ai-usage'),
  getStorage: () => adminRequest('/storage'),
  getFeatureFlags: () => adminRequest('/feature-flags'),
  toggleFeatureFlag: (id) => adminRequest(`/feature-flags/${id}/toggle`, { method: 'POST' }),
  getAuditLogs: () => adminRequest('/audit-logs')
};

