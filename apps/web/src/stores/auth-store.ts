import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "admin";
};

interface AuthState {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  clearUser: () => void;
}

/** Cached admin profile so the admin shell paints instantly on reload;
 * the /auth/me query remains the source of truth. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "sw-admin",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
