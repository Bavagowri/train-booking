import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiClient } from "../api/client";

import type {
  ReactNode,
} from "react";

const ADMIN_TOKEN_STORAGE_KEY =
  "train-booking-admin-token";

export type AdminRole =
  | "ADMIN"
  | "SUPER_ADMIN";

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface AdminLoginResponse {
  data: {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: string;
    admin: AuthenticatedAdmin;
  };
  message: string;
}

interface CurrentAdminResponse {
  data: AuthenticatedAdmin;
}

interface AdminLoginCredentials {
  email: string;
  password: string;
}

interface AdminAuthContextValue {
  admin: AuthenticatedAdmin | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (
    credentials: AdminLoginCredentials,
  ) => Promise<void>;
  logout: () => void;
  refreshCurrentAdmin: () => Promise<void>;
}

const AdminAuthContext =
  createContext<
    AdminAuthContextValue | undefined
  >(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

function getStoredToken(): string | null {
  return window.localStorage.getItem(
    ADMIN_TOKEN_STORAGE_KEY,
  );
}

function storeToken(token: string): void {
  window.localStorage.setItem(
    ADMIN_TOKEN_STORAGE_KEY,
    token,
  );
}

function removeStoredToken(): void {
  window.localStorage.removeItem(
    ADMIN_TOKEN_STORAGE_KEY,
  );
}

export function AdminAuthProvider({
  children,
}: AdminAuthProviderProps) {
  const [accessToken, setAccessToken] =
    useState<string | null>(() =>
      getStoredToken(),
    );

  const [admin, setAdmin] =
    useState<AuthenticatedAdmin | null>(
      null,
    );

  const [
    isInitializing,
    setIsInitializing,
  ] = useState(true);

  const logout = useCallback(() => {
    removeStoredToken();
    setAccessToken(null);
    setAdmin(null);
  }, []);

  const refreshCurrentAdmin =
    useCallback(async (): Promise<void> => {
      const token =
        accessToken ??
        getStoredToken();

      if (!token) {
        setAdmin(null);
        return;
      }

      try {
        const response =
          await apiClient.get<
            CurrentAdminResponse
          >("/admin/auth/me", {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          });

        setAccessToken(token);
        setAdmin(response.data.data);
      } catch (error: unknown) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          logout();
          return;
        }

        throw error;
      }
    }, [accessToken, logout]);

  const login = useCallback(
    async (
      credentials: AdminLoginCredentials,
    ): Promise<void> => {
      const response =
        await apiClient.post<
          AdminLoginResponse
        >(
          "/admin/auth/login",
          credentials,
        );

      const {
        accessToken: token,
        admin: authenticatedAdmin,
      } = response.data.data;

      storeToken(token);
      setAccessToken(token);
      setAdmin(authenticatedAdmin);
    },
    [],
  );

  useEffect(() => {
    async function initializeAuth() {
      const storedToken =
        getStoredToken();

      if (!storedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        await refreshCurrentAdmin();
      } catch (error: unknown) {
        console.error(
          "Failed to restore admin session:",
          error,
        );

        logout();
      } finally {
        setIsInitializing(false);
      }
    }

    void initializeAuth();
  }, [
    logout,
    refreshCurrentAdmin,
  ]);

  const value = useMemo<
    AdminAuthContextValue
  >(
    () => ({
      admin,
      accessToken,
      isAuthenticated:
        Boolean(admin && accessToken),
      isInitializing,
      login,
      logout,
      refreshCurrentAdmin,
    }),
    [
      admin,
      accessToken,
      isInitializing,
      login,
      logout,
      refreshCurrentAdmin,
    ],
  );

  return (
    <AdminAuthContext.Provider
      value={value}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context =
    useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider.",
    );
  }

  return context;
}

export function getAdminAccessToken():
  | string
  | null {
  return getStoredToken();
}