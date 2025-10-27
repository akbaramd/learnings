// src/store/auth/auth.types.ts
// All auth-related types

import { ApplicationResult } from '@/src/store/api/api.types';

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

// Data types for API responses
export interface SendOtpData {
  challengeId: string;
  maskedPhoneNumber?: string;
}

export interface VerifyOtpData {
  userId: string;
}

export interface SessionData {
  authenticated: boolean;
}

export interface LogoutData {
  isSuccess: boolean;
  message: string;
}

export interface RefreshData {
  isSuccess: boolean;
  message: string;
  accessToken?: string;
}

// Response types using ApplicationResult
export type SendOtpResponse = ApplicationResult<SendOtpData>;
export type VerifyOtpResponse = ApplicationResult<VerifyOtpData>;
export type SessionResponse = ApplicationResult<SessionData>;
export type LogoutResponse = ApplicationResult<LogoutData>;
export type RefreshResponse = ApplicationResult<RefreshData>;
export type GetMeResponse = ApplicationResult<UserProfile>;
