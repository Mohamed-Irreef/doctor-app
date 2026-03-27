import { create } from 'zustand';
import { Doctor } from '../types';

interface FavoritesState {
  favorites: Doctor[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (doctor: Doctor) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isFavorite: (id: string) => get().favorites.some(d => d.id === id),
  toggleFavorite: (doctor: Doctor) => {
    const already = get().isFavorite(doctor.id);
    set(state => ({
      favorites: already
        ? state.favorites.filter(d => d.id !== doctor.id)
        : [...state.favorites, doctor],
    }));
  },
}));
