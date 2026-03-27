import { create } from 'zustand';
import { Role, User } from '../types';

interface AuthState {
  role: Role;
  user: User | null;
  isLoading: boolean;
  login: (role: Role, user?: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const MOCK_PATIENT: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  phone: '+1 (555) 123-4567',
  image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
  role: 'patient',
};

const MOCK_DOCTOR: User = {
  id: 'd1',
  name: 'Dr. Sarah Jenkins',
  email: 'sarah@medcenter.com',
  phone: '+1 (555) 987-6543',
  image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100',
  role: 'doctor',
};

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  user: null,
  isLoading: false,
  login: (role, user) => {
    const defaultUser = role === 'doctor' ? MOCK_DOCTOR : MOCK_PATIENT;
    set({ role, user: user ?? defaultUser });
  },
  logout: () => set({ role: null, user: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
