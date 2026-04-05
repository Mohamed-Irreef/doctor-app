import axios from "axios";

const TOKEN_KEY = "nividoc_admin_token";
const AUTH_KEY = "nividoc_admin_auth";
const USER_KEY = "nividoc_admin_user";

// Vite exposes only VITE_* environment variables to the client bundle.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
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

      const path = window.location.pathname;
      const isAuthPage = path === "/login" || path === "/admin/login";
      const adminArea = path.startsWith("/admin") && path !== "/admin/login";
      if (!isAuthPage && adminArea) {
        window.location.replace("/admin/login");
      } else if (!isAuthPage) {
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
  details: error?.response?.data?.details || null,
});

export function isAdminAuthenticated() {
  const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
  return localStorage.getItem(AUTH_KEY) === "true" && user?.role === "admin";
}

export function getPortalUser() {
  return JSON.parse(localStorage.getItem(USER_KEY) || "null");
}

export function getPortalAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function isRoleAuthenticated(role) {
  const user = getPortalUser();
  return localStorage.getItem(AUTH_KEY) === "true" && user?.role === role;
}

export async function loginPortal(email, password, role) {
  try {
    const res = await API.post("/auth/login", {
      email,
      password,
      role,
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

export async function loginAdmin(email, password) {
  return loginPortal(email, password, "admin");
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

export async function deleteAdminPatient(id) {
  try {
    const res = await API.delete(`/admin/patients/${id}`);
    return ok(res.data?.data);
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

export async function deleteAdminDoctor(id) {
  try {
    const res = await API.delete(`/admin/doctors/${id}`);
    return ok(res.data?.data);
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

export async function verifyAdminAppointmentRevenue(id, payload) {
  try {
    const res = await API.post(`/appointments/${id}/revenue-verify`, payload);
    return ok(res.data?.data);
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

export async function getLabPartnerSettings() {
  try {
    const res = await API.get("/partner/lab/settings");
    return ok(res.data?.data || {});
  } catch (error) {
    return fail(error);
  }
}

export async function updateLabPartnerSettings(payload) {
  try {
    const res = await API.put("/partner/lab/settings", payload);
    return ok(res.data?.data || {});
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

export async function getAdminErrors(params) {
  try {
    const res = await API.get("/admin/errors", { params });
    return ok(res.data?.data || { total: 0, entries: [] });
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminAuditLogs(params) {
  try {
    const res = await API.get("/admin/audit-logs", { params });
    return ok(
      res.data?.data || {
        entries: [],
        pagination: { total: 0, page: 1, limit: 25, pages: 1 },
      },
    );
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

export async function uploadPublicFile(file, folder = "nividoc/partners") {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await API.post("/upload-public", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function uploadLabReportFile(file, onProgress) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "nividoc/lab-reports");

    const res = await API.post("/upload-public", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (!event?.total || typeof onProgress !== "function") return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });

    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function registerLabBusiness(payload) {
  try {
    const res = await API.post("/business/register/lab", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function registerPharmacyBusiness(payload) {
  try {
    const res = await API.post("/business/register/pharmacy", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getEcosystemMetrics() {
  try {
    const res = await API.get("/admin/ecosystem/metrics");
    return ok(res.data?.data || {});
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminLabApprovalRequests() {
  try {
    const res = await API.get("/admin/approvals/labs");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function decideAdminLabApproval(id, payload) {
  try {
    const res = await API.put(`/admin/approvals/labs/${id}`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminPharmacyApprovalRequests() {
  try {
    const res = await API.get("/admin/approvals/pharmacies");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function decideAdminPharmacyApproval(id, payload) {
  try {
    const res = await API.put(`/admin/approvals/pharmacies/${id}`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminPendingContent() {
  try {
    const res = await API.get("/admin/content/pending");
    return ok(res.data?.data || { labTests: [], medicines: [] });
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminApprovedPartners(params) {
  try {
    const res = await API.get("/admin/partners/approved", { params });
    return ok(res.data?.data || { items: [], summary: {} });
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminPartnerDetails(id) {
  try {
    const res = await API.get(`/admin/partners/${id}`);
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(error);
  }
}

export async function toggleAdminPartnerBan(id, banned) {
  try {
    const res = await API.put(`/admin/partners/${id}/ban`, { banned });
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAdminPartner(id) {
  try {
    const res = await API.delete(`/admin/partners/${id}`);
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(error);
  }
}

export async function decideAdminLabContent(id, payload) {
  try {
    const res = await API.put(
      `/admin/content/lab-tests/${id}/decision`,
      payload,
    );
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function decideAdminMedicineContent(id, payload) {
  try {
    const res = await API.put(
      `/admin/content/medicines/${id}/decision`,
      payload,
    );
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getLabPartnerDashboard() {
  try {
    const res = await API.get("/partner/lab/dashboard");
    return ok(res.data?.data || {});
  } catch (error) {
    return fail(error);
  }
}

export async function getLabPartnerTests() {
  try {
    const res = await API.get("/partner/lab/tests");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function createLabPartnerTest(payload) {
  try {
    const res = await API.post("/partner/lab/tests", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function createLabPartnerTestMultipart(payload, files = {}) {
  try {
    const formData = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }
      if (typeof value === "boolean" || typeof value === "number") {
        formData.append(key, String(value));
        return;
      }
      formData.append(key, value);
    });

    if (files.testImageFile) {
      formData.append("testImageFile", files.testImageFile);
    }
    if (files.reportSampleFile) {
      formData.append("reportSampleFile", files.reportSampleFile);
    }

    const res = await API.post("/partner/lab/tests", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updateLabPartnerTest(id, payload) {
  try {
    const res = await API.put(`/partner/lab/tests/${id}`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updateLabPartnerTestMultipart(id, payload, files = {}) {
  try {
    const formData = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }
      if (typeof value === "boolean" || typeof value === "number") {
        formData.append(key, String(value));
        return;
      }
      formData.append(key, value);
    });

    if (files.testImageFile) {
      formData.append("testImageFile", files.testImageFile);
    }
    if (files.reportSampleFile) {
      formData.append("reportSampleFile", files.reportSampleFile);
    }

    const res = await API.put(`/partner/lab/tests/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteLabPartnerTest(id) {
  try {
    const res = await API.delete(`/partner/lab/tests/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getLabPartnerBookings(params) {
  try {
    const res = await API.get("/partner/lab/bookings", { params });
    return ok(res.data?.data?.items || res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function updateLabPartnerBookingStatus(id, payload) {
  try {
    const res = await API.put(`/partner/lab/bookings/${id}/status`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getLabBookingsV1(params) {
  try {
    const res = await API.get("/v1/lab-bookings", { params });
    return ok(
      res.data?.data || {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 },
      },
    );
  } catch (error) {
    return fail(error);
  }
}

export async function updateLabBookingStatusV1(id, payload) {
  try {
    const res = await API.put(`/v1/lab-bookings/${id}/status`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function approveLabBookingV1(id) {
  try {
    const res = await API.put(`/v1/lab-bookings/${id}/approve`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function rejectLabBookingV1(id, payload = {}) {
  try {
    const res = await API.put(`/v1/lab-bookings/${id}/reject`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getLabPartnerMasterData() {
  try {
    const res = await API.get("/partner/lab/master-data");
    return ok(res.data?.data || {});
  } catch (error) {
    return fail(error);
  }
}

export async function addLabPartnerMasterDataItem(group, label) {
  try {
    const res = await API.post(`/partner/lab/master-data/${group}/items`, {
      label,
    });
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function updateLabPartnerMasterDataItem(group, itemId, payload) {
  try {
    const res = await API.put(
      `/partner/lab/master-data/${group}/items/${itemId}`,
      payload,
    );
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteLabPartnerMasterDataItem(group, itemId) {
  try {
    const res = await API.delete(
      `/partner/lab/master-data/${group}/items/${itemId}`,
    );
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function getPharmacyPartnerDashboard() {
  try {
    const res = await API.get("/partner/pharmacy/dashboard");
    return ok(res.data?.data || {});
  } catch (error) {
    return fail(error);
  }
}

export async function getPharmacyPartnerMedicines() {
  try {
    const res = await API.get("/partner/pharmacy/medicines");
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function createPharmacyPartnerMedicine(payload) {
  try {
    const res = await API.post("/partner/pharmacy/medicines", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getPharmacyPartnerOrders(params) {
  try {
    const res = await API.get("/partner/pharmacy/orders", { params });
    return ok(res.data?.data || []);
  } catch (error) {
    return fail(error);
  }
}

export async function updatePharmacyPartnerMedicine(id, payload) {
  try {
    const res = await API.put(`/partner/pharmacy/medicines/${id}`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function deletePharmacyPartnerMedicine(id) {
  try {
    const res = await API.delete(`/partner/pharmacy/medicines/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updatePharmacyPartnerOrderStatus(id, payload) {
  try {
    const res = await API.put(`/partner/pharmacy/orders/${id}/status`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getPharmacyOrdersV1(params) {
  try {
    const res = await API.get("/v1/orders", { params });
    return ok(
      res.data?.data || {
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    );
  } catch (error) {
    return fail(error);
  }
}

export async function approvePharmacyOrderV1(id) {
  try {
    const res = await API.put(`/v1/orders/${id}/approve`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function rejectPharmacyOrderV1(id) {
  try {
    const res = await API.put(`/v1/orders/${id}/reject`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updatePharmacyOrderV1Status(id, payload) {
  try {
    const res = await API.put(`/v1/orders/${id}/status`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function getAdminArticles(params) {
  try {
    const res = await API.get("/v1/articles", {
      params: { includeUnpublished: "true", ...params },
    });
    return ok(res.data?.data || { items: [], pagination: {} });
  } catch (error) {
    return fail(error);
  }
}

export async function createAdminArticle(payload) {
  try {
    const res = await API.post("/v1/articles", payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updateAdminArticle(id, payload) {
  try {
    const res = await API.put(`/v1/articles/${id}`, payload);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAdminArticle(id) {
  try {
    const res = await API.delete(`/v1/articles/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

// ─── Package Management (Lab Portal) ──────────────────────────────────────────

export async function getLabPartnerPackages() {
  try {
    const res = await API.get("/partner/lab/packages");
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function createLabPartnerPackage(data, files) {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (files?.packageImageFile) formData.append("packageImageFile", files.packageImageFile);
    if (files?.brochureFile) formData.append("brochureFile", files.brochureFile);
    if (files?.thumbnailFile) formData.append("thumbnailFile", files.thumbnailFile);
    const res = await API.post("/partner/lab/packages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function updateLabPartnerPackage(id, data, files) {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (files?.packageImageFile) formData.append("packageImageFile", files.packageImageFile);
    if (files?.brochureFile) formData.append("brochureFile", files.brochureFile);
    const res = await API.put(`/partner/lab/packages/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteLabPartnerPackage(id) {
  try {
    const res = await API.delete(`/partner/lab/packages/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

// ─── Package Approvals (Admin) ─────────────────────────────────────────────────

export async function getAdminPendingPackages() {
  try {
    const res = await API.get("/admin/packages?status=PENDING_APPROVAL");
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function approveAdminPackage(id) {
  try {
    const res = await API.patch(`/admin/packages/${id}/approve`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export async function rejectAdminPackage(id, reason) {
  try {
    const res = await API.patch(`/admin/packages/${id}/reject`, { reason });
    return ok(res.data?.data);
  } catch (error) {
    return fail(error);
  }
}

export default API;
