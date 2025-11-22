import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  AccommodationsState,
  PaginationInfo,
  AccommodationDto,
  AccommodationDetailsDto,
  ReservationDetailsDto,
} from './accommodations.types';
import { ReservationDto } from '@/src/services/Api';

const initialState: AccommodationsState = {
  items: [],
  selectedAccommodation: null,
  reservations: [],
  reservationsList: [],
  selectedReservation: null,
  pagination: null,
  reservationsPagination: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

const accommodationsSlice = createSlice({
  name: 'accommodations',
  initialState,
  reducers: {
    // Accommodations list management
    setItems: (state, action: PayloadAction<AccommodationDto[]>) => {
      state.items = action.payload;
    },

    clearItems: (state) => {
      state.items = [];
      state.pagination = null;
      state.error = null;
    },

    upsertItem: (state, action: PayloadAction<AccommodationDto>) => {
      const idx = state.items.findIndex(x => x.id === action.payload.id);
      if (idx === -1) state.items.unshift(action.payload);
      else state.items[idx] = { ...state.items[idx], ...action.payload };
    },

    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(x => x.id !== action.payload);
    },

    // Selected Accommodation management
    setSelectedAccommodation: (state, action: PayloadAction<AccommodationDetailsDto | null>) => {
      state.selectedAccommodation = action.payload;
    },

    clearSelectedAccommodation: (state) => {
      state.selectedAccommodation = null;
    },

    // Reservations management
    addReservation: (state, action: PayloadAction<ReservationDetailsDto>) => {
      const idx = state.reservations.findIndex(x => x.id === action.payload.id);
      if (idx === -1) {
        state.reservations.unshift(action.payload);
      } else {
        state.reservations[idx] = action.payload;
      }
    },

    updateReservation: (state, action: PayloadAction<ReservationDetailsDto>) => {
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
    setSelectedReservation: (state, action: PayloadAction<ReservationDetailsDto | null>) => {
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

    // Reservations list (paginated)
    setReservationsList: (state, action: PayloadAction<ReservationDto[]>) => {
      state.reservationsList = action.payload;
    },

    clearReservationsList: (state) => {
      state.reservationsList = [];
      state.reservationsPagination = null;
    },

    setReservationsPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.reservationsPagination = action.payload;
    },

    addReservationToList: (state, action: PayloadAction<ReservationDto>) => {
      const idx = state.reservationsList.findIndex(x => x.id === action.payload.id);
      if (idx === -1) {
        state.reservationsList.unshift(action.payload);
      } else {
        state.reservationsList[idx] = action.payload;
      }
    },

    removeReservationFromList: (state, action: PayloadAction<string>) => {
      state.reservationsList = state.reservationsList.filter(x => x.id !== action.payload);
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
    resetAccommodationsState: () => initialState,
  },
});

export const {
  setItems,
  clearItems,
  upsertItem,
  removeItem,
  setSelectedAccommodation,
  clearSelectedAccommodation,
  addReservation,
  updateReservation,
  removeReservation,
  clearReservations,
  setSelectedReservation,
  clearSelectedReservation,
  setPagination,
  setReservationsList,
  clearReservationsList,
  setReservationsPagination,
  addReservationToList,
  removeReservationFromList,
  setLoading,
  setError,
  clearError,
  setLastFetched,
  resetAccommodationsState,
} = accommodationsSlice.actions;

export const accommodationsReducer = accommodationsSlice.reducer;
export default accommodationsSlice;

