import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  geminiApiKey: string | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  setGuestMode: (isGuest: boolean) => void;
  setGeminiApiKey: (key: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      geminiApiKey: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, isGuest: false }),
      logout: () => set({ user: null, isAuthenticated: false, isGuest: false }),
      setGuestMode: (isGuest) =>
        set({
          isGuest,
          isAuthenticated: isGuest,
          user: isGuest ? { id: "guest", name: "Guest User", email: "guest@example.com" } : null,
        }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
    }
  )
);
