const API_BASE = '/api/admin';

export async function adminRequest(endpoint, options = {}) {
  const token = localStorage.getItem('creatoros_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Admin API error (${res.status})`);
    }
    return await res.json();
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

