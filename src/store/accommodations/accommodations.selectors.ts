import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { AccommodationsState } from './accommodations.types';

// Base selector for accommodations state with defensive check
const selectAccommodationsState = (state: RootState): AccommodationsState => {
  // Access accommodations from state, with fallback to initial state if undefined
  if (!state.accommodations) {
    return {
      items: [],
      selectedAccommodation: null,
      reservations: [],
      selectedReservation: null,
      pagination: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      reservationsList: [],
      reservationsPagination: null,
    };
  }
  return state.accommodations;
};

// Basic selectors
export const selectAccommodationsItems = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.items
);

export const selectSelectedAccommodation = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.selectedAccommodation
);

export const selectAccommodationsReservations = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.reservations
);

export const selectSelectedReservation = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.selectedReservation
);

export const selectAccommodationsPagination = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.pagination
);

export const selectAccommodationsIsLoading = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.isLoading
);

export const selectAccommodationsError = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.error
);

export const selectAccommodationsLastFetched = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.lastFetched
);

// Computed selectors
export const selectHasAccommodations = createSelector(
  [selectAccommodationsItems],
  (items) => items.length > 0
);

export const selectAccommodationsCount = createSelector(
  [selectAccommodationsItems],
  (items) => items.length
);

export const selectActiveAccommodations = createSelector(
  [selectAccommodationsItems],
  (items) => items.filter((accommodation) => accommodation.isActive === true)
);

export const selectInactiveAccommodations = createSelector(
  [selectAccommodationsItems],
  (items) => items.filter((accommodation) => accommodation.isActive === false)
);

export const selectAccommodationById = createSelector(
  [selectAccommodationsItems, (state: RootState, accommodationId: string) => accommodationId],
  (items, accommodationId) => items.find((accommodation) => accommodation.id === accommodationId) || null
);

export const selectAccommodationsWithAvailableRooms = createSelector(
  [selectAccommodationsItems],
  (items) => items.filter((accommodation) => accommodation.canAccommodateGuests === true)
);

export const selectHasReservations = createSelector(
  [selectAccommodationsReservations],
  (reservations) => reservations.length > 0
);

export const selectReservationsCount = createSelector(
  [selectAccommodationsReservations],
  (reservations) => reservations.length
);

export const selectReservationsList = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.reservationsList
);

export const selectReservationsPagination = createSelector(
  [selectAccommodationsState],
  (accommodationsState) => accommodationsState.reservationsPagination
);

