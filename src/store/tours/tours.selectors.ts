import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { ToursState } from './tours.types';

// Base selector for tours state with defensive check
const selectToursState = (state: RootState): ToursState => {
  // Access tours from state, with fallback to initial state if undefined
  if (!state.tours) {
    return {
      items: [],
      selectedTour: null,
      reservations: [],
      selectedReservation: null,
      pagination: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      reservationsList:[],
      reservationsPagination:null
    };
  }
  return state.tours;
};

// Basic selectors
export const selectToursItems = createSelector(
  [selectToursState],
  (toursState) => toursState.items
);

export const selectSelectedTour = createSelector(
  [selectToursState],
  (toursState) => toursState.selectedTour
);

export const selectToursReservations = createSelector(
  [selectToursState],
  (toursState) => toursState.reservations
);

export const selectSelectedReservation = createSelector(
  [selectToursState],
  (toursState) => toursState.selectedReservation
);

export const selectToursPagination = createSelector(
  [selectToursState],
  (toursState) => toursState.pagination
);

export const selectToursIsLoading = createSelector(
  [selectToursState],
  (toursState) => toursState.isLoading
);

export const selectToursError = createSelector(
  [selectToursState],
  (toursState) => toursState.error
);

export const selectToursLastFetched = createSelector(
  [selectToursState],
  (toursState) => toursState.lastFetched
);

// Computed selectors
export const selectHasTours = createSelector(
  [selectToursItems],
  (items) => items.length > 0
);

export const selectToursCount = createSelector(
  [selectToursItems],
  (items) => items.length
);

export const selectActiveTours = createSelector(
  [selectToursItems],
  (items) => items.filter((tour) => tour.isActive === true)
);

export const selectInactiveTours = createSelector(
  [selectToursItems],
  (items) => items.filter((tour) => tour.isActive === false)
);

export const selectTourById = createSelector(
  [selectToursItems, (state: RootState, tourId: string) => tourId],
  (items, tourId) => items.find((tour) => tour.id === tourId) || null
);

export const selectToursWithRegistrationOpen = createSelector(
  [selectToursItems],
  (items) => items.filter((tour) => tour.isRegistrationOpen === true)
);

export const selectHasReservations = createSelector(
  [selectToursReservations],
  (reservations) => reservations.length > 0
);

export const selectReservationsCount = createSelector(
  [selectToursReservations],
  (reservations) => reservations.length
);

