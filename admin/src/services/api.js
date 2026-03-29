import axios from "axios";

const TOKEN_KEY = "nividoc_admin_token";
const AUTH_KEY = "nividoc_admin_auth";
const USER_KEY = "nividoc_admin_user";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 20000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

const ok = (data) => ({ status: "success", data, error: null });
const fail = (error) => ({
  status: "error",
  data: null,
  error: error?.response?.data?.message || error?.message || "Request failed",
});

export function isAdminAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export async function loginAdmin(email, password) {
  try {
    const res = await API.post("/auth/login", {
      email,
      password,
      role: "admin",
    });
    const payload = res.data?.data;
    if (payload?.accessToken) {
      localStorage.setItem(TOKEN_KEY, payload.accessToken);
      localStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user || {}));
    }
    return ok(payload);
  } catch (error) {
    return fail(error);
  }
}

export function logoutAdmin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function getAdminDashboard() {
  try {
    const res = await API.get("/admin/dashboard");
    return ok(res.data?.data || {});
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminPatients() {
  try {
    const res = await API.get("/admin/patients");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminDoctors(params) {
  try {
    const res = await API.get("/admin/doctors", { params });
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminDoctorRequests() {
  try {
    const res = await API.get("/admin/doctors/requests");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function approveAdminDoctor(doctorUserId, approved) {
  try {
    const res = await API.put("/admin/doctors/approve", {
      doctorUserId,
      approved,
    });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminAppointments() {
  try {
    const res = await API.get("/admin/appointments");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminSlots(params) {
  try {
    const res = await API.get("/admin/slots", { params });
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminLabs() {
  try {
    const res = await API.get("/admin/labs");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function createAdminLab(payload) {
  try {
    const res = await API.post("/admin/labs", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updateAdminLab(id, payload) {
  try {
    const res = await API.put(`/admin/labs/${id}`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAdminLab(id) {
  try {
    const res = await API.delete(`/admin/labs/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminMedicines() {
  try {
    const res = await API.get("/admin/medicines");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function createAdminMedicine(payload) {
  try {
    const res = await API.post("/admin/medicines", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updateAdminMedicine(id, payload) {
  try {
    const res = await API.put(`/admin/medicines/${id}`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAdminMedicine(id) {
  try {
    const res = await API.delete(`/admin/medicines/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminOrders() {
  try {
    const res = await API.get("/admin/orders");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function updateAdminOrderStatus(id, status) {
  try {
    const res = await API.put(`/admin/orders/${id}/status`, { status });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminPayments() {
  try {
    const res = await API.get("/admin/payments");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminReviews() {
  try {
    const res = await API.get("/admin/reviews");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAdminReview(id) {
  try {
    const res = await API.delete(`/admin/reviews/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminNotifications() {
  try {
    const res = await API.get("/admin/notifications");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function createAdminNotification(payload) {
  try {
    const res = await API.post("/admin/notifications", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminSettings() {
  try {
    const res = await API.get("/admin/settings");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function updateAdminSettings(payload) {
  try {
    const res = await API.put("/admin/settings", payload);
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export default API;
