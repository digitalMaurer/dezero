import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(email, password);
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error en login',
        loading: false,
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.register(data);
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error en registro',
        loading: false,
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
