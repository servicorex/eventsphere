const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Standard fetch wrapper configured with credentials and common headers.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-EventSphere-Request': 'true'
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Includes HTTP-only session cookies
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error((data && data.message) || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: credentials }),
  getMe: () => apiFetch('/auth/me', { method: 'GET' }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  getAdminOverview: () => apiFetch('/admin/overview', { method: 'GET' }),
  getOrganizerOverview: () => apiFetch('/organizer/overview', { method: 'GET' })
};

export const dashboardApi = {
  getStats: () => apiFetch('/dashboard/stats', { method: 'GET' })
};

export const eventsApi = {
  getAll: () => apiFetch('/events', { method: 'GET' }),
  getById: (id) => apiFetch(`/events/${id}`, { method: 'GET' }),
  create: (data) => apiFetch('/events', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/events/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
  allocateResource: (id, data) => apiFetch(`/events/${id}/resources`, { method: 'POST', body: data }),
  releaseResource: (id, resourceId) => apiFetch(`/events/${id}/resources/${resourceId}`, { method: 'DELETE' })
};

export const venuesApi = {
  getAll: () => apiFetch('/venues', { method: 'GET' }),
  getById: (id) => apiFetch(`/venues/${id}`, { method: 'GET' }),
  create: (data) => apiFetch('/venues', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/venues/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/venues/${id}`, { method: 'DELETE' })
};

export const resourcesApi = {
  getAll: () => apiFetch('/resources', { method: 'GET' }),
  getById: (id) => apiFetch(`/resources/${id}`, { method: 'GET' }),
  create: (data) => apiFetch('/resources', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/resources/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/resources/${id}`, { method: 'DELETE' })
};

export const opsApi = {
  getRegistrations: (eventId) => apiFetch(eventId ? `/ops/registrations?eventId=${eventId}` : '/ops/registrations', { method: 'GET' }),
  register: (data) => apiFetch('/ops/register', { method: 'POST', body: data }),
  checkIn: (data) => apiFetch('/ops/checkin', { method: 'POST', body: data }),
  getContracts: () => apiFetch('/ops/contracts', { method: 'GET' }),
  createContract: (data) => apiFetch('/ops/contracts', { method: 'POST', body: data }),
  updateContract: (id, data) => apiFetch(`/ops/contracts/${id}`, { method: 'PUT', body: data })
};
