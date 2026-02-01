/**
 * API Service Layer
 * Handles all communication between React frontend and Backend
 * Supports both real API and prototype mode (mock data)
 */

import {
  mockAuthApi,
  mockCrewApi,
  mockAdminApi,
  isPrototypeMode as checkPrototypeMode,
  enablePrototypeMode as enableMock,
  disablePrototypeMode as disableMock,
  getAuthToken as getMockToken,
  getStoredUser as getMockUser,
  storeAuthData as storeMockAuth,
  clearAuthData as clearMockAuth,
  isAuthenticated as checkMockAuth
} from './mockApi';

// API Base URL - uses Vite proxy in development
const API_BASE_URL = '/api';

// Re-export prototype mode functions
export const isPrototypeMode = checkPrototypeMode;
export const enablePrototypeMode = enableMock;
export const disablePrototypeMode = disableMock;

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  token: string;
  user: User;
}

// Crew login uses email-based authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CrewRegisterData {
  full_name: string;
  email: string;
  password: string;
  nic: string;
  bus_id: string;
}

export interface OTPData {
  email: string;
  otp: string;
}

// Storage keys
const TOKEN_KEY = 'kango_auth_token';
const USER_KEY = 'kango_user';

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

/**
 * Store auth data after successful login
 */
export function storeAuthData(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth data on logout
 */
export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Base fetch wrapper with auth headers
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Extract error message from various response formats
      // Backend returns 'error' field, not 'message' for error responses
      let errorMessage = data.error || data.message ||
        (response.status === 401 ? 'Invalid email or password' :
         response.status === 404 ? 'Account not found' :
         response.status === 422 ? 'Please check your input and try again' :
         response.status === 500 ? 'Server error. Please try again later.' :
         'Request failed. Please try again.');

      // If there are specific validation errors, include them
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMessage = data.errors.join('. ');
      }

      return {
        success: false,
        message: errorMessage,
        errors: data.errors,
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);

    // If API fails, suggest prototype mode
    console.log('💡 Tip: Enable prototype mode to test without backend:');
    console.log('   Run in console: enablePrototypeMode()');

    // Provide more specific error messages
    let errorMessage = 'Cannot connect to server.';
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Cannot connect to server. Make sure the backend is running on localhost:8000';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<ApiResponse<{ user_id: number; email: string; token?: string; user?: User; requires_verification?: boolean }>> => {
    if (isPrototypeMode()) {
      return mockAuthApi.register(data) as Promise<ApiResponse<{ user_id: number; email: string; token?: string; user?: User; requires_verification?: boolean }>>;
    }

    const response = await apiFetch<{ user_id: number; email: string; token?: string; user?: User; requires_verification?: boolean }>('/auth/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // If token is returned (dev mode - OTP disabled), store auth data
    if (response.success && response.data?.token && response.data?.user) {
      storeAuthData(response.data.token, response.data.user);
    }

    return response;
  },

  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> => {
    if (isPrototypeMode()) {
      return mockAuthApi.login(credentials);
    }

    const response = await apiFetch<AuthTokens>('/auth/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      storeAuthData(response.data.token, response.data.user);
    }

    return response;
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (data: OTPData): Promise<ApiResponse<AuthTokens>> => {
    if (isPrototypeMode()) {
      return mockAuthApi.verifyOTP(data);
    }

    const response = await apiFetch<AuthTokens>('/auth/user/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      storeAuthData(response.data.token, response.data.user);
    }

    return response;
  },

  /**
   * Resend OTP
   */
  resendOTP: async (email: string): Promise<ApiResponse> => {
    if (isPrototypeMode()) {
      return mockAuthApi.resendOTP(email);
    }
    return apiFetch('/auth/user/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    if (isPrototypeMode()) {
      return { success: true, message: 'Password reset email sent (mock)' };
    }
    return apiFetch('/auth/user/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string, otp: string, newPassword: string): Promise<ApiResponse> => {
    if (isPrototypeMode()) {
      return { success: true, message: 'Password reset successful (mock)' };
    }
    return apiFetch('/auth/user/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
  },

  /**
   * Logout user
   */
  logout: (): void => {
    clearAuthData();
  },
};

/**
 * Crew Auth API endpoints - Uses email-based login
 */
export const crewApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> => {
    if (isPrototypeMode()) {
      // Mock mode uses crew_id, convert email to crew_id format
      return mockCrewApi.login({ crew_id: credentials.email, password: credentials.password }) as Promise<ApiResponse<AuthTokens>>;
    }

    const response = await apiFetch<AuthTokens>('/auth/crew/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      storeAuthData(response.data.token, response.data.user);
    }

    return response;
  },

  register: async (data: CrewRegisterData): Promise<ApiResponse<AuthTokens>> => {
    if (isPrototypeMode()) {
      return { success: false, message: 'Registration not available in prototype mode' };
    }

    const response = await apiFetch<AuthTokens>('/auth/crew/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      storeAuthData(response.data.token, response.data.user);
    }

    return response;
  },
};

/**
 * Admin Auth API endpoints
 */
export const adminApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> => {
    if (isPrototypeMode()) {
      return mockAdminApi.login(credentials);
    }

    const response = await apiFetch<AuthTokens>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      storeAuthData(response.data.token, response.data.user);
    }

    return response;
  },
};

/**
 * Generic API helper for other endpoints
 */
export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data: unknown) => apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) => apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};

// Expose functions globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).enablePrototypeMode = () => {
    enableMock();
    alert('🎭 Prototype mode enabled!\n\nDemo credentials:\n- Email: demo@kango.com\n- Password: password123');
    window.location.reload();
  };

  (window as any).disablePrototypeMode = () => {
    disableMock();
    alert('🔌 Prototype mode disabled. Real API will be used.');
    window.location.reload();
  };
}

export default api;
