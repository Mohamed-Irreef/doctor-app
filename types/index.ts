// TypeScript types for Doctor Appointment Platform

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  reviews: number;
  fee: number;
  about: string;
  image: string;
  bannerImage?: string;
  availableSlots: string[];
  qualifications?: string[];
  hospital?: string;
  isFavorite?: boolean;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  image: string;
  readTime: string;
}

export interface LabTest {
  id: string;
  name: string;
  originalPrice: number;
  price: number;
  popular: boolean;
  image?: string;
  turnaround?: string;
}

export interface Medicine {
  id: string;
  name: string;
  price: number;
  image: string;
  mrp?: number;
  discountPercent?: number;
  category?: string;
  brand?: string;
  composition?: string;
  packSize?: string;
  deliveryEtaHours?: number;
  prescriptionRequired?: boolean;
  inStock?: boolean;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  status: "Upcoming" | "Pending" | "Completed" | "Cancelled";
  type?: "In-person" | "Video" | "Chat";
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  prescriptionRequired?: boolean;
  mrp?: number;
  deliveryEtaHours?: number;
  quantity: number;
}

export interface MedicalRecord {
  id: string;
  title: string;
  date: string;
  type: "PDF" | "JPG" | "PNG";
  size: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "appointment" | "reminder" | "promo" | "general";
}

export interface Review {
  id: string;
  userName: string;
  userImage: string;
  rating: number;
  comment: string;
  date: string;
}

export type Role = "patient" | "doctor" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: Role;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: LoadingState;
}
