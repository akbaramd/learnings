import { createSelector } from '@reduxjs/toolkit';
import type { FacilitiesState } from './facilities.types';
import { RootState } from '..';

// Base selectors
const selectFacilitiesState = (state: RootState): FacilitiesState => state.facilities;

// Facilities list selectors
export const selectFacilities = createSelector(
  [selectFacilitiesState],
  (state) => state.facilities
);

export const selectSelectedFacility = createSelector(
  [selectFacilitiesState],
  (state) => state.selectedFacility
);

export const selectFacilitiesPagination = createSelector(
  [selectFacilitiesState],
  (state) => state.facilitiesPagination
);

export const selectFacilityById = createSelector(
  [selectFacilities, (state: RootState, facilityId: string) => facilityId],
  (facilities, facilityId) => facilities.find((f) => f.id === facilityId) || null
);

// Facility cycles selectors
export const selectCycles = createSelector(
  [selectFacilitiesState],
  (state) => state.cycles
);

export const selectSelectedCycle = createSelector(
  [selectFacilitiesState],
  (state) => state.selectedCycle
);

export const selectCyclesPagination = createSelector(
  [selectFacilitiesState],
  (state) => state.cyclesPagination
);

export const selectCycleById = createSelector(
  [selectCycles, (state: RootState, cycleId: string) => cycleId],
  (cycles, cycleId) => cycles.find((c) => c.id === cycleId) || null
);

// Facility requests selectors
export const selectRequests = createSelector(
  [selectFacilitiesState],
  (state) => state.requests
);

export const selectSelectedRequest = createSelector(
  [selectFacilitiesState],
  (state) => state.selectedRequest
);

export const selectRequestsPagination = createSelector(
  [selectFacilitiesState],
  (state) => state.requestsPagination
);

export const selectRequestById = createSelector(
  [selectRequests, (state: RootState, requestId: string) => requestId],
  (requests, requestId) => requests.find((r) => r.id === requestId) || null
);

// Loading and error selectors
export const selectFacilitiesLoading = createSelector(
  [selectFacilitiesState],
  (state) => state.isLoading
);

export const selectFacilitiesError = createSelector(
  [selectFacilitiesState],
  (state) => state.error
);

export const selectLastFetched = createSelector(
  [selectFacilitiesState],
  (state) => state.lastFetched
);

// Combined selectors
export const selectFacilitiesWithPagination = createSelector(
  [selectFacilities, selectFacilitiesPagination],
  (facilities, pagination) => ({
    facilities,
    pagination,
  })
);

export const selectCyclesWithPagination = createSelector(
  [selectCycles, selectCyclesPagination],
  (cycles, pagination) => ({
    cycles,
    pagination,
  })
);

export const selectRequestsWithPagination = createSelector(
  [selectRequests, selectRequestsPagination],
  (requests, pagination) => ({
    requests,
    pagination,
  })
);

