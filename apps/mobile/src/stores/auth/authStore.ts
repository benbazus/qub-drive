import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  AuthResponse,
  BiometricAuthResult,
} from "@/types/auth";
import { apiClient } from "@/services/api";
import { secureStorage } from "@/utils/storage";
import { BiometricAuthService } from "@/services/auth/biometricAuth";
import { STORAGE_KEYS } from "@/config/constants";

interface AuthStore extends AuthState {
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<void>;
  refreshTokens: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;

  // Biometric authentication
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<BiometricAuthResult>;
  checkBiometricAvailability: () => Promise<boolean>;

  // State setters
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  updateLastAuthTime: () => void;

  // Utility methods
  isTokenExpired: () => boolean;
  clearAuthData: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      biometricEnabled: false,
      lastAuthTime: null,

      // Authentication methods
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });

          const response = await apiClient.post<AuthResponse>(
            "/auth/login",
            credentials
          );
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens securely
          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          await secureStorage.setItem(
            STORAGE_KEYS.USER_DATA,
            JSON.stringify(user)
          );

          // Check if biometric was previously enabled
          const biometricEnabled =
            await BiometricAuthService.isEnabledForUser();

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            biometricEnabled,
            lastAuthTime: new Date(),
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true });

          const response = await apiClient.post<AuthResponse>(
            "/auth/register",
            credentials
          );
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens securely
          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          await secureStorage.setItem(
            STORAGE_KEYS.USER_DATA,
            JSON.stringify(user)
          );

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            biometricEnabled: false,
            lastAuthTime: new Date(),
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint
          const { accessToken } = get() as AuthStore;
          if (accessToken) {
            await apiClient.post("/auth/logout");
          }
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn("Logout API call failed:", error);
        } finally {
          await (get() as AuthStore).clearAuthData();
        }
      },

      resetPassword: async (credentials: ResetPasswordCredentials) => {
        try {
          set({ isLoading: true });
          await apiClient.post("/auth/reset-password", credentials);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshTokens: async () => {
        try {
          const { refreshToken: currentRefreshToken } = get() as AuthStore;
          if (!currentRefreshToken) {
            throw new Error("No refresh token available");
          }

          const response = await apiClient.post<{
            accessToken: string;
            refreshToken: string;
          }>("/auth/refresh", {
            refreshToken: currentRefreshToken,
          });

          const { accessToken, refreshToken } = response.data;

          // Update stored tokens
          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

          set({
            accessToken,
            refreshToken,
            lastAuthTime: new Date(),
          });
        } catch (error) {
          // Refresh failed, logout user
          await (get() as AuthStore).logout();
          throw error;
        }
      },

      checkAuthStatus: async () => {
        try {
          set({ isLoading: true });

          const [accessToken, refreshToken, userData, biometricEnabled] =
            await Promise.all([
              secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
              secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
              secureStorage.getItem(STORAGE_KEYS.USER_DATA),
              BiometricAuthService.isEnabledForUser(),
            ]);

          if (accessToken && refreshToken && userData) {
            const user = JSON.parse(userData);

            // Verify token is still valid
            try {
              await apiClient.get("/auth/me");

              set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
                biometricEnabled,
                lastAuthTime: new Date(),
              });
            } catch {
              // Token is invalid, try to refresh
              try {
                await (get() as AuthStore).refreshTokens();
              } catch {
                // Refresh failed, clear stored data
                await (get() as AuthStore).clearAuthData();
              }
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Error checking auth status:", error);
          set({ isLoading: false });
        }
      },

      // Biometric authentication methods
      enableBiometric: async () => {
        try {
          const success = await BiometricAuthService.enableForUser();
          if (success) {
            set({ biometricEnabled: true });
          }
          return success;
        } catch (error) {
          console.error("Error enabling biometric auth:", error);
          return false;
        }
      },

      disableBiometric: async () => {
        try {
          await BiometricAuthService.disableForUser();
          set({ biometricEnabled: false });
        } catch (error) {
          console.error("Error disabling biometric auth:", error);
        }
      },

      authenticateWithBiometric: async () => {
        try {
          const { biometricEnabled } = get() as AuthStore;
          if (!biometricEnabled) {
            return {
              success: false,
              error: "Biometric authentication is not enabled",
            };
          }

          const result = await BiometricAuthService.authenticate();
          if (result.success) {
            set({ lastAuthTime: new Date() });
          }
          return result;
        } catch (error) {
          console.error("Biometric authentication error:", error);
          return {
            success: false,
            error: "An error occurred during biometric authentication",
          };
        }
      },

      checkBiometricAvailability: async () => {
        return await BiometricAuthService.isAvailable();
      },

      // State setters
      setUser: (user: User | null) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setBiometricEnabled: (enabled: boolean) => {
        set({ biometricEnabled: enabled });
      },

      updateLastAuthTime: () => {
        set({ lastAuthTime: new Date() });
      },

      // Utility methods
      isTokenExpired: () => {
        const { lastAuthTime } = get() as AuthStore;
        if (!lastAuthTime) return true;

        const now = new Date();
        const timeDiff = now.getTime() - lastAuthTime.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Consider token expired after 24 hours
        return hoursDiff > 24;
      },

      clearAuthData: async () => {
        try {
          // Clear secure storage
          await Promise.all([
            secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
            secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
            secureStorage.removeItem(STORAGE_KEYS.USER_DATA),
          ]);

          // Reset state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            lastAuthTime: null,
          });
        } catch (error) {
          console.error("Error clearing auth data:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const value = await secureStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: string) => {
          await secureStorage.setItem(name, value);
        },
        removeItem: async (name: string) => {
          await secureStorage.removeItem(name);
        },
      })),
      partialize: (state: AuthStore) => ({
        // Only persist non-sensitive data
        biometricEnabled: state.biometricEnabled,
        lastAuthTime: state.lastAuthTime,
      }),
    }
  )
);
