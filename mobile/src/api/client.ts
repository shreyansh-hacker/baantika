import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import {
  getAuthTokens,
  saveAuthTokens,
  clearAuthTokens,
  getCachedAccessToken,
} from '../services/storage';

// In Android emulator, 10.0.2.2 points to host PC's localhost:3000
// For production / physical devices, this is overridden via setBaseUrl
const DEFAULT_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

let currentBaseUrl = DEFAULT_BASE_URL;

export function getBaseUrl(): string {
  return currentBaseUrl;
}

export function setBaseUrl(url: string): void {
  currentBaseUrl = url.replace(/\/+$/, ''); // Strip trailing slash
  apiClient.defaults.baseURL = currentBaseUrl;
}

export const apiClient = axios.create({
  baseURL: currentBaseUrl,
  timeout: 15000, // 15 second timeout for standard requests
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = getCachedAccessToken();
    if (!token) {
      const tokens = await getAuthTokens();
      token = tokens?.accessToken ?? null;
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token refresh & errors
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh if the failed request was itself the login/register/refresh endpoint
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(normalizeApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedTokens = await getAuthTokens();
        if (!storedTokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(
          `${currentBaseUrl}/api/v1/auth/refresh`,
          { refreshToken: storedTokens.refreshToken },
          { timeout: 10000 }
        );

        const newTokens = refreshResponse.data.data.tokens;
        await saveAuthTokens(newTokens);

        processQueue(null, newTokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as Error, null);
        await clearAuthTokens();
        return Promise.reject(normalizeApiError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export interface NormalizedError {
  code: string;
  message: string;
  statusCode?: number;
  isNetworkError: boolean;
  isColdStarting: boolean;
}

export function normalizeApiError(error: any): NormalizedError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{
      success?: boolean;
      error?: { code?: string; message?: string };
    }>;

    // Network or timeout error
    if (!axiosErr.response) {
      const isTimeout = axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout');
      return {
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: isTimeout
          ? 'Server took too long to respond. It may be waking up from sleep. Retrying...'
          : 'Unable to connect to Baantika servers. Check your internet connection.',
        isNetworkError: true,
        isColdStarting: isTimeout,
      };
    }

    const data = axiosErr.response.data;
    return {
      code: data?.error?.code ?? `HTTP_${axiosErr.response.status}`,
      message: data?.error?.message ?? axiosErr.message ?? 'An unexpected error occurred',
      statusCode: axiosErr.response.status,
      isNetworkError: false,
      isColdStarting: axiosErr.response.status === 502 || axiosErr.response.status === 503,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message ?? 'An unexpected error occurred',
    isNetworkError: false,
    isColdStarting: false,
  };
}

/**
 * Health check utility with timeout and cold start detection
 */
export async function checkServerHealth(timeoutMs = 8000): Promise<{
  isOnline: boolean;
  isReady: boolean;
  coldStarting: boolean;
}> {
  try {
    const res = await axios.get(`${currentBaseUrl}/health`, { timeout: timeoutMs });
    if (res.status === 200) {
      return { isOnline: true, isReady: true, coldStarting: false };
    }
    return { isOnline: false, isReady: false, coldStarting: true };
  } catch (error: any) {
    const isTimeout = error.code === 'ECONNABORTED';
    return {
      isOnline: false,
      isReady: false,
      coldStarting: isTimeout,
    };
  }
}
