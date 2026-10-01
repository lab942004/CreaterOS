const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('creatoros_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const coreApi = {
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  updateOnboarding: (data) => apiRequest('/auth/onboarding', { method: 'POST', body: JSON.stringify(data) }),

  getDashboard: () => apiRequest('/dashboard'),
  getAnalyticsOverview: (timeframe) => apiRequest(`/analytics/overview?timeframe=${timeframe || '30d'}`),
  getPlatformAnalytics: () => apiRequest('/analytics/platforms'),

  getContent: (params = {}) => apiRequest(`/content?${new URLSearchParams(params).toString()}`),
  getContentDetail: (id) => apiRequest(`/content/${id}`),
  createContent: (data) => apiRequest('/content', { method: 'POST', body: JSON.stringify(data) }),
  updateContent: (id, data) => apiRequest(`/content/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContent: (id) => apiRequest(`/content/${id}`, { method: 'DELETE' }),
  getContentDNA: (id) => apiRequest(`/content/${id}/dna`),

  getIdeas: (params = {}) => apiRequest(`/ideas?${new URLSearchParams(params).toString()}`),
  generateIdeas: (data) => apiRequest('/ideas/generate', { method: 'POST', body: JSON.stringify(data) }),
  favoriteIdea: (id) => apiRequest(`/ideas/${id}/favorite`, { method: 'POST' }),
  deleteIdea: (id) => apiRequest(`/ideas/${id}`, { method: 'DELETE' }),
  convertIdeaToContent: (id) => apiRequest(`/ideas/${id}/convert-content`, { method: 'POST' }),
  convertIdeaToScript: (id) => apiRequest(`/ideas/${id}/convert-script`, { method: 'POST' }),
  getOpportunities: () => apiRequest('/opportunities'),
  takeOpportunityAction: (data) => apiRequest('/opportunities/action', { method: 'POST', body: JSON.stringify(data) }),

  chatStrategist: (messages) => apiRequest('/ai/strategist', { method: 'POST', body: JSON.stringify({ messages }) }),
  chatMyContent: (question) => apiRequest('/ai/my-content', { method: 'POST', body: JSON.stringify({ question }) }),
  runAICommand: (command) => apiRequest('/ai/command', { method: 'POST', body: JSON.stringify({ command }) }),
  generateAIContent: (data) => apiRequest('/ai/generate-content', { method: 'POST', body: JSON.stringify(data) }),
  generateScript: (data) => apiRequest('/ai/generate-script', { method: 'POST', body: JSON.stringify(data) })
};

