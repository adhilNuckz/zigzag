import useAuthStore from '../stores/authStore';

const BASE = '/api';

async function request(path, options = {}) {
  const token = useAuthStore.getState().token;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['x-session-token'] = token;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Session expired — clear and redirect
    useAuthStore.getState().logout();
    window.location.href = '/';
    throw new Error('Session expired');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// === Auth ===
export const authAPI = {
  register: () => request('/auth/register', { method: 'POST' }),
  me: () => request('/auth/me'),
  rotate: () => request('/auth/rotate', { method: 'POST' }),
  setRecovery: (recoveryPhrase) =>
    request('/auth/set-recovery', {
      method: 'POST',
      body: JSON.stringify({ recoveryPhrase }),
    }),
  recover: (anonId, recoveryPhrase) =>
    request('/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ anonId, recoveryPhrase }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// === Chat ===
export const chatAPI = {
  getMessages: (room = 'global', limit = 50) =>
    request(`/chat/messages?room=${room}&limit=${limit}`),
};

// === Resources ===
export const resourceAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/resources?${q}`);
  },
  get: (id) => request(`/resources/${id}`),
  create: (formData) =>
    request('/resources', { method: 'POST', body: formData }),
  report: (id) => request(`/resources/${id}/report`, { method: 'POST' }),
};

// === Blog ===
export const blogAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/blog?${q}`);
  },
  get: (id) => request(`/blog/${id}`),
  create: (data) =>
    request('/blog', { method: 'POST', body: JSON.stringify(data) }),
  upvote: (id) => request(`/blog/${id}/upvote`, { method: 'POST' }),
  comment: (id, content) =>
    request(`/blog/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  report: (id) => request(`/blog/${id}/report`, { method: 'POST' }),
};

// === Ideas ===
export const ideaAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/ideas?${q}`);
  },
  get: (id) => request(`/ideas/${id}`),
  create: (data) =>
    request('/ideas', { method: 'POST', body: JSON.stringify(data) }),
  upvote: (id) => request(`/ideas/${id}/upvote`, { method: 'POST' }),
  save: (id) => request(`/ideas/${id}/save`, { method: 'POST' }),
  report: (id) => request(`/ideas/${id}/report`, { method: 'POST' }),
};

// === Security Tools ===
export const secToolsAPI = {
  list: () => request('/security-tools'),
  execute: (name, body) => {
    if (body instanceof FormData) {
      return request(`/security-tools/${name}/execute`, {
        method: 'POST',
        body,
      });
    }
    return request(`/security-tools/${name}/execute`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
