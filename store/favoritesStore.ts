import { create } from "zustand";
import { Doctor } from "../types";

interface FavoritesState {
  favorites: Doctor[];
  isFavorite: (id: string) => boolean;
  setFavorite: (doctor: Doctor, liked: boolean) => void;
  toggleFavorite: (doctor: Doctor) => void;
}

const getDoctorId = (doctor: Partial<Doctor> & { _id?: string }) =>
  String(doctor.id ?? doctor._id ?? "");

const normalizeDoctor = (doctor: Doctor & { _id?: string }): Doctor => ({
  ...doctor,
  id: getDoctorId(doctor),
});

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isFavorite: (id: string) =>
    get().favorites.some(
      (d) => getDoctorId(d as Doctor & { _id?: string }) === String(id),
    ),
  setFavorite: (doctor: Doctor & { _id?: string }, liked: boolean) => {
    const normalized = normalizeDoctor(doctor);
    const doctorId = normalized.id;

    set((state) => {
      const exists = state.favorites.some((d) => d.id === doctorId);
      if (liked) {
        return {
          favorites: exists
            ? state.favorites.map((d) => (d.id === doctorId ? normalized : d))
            : [...state.favorites, normalized],
        };
      }
      return {
        favorites: state.favorites.filter((d) => d.id !== doctorId),
      };
    });
  },
  toggleFavorite: (doctor: Doctor) => {
    const normalized = normalizeDoctor(doctor as Doctor & { _id?: string });
    const already = get().isFavorite(normalized.id);
    get().setFavorite(normalized, !already);
  },
}));
