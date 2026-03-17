import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    enabled: boolean;
    provider: string;
    avatarUrl: string;
    createdAt: string;
  } | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthState["user"]) => void;
  logout: () => void;
  checkLogin: () => boolean;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      checkLogin: () => {
        if (get().token && get().isAuthenticated) return true;
        else return false;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export default useAuthStore;
