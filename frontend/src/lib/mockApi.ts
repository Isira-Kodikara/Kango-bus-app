/**
 * Mock API Service - Prototype Mode
 * This allows the frontend to work without a backend for UI testing
 */

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user database
const mockUsers: Record<string, any> = {
  'demo@kango.com': {
    id: 1,
    username: 'demouser',
    email: 'demo@kango.com',
    password: 'password123',
    phone: '+94771234567',
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z'
  }
};

// Mock crew database
const mockCrew: Record<string, any> = {
  'DRV001': {
    id: 1,
    crew_id: 'DRV001',
    name: 'John Driver',
    password: 'password123',
    role: 'driver',
    phone: '+94771234567'
  },
  'CND001': {
    id: 2,
    crew_id: 'CND001',
    name: 'Jane Conductor',
    password: 'password123',
    role: 'conductor',
    phone: '+94779876543'
  }
};

// Mock admin database
const mockAdmins: Record<string, any> = {
  'admin@kango.com': {
    id: 1,
    username: 'admin',
    email: 'admin@kango.com',
    password: 'password123',
    role: 'super_admin'
  }
};

// Mock buses
const mockBuses = [
  { id: 1, bus_number: 'NB-1234', route_number: '138', route_name: 'Colombo - Kandy', capacity: 52, is_active: true },
  { id: 2, bus_number: 'NC-5678', route_number: '187', route_name: 'Colombo - Galle', capacity: 48, is_active: false },
  { id: 3, bus_number: 'WP-9012', route_number: '255', route_name: 'Colombo - Negombo', capacity: 45, is_active: true },
];

// Mock OTP storage
const otpStore: Record<string, { otp: string; expiry: Date }> = {};

// Storage keys
const TOKEN_KEY = 'kango_auth_token';
const USER_KEY = 'kango_user';
const PROTOTYPE_MODE_KEY = 'kango_prototype_mode';

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
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

/**
 * Check if prototype mode is enabled
 */
export function isPrototypeMode(): boolean {
  return localStorage.getItem(PROTOTYPE_MODE_KEY) === 'true';
}

/**
 * Enable prototype mode
 */
export function enablePrototypeMode(): void {
  localStorage.setItem(PROTOTYPE_MODE_KEY, 'true');
  console.log('🎭 Prototype mode enabled - using mock data');
}

/**
 * Disable prototype mode
 */
export function disablePrototypeMode(): void {
  localStorage.removeItem(PROTOTYPE_MODE_KEY);
  console.log('🔌 Prototype mode disabled - using real API');
}

/**
 * Get stored auth data
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function storeAuthData(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Generate mock JWT token
 */
function generateMockToken(payload: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 86400000 }));
  const signature = btoa('mock_signature');
  return `${header}.${body}.${signature}`;
}

/**
 * Generate 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Mock Auth API
 */
