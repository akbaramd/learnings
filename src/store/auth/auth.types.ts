// src/store/auth/auth.types.ts
// All auth-related types

// Auth status type with better type safety
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error' | 'otp-sent';

// User roles type for better type safety
export type UserRole = 'admin' | 'super_admin' | 'user_manager' | 'reporter' | 'user';

// User types
export interface User {
  id: string;
  userName: string;
  roles: UserRole[];
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  phone?: string;
  accessToken?: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  phone?: string;
  roles?: UserRole[];
  claims?: unknown[];
  preferences?: unknown[];
}

// Auth state
export interface AuthState {
  status: AuthStatus;
  user: User | null;
  challengeId: string | null;
  maskedPhoneNumber: string | null;
  error: string | null;
  isInitialized: boolean;
}

// Generic API response type
export interface ApiResponse<T = unknown | null> {
  result: T | null;
  errors: string[] | null;
}

// Request types with better validation
export interface SendOtpRequest {
  nationalCode: string;
  purpose?: 'login' | 'register' | 'reset_password';
  deviceId?: string;
}

export interface VerifyOtpRequest {
  challengeId: string;
  otpCode: string;
}

export interface RefreshTokenRequest {
  refreshToken?: string;
}

// Response types
export interface SendOtpResponse {
  result: {
    challengeId: string | null;
    maskedPhoneNumber?: string | null;
  } | null;
  errors: string[] | null;
}

export interface VerifyOtpResponse {
  result: {
    userId: string | null;
    isSuccess: boolean;
  } | null;
  errors: string[] | null;
}

export interface SessionResponse {
  result: {
    authenticated: boolean;
  } | null;
  errors: string[] | null;
}

export interface LogoutResponse {
  result: {
    isSuccess: boolean;
    message: string;
  } | null;
  errors: string[] | null;
}

export interface RefreshResponse {
  result: {
    isSuccess: boolean;
    message: string;
    accessToken?: string;
  } | null;
  errors: string[] | null;
}

export interface GetMeResponse {
  result: UserProfile | null;
  errors: string[] | null;
}
