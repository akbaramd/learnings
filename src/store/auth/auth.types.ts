// src/store/auth/auth.types.ts
// All auth-related types

import { ApplicationResult } from '@/src/store/api/api.types';

// Auth status type with better type safety
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error' | 'otp-sent';

// Error types for better error handling
export type AuthErrorType = 
  | 'user_not_found' 
  | 'invalid_credentials' 
  | 'otp_failed' 
  | 'network_error' 
  | 'server_error' 
  | 'unknown';

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
  nationalCode: string | null; // Store national code for resending OTP
  error: string | null;
  errorType: AuthErrorType | null; // Error category for better error handling
  isInitialized: boolean;
}

// Request types - matching Api.ts exactly
export interface SendOtpRequest {
  nationalCode?: string | null;
  purpose?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  scope?: string | null;
}

export interface VerifyOtpRequest {
  challengeId?: string | null;
  otpCode?: string | null;
  purpose?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  scope?: string | null;
}

export interface RefreshTokenRequest {
  refreshToken?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LogoutRequest {
  refreshToken?: string | null;
}

export interface LogoutByRefreshTokenRequest {
  refreshToken?: string | null;
}

// Empty body - sessionId is in path
export type LogoutBySessionIdRequest = Record<string, never>;

// Empty body
export type LogoutAllSessionsRequest = Record<string, never>;

// Empty body
export type LogoutAllOtherSessionsRequest = Record<string, never>;

export interface ValidateNationalCodeRequest {
  nationalCode: string;
}

// Data types for API responses
export interface SendOtpData {
  challengeId: string;
  maskedPhoneNumber?: string;
}

export interface ValidateNationalCodeData {
  nationalCode?: string | null;
  isValidFormat?: boolean;
  exists?: boolean;
  fullName?: string | null;
  membershipNumber?: string | null;
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

// Session types
export interface SessionDto {
  id?: string;
  userId?: string;
  deviceId?: string | null;
  normalizedUserAgent?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastIpChangeTime?: string | null;
  riskScore?: number;
  expiresAt?: string;
  lastActivityAt?: string;
  isRevoked?: boolean;
  isActive?: boolean;
  isExpired?: boolean;
  createdAt?: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface SessionsPaginatedData {
  items?: SessionDto[] | null;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface GetSessionsPaginatedRequest {
  pageNumber?: number;
  pageSize?: number;
  userId?: string;
  deviceId?: string;
  isActive?: boolean;
  isRevoked?: boolean;
  isExpired?: boolean;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: string;
}

// Response types using ApplicationResult
export type SendOtpResponse = ApplicationResult<SendOtpData>;
export type VerifyOtpResponse = ApplicationResult<VerifyOtpData>;
export type SessionResponse = ApplicationResult<SessionData>;
export type LogoutResponse = ApplicationResult<LogoutData>;
export type RefreshResponse = ApplicationResult<RefreshData>;
export type GetMeResponse = ApplicationResult<UserProfile>;
export type ValidateNationalCodeResponse = ApplicationResult<ValidateNationalCodeData>;
export type GetSessionsPaginatedResponse = ApplicationResult<SessionsPaginatedData>;
