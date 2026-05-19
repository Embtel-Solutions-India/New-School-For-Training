import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import API, { configureAuthInterceptors } from "../services/api";
import { normalizeRole } from "../utils/roles";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      authLoading: true,
      sessionChecked: false,
      sessionExpired: false,

      // IMPORTANT
      hydrated: false,

      setHydrated: (value) => {
        set({ hydrated: value });
      },

      setSession: (user, accessToken) => {
        const normalizedUser = user ? { ...user, role: normalizeRole(user.role) } : user;
        if (import.meta.env.DEV) {
          console.debug("[auth] Session stored", {
            userId: normalizedUser?._id,
            role: normalizedUser?.role,
            accountStatus: normalizedUser?.accountStatus,
            hasAccessToken: Boolean(accessToken),
          });
        }
        set({
          user: normalizedUser,
          accessToken,
          sessionExpired: false,
          sessionChecked: true,
          authLoading: false,
        });
      },

      login: async (payload) => {
        const { data } = await API.post("/auth/login", payload);

        get().setSession(data.user, data.accessToken);

        return data.user;
      },

      signup: async (payload) => {
        const { data } = await API.post("/auth/signup", payload);

        get().setSession(data.user, data.accessToken);

        return data.user;
      },

      hydrateSession: async () => {
        if (get().authLoading && get().sessionChecked) return;

        set({ authLoading: true });

        try {
          const { data } = await API.post("/auth/refresh");

          get().setSession(data.user, data.accessToken);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn("[auth] Initial session restore failed:", {
              status: err?.response?.status,
              data: err?.response?.data,
            });
          }

          set({
            user: null,
            accessToken: null,
          });
        } finally {
          set({ authLoading: false, sessionChecked: true });
        }
      },

      logout: async () => {
        try {
          await API.post("/auth/logout");
        } finally {
          set({
            user: null,
            accessToken: null,
            sessionExpired: false,
            sessionChecked: true,
            authLoading: false,
          });
        }
      },

      expireSession: () => {
        set({
          user: null,
          accessToken: null,
          sessionExpired: true,
          sessionChecked: true,
          authLoading: false,
        });
      },

      clearSessionExpired: () => {
        set({ sessionExpired: false });
      },

      hasRole: (roles = []) => {
        const roleList = Array.isArray(roles)
          ? roles
          : [roles];

        return (
          !!get().user &&
          roleList.includes(normalizeRole(get().user.role))
        );
      },
    }),
    {
      name: "sft-auth",

      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),

      // IMPORTANT FIX
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

configureAuthInterceptors({
  getAccessToken: () =>
    useAuthStore.getState().accessToken,

  onSessionRefresh: (user, accessToken) =>
    useAuthStore
      .getState()
      .setSession(user, accessToken),

  onSessionExpired: () =>
    useAuthStore.getState().expireSession(),
});

export default useAuthStore;
