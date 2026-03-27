/**
 * API Service Layer — Backend Integration Ready
 * 
 * Currently uses mock data. To swap to real API:
 * 1. Replace BASE_URL with your server address
 * 2. Pass real auth token in the Authorization header
 * 3. Replace each function body with a real fetch/axios call
 */

import {
  Doctor, Article, LabTest, Medicine,
  Appointment, MedicalRecord, Notification, ApiResponse
} from '../types';
import {
  DOCTORS, ARTICLES, LAB_TESTS, MEDICINES,
  UPCOMING_APPOINTMENTS, COMPLETED_APPOINTMENTS
} from '../constants/MockData';

const BASE_URL = 'https://api.yourdomain.com/v1'; // Replace when ready

// Simulates network delay for realistic UX development
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Doctors ──────────────────────────────────────────────────────────────────

export const getDoctors = async (): Promise<ApiResponse<Doctor[]>> => {
  await delay(800);
  return { data: DOCTORS as Doctor[], error: null, status: 'success' };
};

export const getDoctorById = async (id: string): Promise<ApiResponse<Doctor>> => {
  await delay(400);
  const doctor = DOCTORS.find(d => d.id === id);
  if (!doctor) return { data: null, error: 'Doctor not found', status: 'error' };
  return { data: doctor as Doctor, error: null, status: 'success' };
};

// ─── Articles ─────────────────────────────────────────────────────────────────

export const getArticles = async (): Promise<ApiResponse<Article[]>> => {
  await delay(600);
  return { data: ARTICLES as Article[], error: null, status: 'success' };
};

// ─── Lab Tests ────────────────────────────────────────────────────────────────

export const getLabTests = async (): Promise<ApiResponse<LabTest[]>> => {
  await delay(500);
  return { data: LAB_TESTS as LabTest[], error: null, status: 'success' };
};

// ─── Medicines ────────────────────────────────────────────────────────────────

export const getMedicines = async (): Promise<ApiResponse<Medicine[]>> => {
  await delay(500);
  return { data: MEDICINES as Medicine[], error: null, status: 'success' };
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const getUpcomingAppointments = async (): Promise<ApiResponse<Appointment[]>> => {
  await delay(700);
  return { data: UPCOMING_APPOINTMENTS as Appointment[], error: null, status: 'success' };
};

export const getCompletedAppointments = async (): Promise<ApiResponse<Appointment[]>> => {
  await delay(700);
  return { data: COMPLETED_APPOINTMENTS as Appointment[], error: null, status: 'success' };
};

export const bookAppointment = async (
  doctorId: string, date: string, slot: string
): Promise<ApiResponse<{ bookingId: string }>> => {
  await delay(1000);
  return {
    data: { bookingId: `BK-${Date.now()}` },
    error: null,
    status: 'success',
  };
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginUser = async (email: string, password: string, role: string) => {
  await delay(1000);
  return {
    data: {
      token: 'mock-jwt-token-abc123',
      user: {
        id: 'u1', name: 'Alex Johnson', email,
        phone: '+1 (555) 123-4567',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
        role,
      },
    },
    error: null, status: 'success',
  };
};

export const signupUser = async (
  name: string, email: string, password: string, role: string
) => {
  await delay(1200);
  return { data: { token: 'mock-jwt-token-new', user: { id: 'u2', name, email, role } }, error: null, status: 'success' };
};
