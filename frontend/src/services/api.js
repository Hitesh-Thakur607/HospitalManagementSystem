import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await axios({
      url: `${API_BASE}${endpoint}`,
      ...options,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Request failed" };
  }
};

export const authAPI = {
  register: (payload) => apiCall("/auth/register", { method: "POST", data: payload }),
  login: (payload) => apiCall("/auth/login", { method: "POST", data: payload }),
  logout: () => apiCall("/auth/logout", { method: "POST" }),
};

export const doctorAPI = {
  getAll: () => apiCall("/doctors"),
  getMe: () => apiCall("/doctors/me"),
  updateMe: (payload) => apiCall("/doctors/me", { method: "PUT", data: payload }),
  getAdminAll: () => apiCall("/doctors/admin/all"),
  getPending: () => apiCall("/doctors/admin/pending"),
  approve: (doctorId) => apiCall(`/doctors/admin/approve/${doctorId}`, { method: "PUT" }),
  reject: (doctorId, reason) => apiCall(`/doctors/admin/reject/${doctorId}`, { method: "PUT", data: { reason } }),
};

export const appointmentAPI = {
  getAll: () => apiCall("/appointments/mine"),
  book: (payload) => apiCall("/appointments", { method: "POST", data: payload }),
  complete: (appointmentId) => apiCall(`/appointments/${appointmentId}/complete`, { method: "PUT" }),
};