export const mockAuthApi = {
  register: async (data: { username: string; email: string; password: string }): Promise<ApiResponse> => {
    await delay(800);

    if (mockUsers[data.email]) {
      return { success: false, message: 'Email already registered' };
    }

    // Create new user
    const newUser = {
      id: Object.keys(mockUsers).length + 1,
      username: data.username,
      email: data.email,
      password: data.password,
      is_verified: false,
      created_at: new Date().toISOString()
    };
    mockUsers[data.email] = newUser;

    // Generate OTP
    const otp = generateOTP();
    otpStore[data.email] = { otp, expiry: new Date(Date.now() + 10 * 60 * 1000) };

    console.log(`📧 Mock OTP for ${data.email}: ${otp}`);

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: { user_id: newUser.id, email: data.email }
    };
  },

  login: async (data: { email: string; password: string }): Promise<ApiResponse<AuthTokens>> => {
    try {
      await delay(600);

      const user = mockUsers[data.email];
      if (!user || user.password !== data.password) {
        return { success: false, message: 'Invalid email or password' };
      }

      if (!user.is_verified) {
        const otp = generateOTP();
        otpStore[data.email] = { otp, expiry: new Date(Date.now() + 10 * 60 * 1000) };
        console.log(`📧 Mock OTP for ${data.email}: ${otp}`);
        return { success: false, message: 'Please verify your email first. OTP has been resent.' };
      }

      const token = generateMockToken({ id: user.id, email: user.email, type: 'user' });
      const userData: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        is_verified: user.is_verified,
        created_at: user.created_at
      };

      storeAuthData(token, userData);

      return {
        success: true,
        message: 'Login successful',
        data: { token, user: userData }
      };
    } catch (error) {
      console.error('Mock login error:', error);
      return { success: false, message: 'Mock login failed: ' + (error instanceof Error ? error.message : String(error)) };
    }
  },

  verifyOTP: async (data: { email: string; otp: string }): Promise<ApiResponse<AuthTokens>> => {
    await delay(500);

    const stored = otpStore[data.email];
    if (!stored || stored.otp !== data.otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    if (stored.expiry < new Date()) {
      return { success: false, message: 'OTP has expired' };
    }

    // Verify user
    const user = mockUsers[data.email];
    if (user) {
      user.is_verified = true;
    }

    delete otpStore[data.email];

    const token = generateMockToken({ id: user.id, email: user.email, type: 'user' });
    const userData: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      is_verified: true,
      created_at: user.created_at
    };

    storeAuthData(token, userData);

    return {
      success: true,
      message: 'Email verified successfully',
      data: { token, user: userData }
    };
  },

  resendOTP: async (email: string): Promise<ApiResponse> => {
    await delay(400);

    if (!mockUsers[email]) {
      return { success: false, message: 'User not found' };
    }

    const otp = generateOTP();
    otpStore[email] = { otp, expiry: new Date(Date.now() + 10 * 60 * 1000) };
    console.log(`📧 Mock OTP for ${email}: ${otp}`);

    return { success: true, message: 'OTP sent successfully' };
  },

  logout: (): void => {
    clearAuthData();
  }
};

/**
 * Mock Crew API
 */
export const mockCrewApi = {
  login: async (data: { crew_id: string; password: string }): Promise<ApiResponse<AuthTokens>> => {
    await delay(600);

    const crew = mockCrew[data.crew_id];
    if (!crew || crew.password !== data.password) {
      return { success: false, message: 'Invalid crew ID or password' };
    }

    const token = generateMockToken({ id: crew.id, crew_id: crew.crew_id, role: crew.role, type: 'crew' });
    const userData: any = {
      id: crew.id,
      username: crew.name,
      email: crew.crew_id,
      is_verified: true,
      created_at: new Date().toISOString()
    };

    storeAuthData(token, userData);

    return {
      success: true,
      message: 'Login successful',
      data: { token, user: userData }
    };
  }
};

/**
 * Mock Admin API
 */
export const mockAdminApi = {
  login: async (data: { email: string; password: string }): Promise<ApiResponse<AuthTokens>> => {
    await delay(600);

    const admin = mockAdmins[data.email];
    if (!admin || admin.password !== data.password) {
      return { success: false, message: 'Invalid email or password' };
    }

    const token = generateMockToken({ id: admin.id, email: admin.email, role: admin.role, type: 'admin' });
    const userData: any = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      is_verified: true,
      created_at: new Date().toISOString()
    };

    storeAuthData(token, userData);

    return {
      success: true,
      message: 'Login successful',
      data: { token, user: userData }
    };
  }
};

/**
 * Mock Bus API
 */
export const mockBusApi = {
  getAll: async (): Promise<ApiResponse<typeof mockBuses>> => {
    await delay(300);
    return { success: true, message: 'Buses fetched', data: mockBuses };
  },

  getById: async (id: number): Promise<ApiResponse<typeof mockBuses[0] | null>> => {
    await delay(200);
    const bus = mockBuses.find(b => b.id === id);
    if (!bus) return { success: false, message: 'Bus not found' };
    return { success: true, message: 'Bus found', data: bus };
  }
};

export default {
  auth: mockAuthApi,
  crew: mockCrewApi,
  admin: mockAdminApi,
  bus: mockBusApi,
  isPrototypeMode,
  enablePrototypeMode,
  disablePrototypeMode
};
