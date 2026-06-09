const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : '/api';

let jwtToken = localStorage.getItem('crm_token') || sessionStorage.getItem('crm_token') || null;

export const api = {
  setToken: (token, remember = true) => {
    jwtToken = token;
    if (token) {
      if (remember) {
        localStorage.setItem('crm_token', token);
        sessionStorage.removeItem('crm_token');
      } else {
        sessionStorage.setItem('crm_token', token);
        localStorage.removeItem('crm_token');
      }
    } else {
      localStorage.removeItem('crm_token');
      sessionStorage.removeItem('crm_token');
    }
  },

  getToken: () => {
    return jwtToken;
  },

  isAuthenticated: () => {
    return !!jwtToken;
  },

  logout: () => {
    api.setToken(null);
  },

  // Auth requests
  register: async (username, password, remember = true) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('A server error occurred. Please try again later.');
    }
    if (!response.ok) throw new Error(data.error || 'Registration failed.');
    api.setToken(data.token, remember);
    return data;
  },

  login: async (username, password, remember = true) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('A server error occurred. Please try again later.');
    }
    if (!response.ok) throw new Error(data.error || 'Login failed.');
    api.setToken(data.token, remember);
    return data;
  },

  loginWithGoogle: async (credential, remember = true) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('A server error occurred. Please try again later.');
    }
    if (!response.ok) throw new Error(data.error || 'Google login failed.');
    api.setToken(data.token, remember);
    return data;
  },

  forgotPassword: async (username) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('A server error occurred. Please try again later.');
    }
    if (!response.ok) throw new Error(data.error || 'Failed to send recovery code.');
    return data;
  },

  resetPassword: async (username, code, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code, newPassword }),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('A server error occurred. Please try again later.');
    }
    if (!response.ok) throw new Error(data.error || 'Failed to reset password.');
    return data;
  },

  verifyToken: async () => {
    if (!jwtToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.valid;
      }
      api.logout();
      return false;
    } catch {
      return false;
    }
  },

  // Public submission request
  submitLeadForm: async (leadData) => {
    const response = await fetch(`${API_BASE_URL}/leads/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Submission failed.');
    return data;
  },

  // Authenticated CRM requests
  getLeads: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.source && filters.source !== 'all') params.append('source', filters.source);

    const response = await fetch(`${API_BASE_URL}/leads?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch leads.');
    return data; // returns { leads, isFallback }
  },

  getLeadSources: async () => {
    const response = await fetch(`${API_BASE_URL}/leads/sources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch sources.');
    return data.sources; // returns unique sources array
  },

  getLeadDetails: async (id) => {
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch lead.');
    return data;
  },

  updateLeadStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update status.');
    return data.lead;
  },

  updateLeadDetails: async (id, details) => {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/details`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(details),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update details.');
    return data.lead;
  },

  addLeadNote: async (id, text) => {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add note.');
    return data.lead;
  },

  deleteLead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete lead.');
    return data;
  }
};
