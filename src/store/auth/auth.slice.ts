// src/store/auth/auth.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, AuthStatus, AuthErrorType } from './auth.types';

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
  nationalCode: null,
  error: null,
  errorType: null,
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
      state.errorType = null;
    },
    
    // Store masked phone after successful OTP send
    setMaskedPhoneNumber: (state, action: PayloadAction<string | null>) => {
      state.maskedPhoneNumber = action.payload;
    },
    
    // Store national code after successful OTP send (for resending)
    setNationalCode: (state, action: PayloadAction<string | null>) => {
      state.nationalCode = action.payload;
    },
    
    // Clear challengeId, masked phone, and national code (after successful verification or logout)
    clearChallengeId: (state) => {
      state.challengeId = null;
      state.maskedPhoneNumber = null;
      state.nationalCode = null;
    },
    
    // Set user data with validation
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      if (action.payload === null || isValidUser(action.payload)) {
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
        state.errorType = null;
      } else {
        console.warn('Invalid user data:', action.payload);
        state.error = 'Invalid user data';
        state.errorType = 'unknown';
        state.status = 'error';
      }
    },
    
    // Clear user data (logout)
    clearUser: (state) => {
      state.user = null;
      state.status = 'anonymous';
      state.challengeId = null;
      state.maskedPhoneNumber = null;
      state.nationalCode = null;
      state.error = null;
      state.errorType = null;
    },
    
    // Set authentication status with validation
    setAuthStatus: (state, action: PayloadAction<AuthState['status']>) => {
      if (isValidAuthStatus(action.payload)) {
        state.status = action.payload;
        if (action.payload === 'anonymous') {
          state.user = null;
          state.challengeId = null;
          state.maskedPhoneNumber = null;
          state.nationalCode = null;
          state.error = null;
          state.errorType = null;
        }
      } else {
        console.warn('Invalid auth status:', action.payload);
        state.status = 'error';
        state.error = 'Invalid authentication status';
        state.errorType = 'unknown';
      }
    },
    
    // Set error message with validation
    setError: (state, action: PayloadAction<string | null>) => {
      if (action.payload === null || typeof action.payload === 'string') {
        state.error = action.payload;
        if (action.payload) {
          state.status = 'error';
        } else {
          state.errorType = null;
        }
      } else {
        console.warn('Invalid error message:', action.payload);
        state.error = 'Invalid error message';
        state.errorType = 'unknown';
        state.status = 'error';
      }
    },
    
    // Set error with type
    setErrorWithType: (state, action: PayloadAction<{ message: string; type: AuthErrorType }>) => {
      state.error = action.payload.message;
      state.errorType = action.payload.type;
      state.status = 'error';
    },
    
    // Clear error message
    clearError: (state) => {
      state.error = null;
      state.errorType = null;
    },
    
    // Set initialization status
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    
    // Reset entire auth state
    // IMPORTANT: After logout, state should be 'anonymous', not 'idle'
    // Only use reset() for complete app reset, not for logout
    reset: (): AuthState => ({
      ...initialState,
      status: 'anonymous', // After reset, user is anonymous, not idle
    }),
    
    // Set loading state (redundant with setAuthStatus, but kept for convenience)
    setLoading: (state) => {
      state.status = 'loading';
      state.error = null;
      state.errorType = null;
    },
    
    // Set OTP sent state (redundant with setAuthStatus, but kept for convenience)
    setOtpSent: (state) => {
      state.status = 'otp-sent';
      state.error = null;
      state.errorType = null;
    },
    
    // Set authenticated state (redundant with setAuthStatus, but kept for convenience)
    setAuthenticated: (state) => {
      state.status = 'authenticated';
      state.error = null;
      state.errorType = null;
    },
    
    // Set anonymous state (redundant with setAuthStatus, but kept for convenience)
    setAnonymous: (state) => {
      state.status = 'anonymous';
      state.user = null;
      state.challengeId = null;
      state.maskedPhoneNumber = null;
      state.nationalCode = null;
      state.error = null;
      state.errorType = null;
    },
  },
});

export const {
  setChallengeId,
  setMaskedPhoneNumber,
  setNationalCode,
  clearChallengeId,
  setUser,
  clearUser,
  setAuthStatus,
  setError,
  setErrorWithType,
  clearError,
  setInitialized,
  reset,
  setLoading,
  setOtpSent,
  setAuthenticated,
  setAnonymous,
} = authSlice.actions;

export default authSlice.reducer;
