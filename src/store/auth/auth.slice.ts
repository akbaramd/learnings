// src/store/auth/auth.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, AuthStatus } from './auth.types';

// Type guards for runtime validation
const isValidAuthStatus = (status: string): status is AuthStatus => {
  return ['idle', 'loading', 'authenticated', 'anonymous', 'error', 'otp-sent'].includes(status);
};

const isValidUser = (user: unknown): user is User => {
  if (user === null || typeof user !== 'object') return false;
  
  const userObj = user as Record<string, unknown>;
  
  return 'id' in userObj && 
    'userName' in userObj && 
    'roles' in userObj &&
    typeof userObj.id === 'string' && 
    typeof userObj.userName === 'string' && 
    Array.isArray(userObj.roles);
};

const initialState: AuthState = {
  status: 'idle',
  user: null,
  challengeId: null,
  maskedPhoneNumber: null,
  error: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Store challengeId after successful OTP send
    setChallengeId: (state, action: PayloadAction<string | null>) => {
      state.challengeId = action.payload;
      state.error = null; // Clear any previous errors
    },
    
    // Store masked phone after successful OTP send
    setMaskedPhoneNumber: (state, action: PayloadAction<string | null>) => {
      state.maskedPhoneNumber = action.payload;
    },
    
    // Clear challengeId and masked phone (after successful verification or logout)
    clearChallengeId: (state) => {
      state.challengeId = null;
      state.maskedPhoneNumber  = null;
    },
    
    // Set user data with validation
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      if (action.payload === null || isValidUser(action.payload)) {
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
      } else {
        console.warn('Invalid user data:', action.payload);
        state.error = 'Invalid user data';
        state.status = 'error';
      }
    },
    
    // Clear user data (logout)
    clearUser: (state) => {
      state.user = null;
      state.status = 'anonymous';
      state.challengeId = null;
      state.maskedPhoneNumber = null;
      state.error = null;
    },
    
    // Set authentication status with validation
    setAuthStatus: (state, action: PayloadAction<AuthState['status']>) => {
      if (isValidAuthStatus(action.payload)) {
        state.status = action.payload;
        if (action.payload === 'anonymous') {
          state.user = null;
          state.challengeId = null;
          state.maskedPhoneNumber = null; 
        }
      } else {
        console.warn('Invalid auth status:', action.payload);
        state.status = 'error';
        state.error = 'Invalid authentication status';
      }
    },
    
    // Set error message with validation
    setError: (state, action: PayloadAction<string | null>) => {
      if (action.payload === null || typeof action.payload === 'string') {
        state.error = action.payload;
        if (action.payload) {
          state.status = 'error';
        }
      } else {
        console.warn('Invalid error message:', action.payload);
        state.error = 'Invalid error message';
        state.status = 'error';
      }
    },
    
    // Clear error message
    clearError: (state) => {
      state.error = null;
    },
    
    // Set initialization status
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    
    // Reset entire auth state
    reset: () => initialState,
    
    // Set loading state (redundant with setAuthStatus, but kept for convenience)
    setLoading: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    
    // Set OTP sent state (redundant with setAuthStatus, but kept for convenience)
    setOtpSent: (state) => {
      state.status = 'otp-sent';
      state.error = null;
    },
    
    // Set authenticated state (redundant with setAuthStatus, but kept for convenience)
    setAuthenticated: (state) => {
      state.status = 'authenticated';
      state.error = null;
    },
    
    // Set anonymous state (redundant with setAuthStatus, but kept for convenience)
    setAnonymous: (state) => {
      state.status = 'anonymous';
      state.user = null;
      state.challengeId = null;
      state.maskedPhoneNumber = null;
      state.error = null;
    },
  },
});

export const {
  setChallengeId,
  setMaskedPhoneNumber,
  clearChallengeId,
  setUser,
  clearUser,
  setAuthStatus,
  setError,
  clearError,
  setInitialized,
  reset,
  setLoading,
  setOtpSent,
  setAuthenticated,
  setAnonymous,
} = authSlice.actions;

export default authSlice.reducer;
