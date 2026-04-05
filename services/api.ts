import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "nividoc_token";
const USER_KEY = "nividoc_user";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";
const BASE_URL = API_BASE_URL;
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

if (!BASE_URL) {
  console.warn("[api] EXPO_PUBLIC_API_URL is not set.");
}

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

API.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function setAuthSession(token: string, user: unknown) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getAuthToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function getSocketBaseUrl() {
  return SOCKET_URL;
}

const ok = <T>(data: T) => ({ data, error: null, status: "success" as const });
const fail = (message: string) => ({
  data: null,
  error: message,
  status: "error" as const,
});

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message;
  const details = error?.response?.data?.details;
  const fieldErrors = details?.fieldErrors;

  if (message === "Validation failed" && fieldErrors) {
    const firstField = Object.keys(fieldErrors)[0];
    const firstError = firstField ? fieldErrors[firstField]?.[0] : null;
    if (firstError) return firstError;
  }

  return message || error?.message || "Request failed";
}

export async function registerPatient(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  image?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  allergies?: string[];
  medicalConditions?: string[];
}) {
  try {
    const cleanedPayload = {
      ...payload,
      ...(payload.image ? { image: payload.image } : {}),
    };
    const res = await API.post("/auth/register", cleanedPayload);
    const result = res.data.data;
    if (result?.accessToken) {
      await setAuthSession(result.accessToken, result.user);
    }
    return ok(result);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function registerDoctorSignupRequest(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  image?: string;
  gender: string;
  specialization: string;
  qualifications: string[];
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  consultationFeeVideo: number;
  consultationFeeInPerson: number;
  consultationFeeChat: number;
  availabilityType: "online" | "offline" | "both";
  clinicName: string;
  clinicAddress: string;
  clinicLocation: {
    latitude: number;
    longitude: number;
  };
  hospital?: string;
  bio?: string;
  languages: string[];
  certificateUrls?: string[];
  certificateFiles?: { url: string; name?: string }[];
}) {
  try {
    const cleanedPayload = {
      ...payload,
      ...(payload.image ? { image: payload.image } : {}),
      ...(payload.certificateUrls?.length
        ? {
            certificateUrls: payload.certificateUrls.filter((item) =>
              Boolean(item && item.trim()),
            ),
          }
        : {}),
      ...(payload.certificateFiles?.length
        ? {
            certificateFiles: payload.certificateFiles.filter(
              (item) => item?.url && item.url.trim(),
            ),
          }
        : {}),
    };
    const res = await API.post("/doctors/signup-request", cleanedPayload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function googleLogin(idToken: string, role: "patient" | "doctor") {
  try {
    const res = await API.post("/auth/google", { idToken, role });
    const payload = res.data.data;
    if (payload?.accessToken) {
      await setAuthSession(payload.accessToken, payload.user);
    }
    return ok(payload);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getMyProfile() {
  try {
    const res = await API.get("/auth/me");
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function updatePatientProfile(payload: {
  name?: string;
  phone?: string;
  image?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  location?: { latitude: number; longitude: number };
  allergies?: string[];
  medicalConditions?: string[];
}) {
  try {
    const res = await API.put("/auth/profile", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function updateDoctorProfile(payload: {
  name?: string;
  phone?: string;
  image?: string;
  gender?: string;
  specialization?: string;
  qualifications?: string[];
  experienceYears?: number;
  consultationFee?: number;
  consultationFeeVideo?: number;
  consultationFeeInPerson?: number;
  consultationFeeChat?: number;
  availabilityType?: "online" | "offline" | "both";
  clinicName?: string;
  clinicAddress?: string;
  clinicLocation?: { latitude: number; longitude: number };
  hospital?: string;
  bio?: string;
  bannerImage?: string;
  languages?: string[];
  certificateUrls?: string[];
  dailySlotLimit?: number;
  noticePeriodHours?: number;
}) {
  try {
    const res = await API.put("/doctors/profile", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function uploadFile(
  file: { uri: string; name: string; type: string },
  folder = "nividoc/uploads",
  isPublic = false,
) {
  try {
    const form = new FormData();
    form.append("folder", folder);
    form.append("file", file as any);

    const endpoint = isPublic ? "/upload-public" : "/upload";
    const res = await API.post(endpoint, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function loginUser(email: string, password: string, role: string) {
  try {
    const res = await API.post("/auth/login", { email, password, role });
    const payload = res.data.data;
    if (payload?.accessToken) {
      await setAuthSession(payload.accessToken, payload.user);
    }
    return ok(payload);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getDoctors(params?: {
  q?: string;
  specialization?: string;
  sort?: string;
}) {
  try {
    const res = await API.get("/doctors", { params });
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getDoctorById(id: string) {
  try {
    const res = await API.get(`/doctors/${id}`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getDoctorReviews(doctorId: string) {
  try {
    const res = await API.get(`/doctors/${doctorId}/reviews`);
    return ok(Array.isArray(res.data?.data) ? res.data.data : []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getMyDoctorLikes(ids?: string[]) {
  try {
    const res = await API.get("/doctors/likes/my", {
      params: ids?.length ? { ids: ids.join(",") } : undefined,
    });
    return ok(res.data?.data?.likedDoctorIds || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function toggleDoctorLike(doctorId: string) {
  try {
    const res = await API.post(`/doctors/${doctorId}/like`);
    return ok(res.data?.data || { liked: false, likesCount: 0 });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getDoctorSlots(doctorId: string, date?: string) {
  try {
    const res = await API.get(`/slots/${doctorId}`, {
      params: date ? { date } : undefined,
    });
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createDoctorSlot(payload: {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}) {
  try {
    const res = await API.post("/slots", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function updateDoctorSlot(
  slotId: string,
  payload: {
    date?: string;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    status?: "available" | "booked" | "blocked";
  },
) {
  try {
    const res = await API.patch(`/slots/${slotId}`, payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function deleteDoctorSlot(slotId: string) {
  try {
    const res = await API.delete(`/slots/${slotId}`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function bulkCopyDoctorSlots(payload: {
  sourceDayOfWeek: number;
  targetDayOfWeek: number;
  fromDate: string;
  toDate: string;
}) {
  try {
    const res = await API.post("/slots/bulk-copy", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createAppointment(payload: {
  doctorId: string;
  slotId: string;
  type: "video" | "chat" | "in-person";
  medicalDetails?: {
    disease?: string;
    durationOfIssue?: string;
    severityLevel?: string;
    symptoms?: string[];
    currentMedicines?: string[];
    allergies?: string[];
    heightCm?: number;
    weightKg?: number;
    bloodGroup?: string;
    medicalHistory?: string[];
    additionalNotes?: string;
    reportFiles?: { url: string; name?: string; mimeType?: string }[];
  };
}) {
  try {
    const res = await API.post("/appointments", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function bookAppointment(
  doctorId: string,
  _date: string,
  slotId: string,
  type: "video" | "chat" | "in-person" = "video",
  medicalDetails?: {
    disease?: string;
    durationOfIssue?: string;
    severityLevel?: string;
    symptoms?: string[];
    currentMedicines?: string[];
    allergies?: string[];
    heightCm?: number;
    weightKg?: number;
    bloodGroup?: string;
    medicalHistory?: string[];
    additionalNotes?: string;
    reportFiles?: { url: string; name?: string; mimeType?: string }[];
  },
) {
  return createAppointment({ doctorId, slotId, type, medicalDetails });
}

export async function releasePendingAppointment(id: string, reason?: string) {
  try {
    const res = await API.post(`/appointments/${id}/release`, { reason });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getVideoConsultationAccess(appointmentId: string) {
  try {
    const res = await API.get(`/appointments/${appointmentId}/video-access`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function submitAppointmentPrescription(
  appointmentId: string,
  payload: { text: string; pdfUrl: string },
) {
  try {
    const res = await API.post(
      `/appointments/${appointmentId}/prescription`,
      payload,
    );
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function verifyAppointmentRevenue(
  appointmentId: string,
  payload: { approved: boolean; payoutReference?: string },
) {
  try {
    const res = await API.post(
      `/appointments/${appointmentId}/revenue-verify`,
      payload,
    );
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getPatientAppointments() {
  try {
    const res = await API.get("/appointments/patient");
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getDoctorAppointments() {
  try {
    const res = await API.get("/appointments/doctor");
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function updateAppointmentStatus(
  id: string,
  payload: {
    status: string;
    cancellationReason?: string;
    notes?: string;
    prescription?: string;
  },
) {
  try {
    const res = await API.put(`/appointments/${id}/status`, payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getAppointmentChatMessages(
  appointmentId: string,
  params?: { limit?: number },
) {
  try {
    const res = await API.get(`/appointments/${appointmentId}/chat/messages`, {
      params,
    });
    return ok(Array.isArray(res.data?.data) ? res.data.data : []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function sendAppointmentChatMessage(
  appointmentId: string,
  payload: { text?: string; imageUrl?: string },
) {
  try {
    const res = await API.post(
      `/appointments/${appointmentId}/chat/messages`,
      payload,
    );
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createChat(payload: {
  doctorId?: string;
  patientId?: string;
}) {
  try {
    const res = await API.post("/chat/create", payload);
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getUserChats() {
  try {
    const res = await API.get("/chat/user");
    return ok(Array.isArray(res.data?.data) ? res.data.data : []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getChatMessages(
  chatId: string,
  params?: { page?: number; limit?: number },
) {
  try {
    const res = await API.get(`/chat/${chatId}/messages`, { params });
    return ok(
      res.data?.data || {
        items: [],
        pagination: { page: 1, limit: 30, total: 0, pages: 1 },
      },
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function sendChatMessage(
  chatId: string,
  payload: { type?: "text" | "image"; message?: string; fileUrl?: string },
) {
  try {
    const res = await API.post(`/chat/${chatId}/message`, payload);
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function markChatSeen(chatId: string) {
  try {
    const res = await API.put(`/chat/${chatId}/seen`);
    return ok(res.data?.data || { chatId });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function blockChat(chatId: string, block = true) {
  try {
    const res = await API.put(`/chat/${chatId}/block`, { block });
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function rescheduleAppointment(id: string, slotId: string) {
  try {
    const res = await API.put(`/appointments/${id}/reschedule`, { slotId });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getLabTests(params?: { category?: string; q?: string }) {
  try {
    const res = await API.get("/labs", { params });
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getLabTestById(id: string) {
  try {
    const res = await API.get(`/labs/${id}`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getLabSlotAvailability(id: string, date: string) {
  try {
    const res = await API.get(`/labs/${id}/slots`, { params: { date } });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function holdLabSlot(id: string, date: string, timeSlot: string) {
  try {
    const res = await API.post(`/labs/${id}/slots/hold`, { date, timeSlot });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function releaseLabSlotHold(holdId: string) {
  try {
    const res = await API.post(`/labs/slots/hold/${holdId}/release`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getLabVisitQuote(id: string) {
  try {
    const res = await API.get(`/labs/${id}/visit-quote`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function bookLab(
  labTestId: string,
  bookingDate: string,
  options?: {
    collectionType?: "home" | "lab";
    scheduledDate?: string;
    collectionTimeSlot?: string;
    holdId?: string;
    homeCollectionAddress?: {
      flatHouse: string;
      streetArea: string;
      landmark?: string;
      city: string;
      pincode: string;
      contactNumber: string;
    };
  },
) {
  try {
    const res = await API.post("/labs/book", {
      labTestId,
      bookingDate,
      ...options,
    });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getMyLabBookings(params?: { status?: string }) {
  try {
    const res = await API.get("/labs/bookings/me", { params });
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getMedicines(params?: { category?: string; q?: string }) {
  try {
    const res = await API.get("/medicines", { params });
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getMedicineById(id: string) {
  try {
    const res = await API.get(`/medicines/${id}`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createOrder(
  items: { medicineId: string; quantity: number }[],
  options?: {
    deliveryAddress?: string;
    deliveryContactName?: string;
    deliveryContactPhone?: string;
    prescription?: { url: string; note?: string };
  },
) {
  try {
    const res = await API.post("/orders", { items, ...(options || {}) });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getOrders(params?: { status?: string }) {
  try {
    const res = await API.get("/orders", { params });
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createPaymentOrder(
  type: "appointment" | "lab" | "pharmacy" | "subscription" | "package",
  relatedId: string,
) {
  try {
    const res = await API.post("/payments/create-order", { type, relatedId });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function verifyPayment(payload: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  try {
    const res = await API.post("/payments/verify", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getPlans() {
  try {
    const res = await API.get("/plans");
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createSubscriptionOrder(planCode: string) {
  try {
    const res = await API.post("/subscriptions/create-order", { planCode });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function verifySubscriptionPayment(payload: {
  subscriptionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  try {
    const res = await API.post("/subscriptions/verify-payment", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getDoctorSubscription(doctorId: string) {
  try {
    const res = await API.get(`/subscriptions/doctor/${doctorId}`);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getNotifications() {
  try {
    const res = await API.get("/notifications");
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createReview(payload: {
  doctorId: string;
  appointmentId?: string;
  rating: number;
  comment: string;
}) {
  try {
    const res = await API.post("/reviews", payload);
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getLabTestReviews(
  labTestId: string,
  params?: { page?: number; limit?: number; sortBy?: "latest" | "highest" },
) {
  try {
    const res = await API.get(`/labs/${labTestId}/reviews`, { params });
    return ok(
      res.data?.data || {
        items: [],
        summary: { averageRating: 0, totalReviews: 0 },
        pagination: {},
      },
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function addLabTestReview(
  labTestId: string,
  payload: { rating: number; comment: string },
) {
  try {
    const res = await API.post(`/labs/${labTestId}/reviews`, payload);
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

function normalizeArticleCard(item: any) {
  return {
    id: String(item._id || item.id || ""),
    slug: item.slug || "",
    title: item.title || "",
    description: item.shortDescription || "",
    image: item.coverImage || item.image || "",
    readTime: `${item.readTime || 1} min read`,
    category: item.category || "General Health",
    views: Number(item.views || 0),
    likes: Number(item.likes || 0),
    author: item.author || null,
    createdAt: item.createdAt,
  };
}

export async function getFeaturedArticles(limit = 8) {
  try {
    const res = await API.get("/v1/articles/featured", { params: { limit } });
    const items = Array.isArray(res.data?.data) ? res.data.data : [];
    return ok(items.map(normalizeArticleCard));
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getArticles(params?: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tag?: string;
  sortBy?: "latest" | "oldest" | "mostViewed" | "mostLiked";
}) {
  try {
    const res = await API.get("/v1/articles", { params });
    const payload = res.data?.data || { items: [], pagination: {} };
    const items = Array.isArray(payload.items) ? payload.items : [];
    return ok({
      items: items.map(normalizeArticleCard),
      pagination: payload.pagination || {},
    });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const res = await API.get(`/v1/articles/${slug}`);
    return ok(res.data?.data || { article: null, related: [] });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getArticleReviews(
  articleId: string,
  params?: { page?: number; limit?: number; sortBy?: "latest" | "highest" },
) {
  try {
    const res = await API.get(`/v1/articles/${articleId}/reviews`, { params });
    return ok(
      res.data?.data || {
        items: [],
        summary: { averageRating: 0, totalReviews: 0 },
        pagination: {},
      },
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function addArticleReview(
  articleId: string,
  payload: { rating: number; comment: string },
) {
  try {
    const res = await API.post(`/v1/articles/${articleId}/reviews`, payload);
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getArticleLikeStatus(articleId: string) {
  try {
    const res = await API.get(`/v1/articles/${articleId}/like-status`);
    return ok(res.data?.data || { liked: false, likesCount: 0 });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function toggleArticleLike(articleId: string) {
  try {
    const res = await API.post(`/v1/articles/${articleId}/like`);
    return ok(res.data?.data || { liked: false, likesCount: 0 });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

// ─── PACKAGES (Health Checkup) ──────────────────────────────────────────────

export async function getApprovedPackages(params?: {
  category?: string;
  limit?: number;
  page?: number;
}) {
  try {
    const res = await API.get("/packages", { params });
    return ok(res.data?.data || { packages: [], total: 0, page: 1 });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getPackageById(id: string) {
  try {
    const res = await API.get(`/packages/${id}`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createPackageBooking(id: string) {
  try {
    const res = await API.post(`/packages/${id}/bookings`);
    return ok(res.data?.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function addPackageReview(
  id: string,
  payload: { rating: number; comment: string },
) {
  try {
    const res = await API.post(`/packages/${id}/reviews`, payload);
    return ok(res.data?.data || null);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getPackageReviews(
  id: string,
  params?: { limit?: number },
) {
  try {
    const res = await API.get(`/packages/${id}/reviews`, { params });
    return ok(Array.isArray(res.data?.data) ? res.data.data : []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export default API;
