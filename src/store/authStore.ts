import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),

      apiFetch: async (endpoint, options = {}) => {
        const token = get().user?.token;

        const res = await fetch(`${API_URL}/${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
        });

        if (res.status === 401) {
          get().logout();
          window.location.href = '/login';
          throw new Error('Sesión expirada');
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Error en la petición');
        return data;
      },
            //apiupload para formdata
            apiUpload: async (endpoint, options: RequestInit = {}) => {
        const token = get().user?.token;

        const headers: Record<string, string> = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers as Record<string, string> || {}),
        };

        const res = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (res.status === 401) {
          get().logout();
          window.location.href = '/login';
          throw new Error('Sesión expirada');
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error en la petición');
        return data;
      },
      apiDownload: async (endpoint: string, options: RequestInit = {}) => {
          const token = get().user?.token;
          const headers: Record<string, string> = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string> || {}),
          };

          const res = await fetch(`${API_URL}/${endpoint}`, {
            ...options,
            headers,
          });

          if (res.status === 401) {
            get().logout();
            window.location.href = '/login';
            throw new Error('Sesión expirada');
          }

          return res; 
        },
    }),
    {
      name: 'catastro-auth',
      // Solo persiste user e isAuthenticated, no apiFetch
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);/*import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'catastro-auth' }
  )
);*/