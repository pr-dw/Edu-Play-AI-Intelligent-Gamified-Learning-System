const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('eduplay_access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errData;
      try {
        errData = await res.json();
      } catch {
        errData = { detail: res.statusText };
      }
      const error = new Error(errData.error || errData.detail || errData.message || 'Request failed');
      error.status = res.status;
      error.data = errData;
      throw error;
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // 1. User Management
  auth: {
    login: async (username, password) => {
      const data = await request('/users/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.access) {
        localStorage.setItem('eduplay_access_token', data.access);
        localStorage.setItem('eduplay_refresh_token', data.refresh);
        localStorage.setItem('eduplay_user', JSON.stringify(data.user));
      }
      return data;
    },
    register: async (userData) => {
      const data = await request('/users/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (data.access) {
        localStorage.setItem('eduplay_access_token', data.access);
        localStorage.setItem('eduplay_refresh_token', data.refresh);
        localStorage.setItem('eduplay_user', JSON.stringify(data.user));
      }
      return data;
    },
    logout: () => {
      localStorage.removeItem('eduplay_access_token');
      localStorage.removeItem('eduplay_refresh_token');
      localStorage.removeItem('eduplay_user');
    },
    getCurrentUser: () => {
      try {
        return JSON.parse(localStorage.getItem('eduplay_user'));
      } catch {
        return null;
      }
    },
    getProfile: () => request('/users/profile/'),
    getStats: () => request('/users/stats/'),
    getLeaderboard: () => request('/users/leaderboard/'),
  },

  // 2. Course Management
  courses: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/courses/${query ? `?${query}` : ''}`);
    },
    categories: () => request('/courses/categories/'),
    myCourses: () => request('/courses/my-courses/'),
    detail: (id) => request(`/courses/${id}/`),
    enroll: (id) => request(`/courses/${id}/enroll/`, { method: 'POST' }),
    getLesson: (id) => request(`/courses/lessons/${id}/`),
    completeLesson: (id) => request(`/courses/lessons/${id}/complete/`, { method: 'POST' }),
  },

  // 3. AI Personal Tutor (LangChain)
  tutor: {
    getProvidersStatus: () => request('/tutor/providers/'),
    getSessions: () => request('/tutor/sessions/'),
    getSession: (id) => request(`/tutor/sessions/${id}/`),
    chat: (payload) => request('/tutor/chat/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  },

  // 4. Certificate Management
  certificates: {
    myCertificates: () => request('/certificates/'),
    claim: (courseId) => request(`/certificates/claim/${courseId}/`, { method: 'POST' }),
    verify: (certId) => request(`/certificates/verify/${encodeURIComponent(certId)}/`),
    getPdfDownloadUrl: (certId) => `${BASE_URL}/certificates/download/${encodeURIComponent(certId)}/`,
  },

  // 5. Administration
  admin: {
    getOverview: () => request('/admin/overview/'),
    getUsers: () => request('/admin/users/'),
    updateUser: (data) => request('/admin/users/', { method: 'PATCH', body: JSON.stringify(data) }),
    getCourses: () => request('/admin/courses/'),
    createCourse: (data) => request('/admin/courses/', { method: 'POST', body: JSON.stringify(data) }),
    updateCourse: (data) => request('/admin/courses/', { method: 'PATCH', body: JSON.stringify(data) }),
    getSettings: () => request('/admin/settings/'),
    updateSettings: (data) => request('/admin/settings/', { method: 'POST', body: JSON.stringify(data) }),
    seedData: () => request('/admin/seed/', { method: 'POST' }),
  },
};
