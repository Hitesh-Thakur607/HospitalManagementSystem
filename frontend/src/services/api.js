import axios from "axios";

const rawApiBase = process.env.REACT_APP_API_URL?.trim();
const API_BASE = (rawApiBase && rawApiBase !== "/" ? rawApiBase : "/api").replace(/\/+$/, "");

export const apiCall = async (endpoint, options = {}) => {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  try {
    const response = await axios({
      url: `${API_BASE}${normalizedEndpoint}`,
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

export const patientAPI = {
  getAll: () => apiCall("/patients"),
  getMe: () => apiCall("/patients/me"),
  updateMe: (payload) => apiCall("/patients/me", { method: "PUT", data: payload }),
};

export const appointmentAPI = {
  getAll: () => apiCall("/appointments/mine"),
  book: (payload) => apiCall("/appointments", { method: "POST", data: payload }),
  complete: (appointmentId) => apiCall(`/appointments/${appointmentId}/complete`, { method: "PUT" }),
};

export const chatAPI = {
  getMessages: (peerUserId) => apiCall(`/chat/${peerUserId}/messages`),
  sendMessage: (peerUserId, message) => apiCall(`/chat/${peerUserId}/messages`, { method: "POST", data: { message } }),
};
