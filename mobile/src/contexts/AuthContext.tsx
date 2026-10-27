import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens } from '../types';
import {
  saveAuthTokens,
  getAuthTokens,
  clearAuthTokens,
  saveUserProfile,
  getUserProfile,
} from '../services/storage';
import {
  loginApi,
  registerApi,
  logoutApi,
  getProfileApi,
} from '../api/endpoints';
import {
  checkServerHealth,
  setBaseUrl,
  getBaseUrl,
} from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBackendReady: boolean;
  isColdStarting: boolean;
  backendUrl: string;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkHealth: () => Promise<boolean>;
  updateUser: (updated: Partial<User>) => void;
  updateBackendUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isBackendReady: false,
  isColdStarting: false,
  backendUrl: getBaseUrl(),
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkHealth: async () => false,
  updateUser: () => {},
  updateBackendUrl: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [backendUrl, setBackendUrlState] = useState(getBaseUrl());

  const checkHealth = async (): Promise<boolean> => {
    setIsColdStarting(true);
    const health = await checkServerHealth(6000);
    setIsColdStarting(health.coldStarting);
    setIsBackendReady(health.isReady);
    return health.isReady;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Attempt quick health probe
        const health = await checkServerHealth(4000);
        setIsBackendReady(health.isReady);
        setIsColdStarting(health.coldStarting);

        // Check Keystore for tokens
        const tokens = await getAuthTokens();
        if (tokens?.accessToken) {
          const cachedProfile = await getUserProfile();
          if (cachedProfile) {
            setUser(cachedProfile);
          }

          // If backend is ready, refresh profile from server
          if (health.isReady) {
            try {
              const freshProfile = await getProfileApi();
              setUser(freshProfile);
              await saveUserProfile(freshProfile);
            } catch {
              // Token might be expired or server error; let interceptor or user session handle
            }
          }
        }
      } catch {
        // Safe startup continuation
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const response = await loginApi(data);
    await saveAuthTokens(response.tokens);
    await saveUserProfile(response.user);
    setUser(response.user);
    setIsBackendReady(true);
  };

  const register = async (data: { email: string; password: string; displayName: string }) => {
    const response = await registerApi(data);
    await saveAuthTokens(response.tokens);
    await saveUserProfile(response.user);
    setUser(response.user);
    setIsBackendReady(true);
  };

  const logout = async () => {
    try {
      const tokens = await getAuthTokens();
      if (tokens?.refreshToken) {
        await logoutApi(tokens.refreshToken);
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      await clearAuthTokens();
      setUser(null);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updated };
      setUser(newUser);
      saveUserProfile(newUser);
    }
  };

  const updateBackendUrl = (url: string) => {
    setBaseUrl(url);
    setBackendUrlState(url);
    checkHealth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isBackendReady,
        isColdStarting,
        backendUrl,
        login,
        register,
        logout,
        checkHealth,
        updateUser,
        updateBackendUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
