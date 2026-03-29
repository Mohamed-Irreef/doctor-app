import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const TOKEN_KEY = "nividoc_token";
const USER_KEY = "nividoc_user";

const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";

const API = axios.create({
  baseURL,
  timeout: 20000,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function setAuthSession(token: string, user: unknown) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
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

export async function createAppointment(payload: {
  doctorId: string;
  slotId: string;
  type: "video" | "chat" | "in-person";
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
) {
  return createAppointment({ doctorId, slotId, type });
}

export async function getPatientAppointments() {
  try {
    const res = await API.get("/appointments/patient");
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

export async function bookLab(labTestId: string, bookingDate: string) {
  try {
    const res = await API.post("/labs/book", { labTestId, bookingDate });
    return ok(res.data.data);
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
) {
  try {
    const res = await API.post("/orders", { items });
    return ok(res.data.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function getOrders() {
  try {
    const res = await API.get("/orders");
    return ok(res.data.data || []);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function createPaymentOrder(
  type: "appointment" | "lab" | "pharmacy" | "subscription",
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
  appointmentId: string;
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

// Placeholder for article feed until backend endpoint is introduced.
export async function getArticles() {
  return ok([] as any[]);
}

export default API;
