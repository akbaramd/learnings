// src/store/auth/auth.types.ts
// All auth-related types

// User types
export interface User {
  id: string;
  userName: string;
  roles: string[];
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
  roles?: string[];
  claims?: unknown[];
  preferences?: unknown[];
}

// Auth state
export interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error' | 'otp-sent';
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

// Request types
export interface SendOtpRequest {
  nationalCode: string;
  purpose?: string;
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
