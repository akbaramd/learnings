import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  FacilitiesState,
  PaginationInfo,
  FacilityDto,
  FacilityDetailsDto,
  FacilityCycleWithUserDto,
  FacilityCycleWithUserDetailDto,
  FacilityRequestDto,
  FacilityRequestDetailsDto,
} from './facilities.types';

const initialState: FacilitiesState = {
  facilities: [],
  selectedFacility: null,
  facilitiesPagination: null,
  cycles: [],
  selectedCycle: null,
  cyclesPagination: null,
  requests: [],
  selectedRequest: null,
  requestsPagination: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

const facilitiesSlice = createSlice({
  name: 'facilities',
  initialState,
  reducers: {
    // Facilities list management
    setFacilities: (state, action: PayloadAction<FacilityDto[]>) => {
      state.facilities = action.payload;
    },

    clearFacilities: (state) => {
      state.facilities = [];
      state.facilitiesPagination = null;
      state.error = null;
    },

    upsertFacility: (state, action: PayloadAction<FacilityDto>) => {
      const idx = state.facilities.findIndex(x => x.id === action.payload.id);
      if (idx === -1) state.facilities.unshift(action.payload);
      else state.facilities[idx] = { ...state.facilities[idx], ...action.payload };
    },

    removeFacility: (state, action: PayloadAction<string>) => {
      state.facilities = state.facilities.filter(x => x.id !== action.payload);
    },

    // Selected Facility management
    setSelectedFacility: (state, action: PayloadAction<FacilityDetailsDto | null>) => {
      state.selectedFacility = action.payload;
    },

    clearSelectedFacility: (state) => {
      state.selectedFacility = null;
    },

    setFacilitiesPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.facilitiesPagination = action.payload;
    },

    // Facility cycles management
    setCycles: (state, action: PayloadAction<FacilityCycleWithUserDto[]>) => {
      state.cycles = action.payload;
    },

    clearCycles: (state) => {
      state.cycles = [];
      state.cyclesPagination = null;
    },

    upsertCycle: (state, action: PayloadAction<FacilityCycleWithUserDto>) => {
      const idx = state.cycles.findIndex(x => x.id === action.payload.id);
      if (idx === -1) state.cycles.unshift(action.payload);
      else state.cycles[idx] = { ...state.cycles[idx], ...action.payload };
    },

    removeCycle: (state, action: PayloadAction<string>) => {
      state.cycles = state.cycles.filter(x => x.id !== action.payload);
    },

    // Selected Cycle management
    setSelectedCycle: (state, action: PayloadAction<FacilityCycleWithUserDetailDto | null>) => {
      state.selectedCycle = action.payload;
    },

    clearSelectedCycle: (state) => {
      state.selectedCycle = null;
    },

    setCyclesPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.cyclesPagination = action.payload;
    },

    // Facility requests management
    setRequests: (state, action: PayloadAction<FacilityRequestDto[]>) => {
      state.requests = action.payload;
    },

    clearRequests: (state) => {
      state.requests = [];
      state.requestsPagination = null;
    },

    upsertRequest: (state, action: PayloadAction<FacilityRequestDto>) => {
      const idx = state.requests.findIndex(x => x.id === action.payload.id);
      if (idx === -1) state.requests.unshift(action.payload);
      else state.requests[idx] = { ...state.requests[idx], ...action.payload };
    },

    removeRequest: (state, action: PayloadAction<string>) => {
      state.requests = state.requests.filter(x => x.id !== action.payload);
      if (state.selectedRequest?.id === action.payload) {
        state.selectedRequest = null;
      }
    },

    updateRequest: (state, action: PayloadAction<FacilityRequestDto>) => {
      const idx = state.requests.findIndex(x => x.id === action.payload.id);
      if (idx !== -1) {
        state.requests[idx] = { ...state.requests[idx], ...action.payload };
      }
      if (state.selectedRequest?.id === action.payload.id) {
        state.selectedRequest = { ...state.selectedRequest, ...action.payload } as FacilityRequestDetailsDto;
      }
    },

    // Selected Request management
    setSelectedRequest: (state, action: PayloadAction<FacilityRequestDetailsDto | null>) => {
      state.selectedRequest = action.payload;
      if (action.payload) {
        const idx = state.requests.findIndex(x => x.id === action.payload?.id);
        if (idx === -1) {
          state.requests.unshift(action.payload);
        } else {
          state.requests[idx] = action.payload;
        }
      }
    },

    clearSelectedRequest: (state) => {
      state.selectedRequest = null;
    },

    setRequestsPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.requestsPagination = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setLastFetched: (state, action: PayloadAction<string>) => {
      state.lastFetched = action.payload;
    },

    // Reset entire state
    resetFacilitiesState: () => initialState,
  },
});

export const {
  setFacilities,
  clearFacilities,
  upsertFacility,
  removeFacility,
  setSelectedFacility,
  clearSelectedFacility,
  setFacilitiesPagination,
  setCycles,
  clearCycles,
  upsertCycle,
  removeCycle,
  setSelectedCycle,
  clearSelectedCycle,
  setCyclesPagination,
  setRequests,
  clearRequests,
  upsertRequest,
  removeRequest,
  updateRequest,
  setSelectedRequest,
  clearSelectedRequest,
  setRequestsPagination,
  setLoading,
  setError,
  clearError,
  setLastFetched,
  resetFacilitiesState,
} = facilitiesSlice.actions;

export const facilitiesReducer = facilitiesSlice.reducer;
export default facilitiesSlice;

