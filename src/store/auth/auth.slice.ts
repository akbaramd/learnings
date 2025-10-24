// src/store/auth/auth.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from './auth.types';

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
    
    // Set user data after successful authentication
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    },
    
    // Clear user data (logout)
    clearUser: (state) => {
      state.user = null;
      state.status = 'anonymous';
      state.challengeId = null;
      state.maskedPhoneNumber = null;
      state.error = null;
    },
    
    // Set authentication status
    setAuthStatus: (state, action: PayloadAction<AuthState['status']>) => {
      state.status = action.payload;
      if (action.payload === 'anonymous') {
        state.user = null;
        state.challengeId = null;
        state.maskedPhoneNumber = null; 
      }
    },
    
    // Set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
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
} = authSlice.actions;

export default authSlice.reducer;
