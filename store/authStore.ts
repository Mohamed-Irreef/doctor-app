import { create } from "zustand";
import { Role, User } from "../types";

interface AuthState {
  role: Role;
  user: User | null;
  isLoading: boolean;
  login: (role: Role, user?: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  user: null,
  isLoading: false,
  login: (role, user) => {
    set({ role, user: user ?? null });
  },
  logout: () => set({ role: null, user: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
