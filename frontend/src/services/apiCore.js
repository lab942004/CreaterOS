const API_BASE = '/api';
const TOKEN_KEY = 'creatoros_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

/** The backend answers with `{ success, data, message }`; screens expect `data` itself. */
const unwrap = (body) => (body && body.success === true && 'data' in body ? body.data : body);

const messageFrom = (body) => {
  if (!body) return null;
  if (body.error) return typeof body.error === 'string' ? body.error : body.error.message;
  return body.message || null;
};

let refreshPromise = null;

/** Rotates the refresh cookie into a new access token, at most once at a time. */
const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          setStoredToken(null);
          return null;
        }
        const body = await res.json().catch(() => null);
        const data = unwrap(body);
        if (data?.token) setStoredToken(data.token);
        return data?.token ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const fetchJson = async (url, options) => {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(messageFrom(body) || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return unwrap(body);
};

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const build = (token) => ({
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  try {
    return await fetchJson(url, build(getStoredToken()));
  } catch (err) {
    // An expired access token is recoverable; a bad password is not.
    if (err?.status === 401 && !endpoint.startsWith('/auth/')) {
      const token = await refreshSession();
      if (token) return await fetchJson(url, build(token));
    }
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const coreApi = {
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data) => apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resendOtp: (data) => apiRequest('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  logoutAll: () => apiRequest('/auth/logout-all', { method: 'POST' }),
  getSessions: () => apiRequest('/auth/sessions'),
  refresh: () => refreshSession(),
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
  generateScript: (data) => apiRequest('/ai/generate-script', { method: 'POST', body: JSON.stringify(data) }),
};
