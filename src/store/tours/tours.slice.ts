import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  ToursState,
  PaginationInfo,
  TourWithUserReservationDto,
  TourDetailWithUserReservationDto,
  ReservationDetailDto,
} from './tours.types';

const initialState: ToursState = {
  items: [],
  selectedTour: null,
  reservations: [],
  selectedReservation: null,
  pagination: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

const toursSlice = createSlice({
  name: 'tours',
  initialState,
  reducers: {
    // Tours list management
    setItems: (state, action: PayloadAction<TourWithUserReservationDto[]>) => {
      state.items = action.payload;
    },

    clearItems: (state) => {
      state.items = [];
      state.pagination = null;
      state.error = null;
    },

    upsertItem: (state, action: PayloadAction<TourWithUserReservationDto>) => {
      const idx = state.items.findIndex(x => x.id === action.payload.id);
      if (idx === -1) state.items.unshift(action.payload);
      else state.items[idx] = { ...state.items[idx], ...action.payload };
    },

    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(x => x.id !== action.payload);
    },

    // Selected Tour management
    setSelectedTour: (state, action: PayloadAction<TourDetailWithUserReservationDto | null>) => {
      state.selectedTour = action.payload;
    },

    clearSelectedTour: (state) => {
      state.selectedTour = null;
    },

    // Reservations management
    addReservation: (state, action: PayloadAction<ReservationDetailDto>) => {
      const idx = state.reservations.findIndex(x => x.id === action.payload.id);
      if (idx === -1) {
        state.reservations.unshift(action.payload);
      } else {
        state.reservations[idx] = action.payload;
      }
    },

    updateReservation: (state, action: PayloadAction<ReservationDetailDto>) => {
      const idx = state.reservations.findIndex(x => x.id === action.payload.id);
      if (idx !== -1) {
        state.reservations[idx] = { ...state.reservations[idx], ...action.payload };
      }
      if (state.selectedReservation?.id === action.payload.id) {
        state.selectedReservation = { ...state.selectedReservation, ...action.payload };
      }
    },

    removeReservation: (state, action: PayloadAction<string>) => {
      state.reservations = state.reservations.filter(x => x.id !== action.payload);
      if (state.selectedReservation?.id === action.payload) {
        state.selectedReservation = null;
      }
    },

    clearReservations: (state) => {
      state.reservations = [];
      state.selectedReservation = null;
    },

    // Selected Reservation management
    setSelectedReservation: (state, action: PayloadAction<ReservationDetailDto | null>) => {
      state.selectedReservation = action.payload;
      if (action.payload) {
        const idx = state.reservations.findIndex(x => x.id === action.payload?.id);
        if (idx === -1) {
          state.reservations.unshift(action.payload);
        } else {
          state.reservations[idx] = action.payload;
        }
      }
    },

    clearSelectedReservation: (state) => {
      state.selectedReservation = null;
    },

    // Pagination
    setPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.pagination = action.payload;
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
    resetToursState: () => initialState,
  },
});

export const {
  setItems,
  clearItems,
  upsertItem,
  removeItem,
  setSelectedTour,
  clearSelectedTour,
  addReservation,
  updateReservation,
  removeReservation,
  clearReservations,
  setSelectedReservation,
  clearSelectedReservation,
  setPagination,
  setLoading,
  setError,
  clearError,
  setLastFetched,
  resetToursState,
} = toursSlice.actions;

export const toursReducer = toursSlice.reducer;
export default toursSlice;
