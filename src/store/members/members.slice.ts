// src/store/members/members.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  MemberDetailDto,
  MembersState,
} from './members.types';

// Type guard for runtime validation
const isValidMember = (member: unknown): member is MemberDetailDto => {
  if (member === null || typeof member !== 'object') return false;

  const memberObj = member as Record<string, unknown>;

  // At minimum, should have an id
  return 'id' in memberObj && typeof memberObj.id === 'string';
};

const initialState: MembersState = {
  currentMember: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  lastSynced: null,
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    // Set current member
    setCurrentMember: (state, action: PayloadAction<MemberDetailDto | null>) => {
      if (action.payload === null || isValidMember(action.payload)) {
        state.currentMember = action.payload;
        state.error = null;
        if (action.payload) {
          state.lastFetched = new Date().toISOString();
        }
      } else {
        console.warn('Invalid member data:', action.payload);
        state.error = 'Invalid member data';
      }
    },

    // Update current member
    updateCurrentMember: (state, action: PayloadAction<Partial<MemberDetailDto>>) => {
      if (state.currentMember) {
        state.currentMember = {
          ...state.currentMember,
          ...action.payload,
        };
      }
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error message with validation
    setError: (state, action: PayloadAction<string | null>) => {
      if (action.payload === null || typeof action.payload === 'string') {
        state.error = action.payload;
      } else {
        console.warn('Invalid error message:', action.payload);
        state.error = 'Invalid error message';
      }
    },

    // Clear error message
    clearError: (state) => {
      state.error = null;
    },

    // Mark member as synced
    setLastSynced: (state, action: PayloadAction<string>) => {
      state.lastSynced = action.payload;
    },

    // Clear current member
    clearCurrentMember: (state) => {
      state.currentMember = null;
      state.lastFetched = null;
      state.lastSynced = null;
    },

    // Reset entire member state
    resetMemberState: () => initialState,
  },
});

const { actions, reducer } = membersSlice;

export const {
  setCurrentMember,
  updateCurrentMember,
  setLoading,
  setError,
  clearError,
  setLastSynced,
  clearCurrentMember,
  resetMemberState,
} = actions;

export default reducer;

