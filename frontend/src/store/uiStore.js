import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      darkMode: false,
      focusMode: false,

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      setDarkMode: (value) => set({ darkMode: value }),
      setFocusMode: (value) => set({ focusMode: value }),
    }),
    {
      name: 'ui-preferences',
    }
  )
);
