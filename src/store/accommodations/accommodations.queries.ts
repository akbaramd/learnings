import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';
import {
  GetAccommodationsPaginatedRequest,
  GetAccommodationsPaginatedResponse,
  GetAccommodationDetailResponse,
  GetReservationDetailResponse,
  GetReservationPricingResponse,
  CreateReservationResponse,
  PayReservationResponse,
  AddGuestToReservationResponse,
  FinalizeReservationResponse,
  SubmitReservationResponse,
  RejectReservationResponse,
  CancelReservationResponse,
  RevertReservationResponse,
  DeleteReservationResponse,
  CreateReservationRequest,
  AddGuestToReservationRequest,
  RemoveGuestFromReservationRequest,
  GetReservationsPaginatedRequest,
  GetReservationsPaginatedResponse,
  GetUserReservationsRequest,
  GetUserReservationsResponse,
  GetRoomReservationsInDateRangeRequest,
  GetRoomReservationsInDateRangeResponse,
  PaginationInfo,
} from './accommodations.types';
import {
  clearItems,
  setItems,
  setPagination,
  setSelectedAccommodation,
  clearSelectedAccommodation,
  setSelectedReservation,
  clearSelectedReservation,
  setLoading,
  setError,
  setReservationsList,
  clearReservationsList,
  setReservationsPagination,
} from './accommodations.slice';

/** Error handler for Accommodations API */
export const handleAccommodationsApiError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as Record<string, unknown>;
    if ('response' in apiError && apiError.response) {
      const response = apiError.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (Array.isArray(data.errors) && data.errors[0]) return String(data.errors[0]);
        if (data.message) return String(data.message);
      }
    }
    if (apiError?.data && typeof apiError.data === 'object') {
      const data = apiError.data as Record<string, unknown>;
      if (Array.isArray(data.errors) && data.errors[0]) return String(data.errors[0]);
      if (data.message) return String(data.message);
    }
    if (apiError.message) return String(apiError.message);
  }
  return 'Unexpected error';
};

export const accommodationsApi = createApi({
  reducerPath: 'accommodationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Accommodations', 'Reservations'],
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // Get Accommodations Paginated
    getAccommodationsPaginated: builder.query<GetAccommodationsPaginatedResponse, GetAccommodationsPaginatedRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        searchParams.append('page', request.pageNumber.toString());
        searchParams.append('pageSize', request.pageSize.toString());
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        if (request.type) {
          searchParams.append('type', request.type);
        }
        if (request.isActive !== undefined) {
          searchParams.append('isActive', request.isActive.toString());
        }
        if (request.provinceId) {
          searchParams.append('provinceId', request.provinceId);
        }
        if (request.cityId) {
          searchParams.append('cityId', request.cityId);
        }
        if (request.featureIds && request.featureIds.length > 0) {
          request.featureIds.forEach(id => searchParams.append('featureIds', id));
        }
        if (request.minPriceRials !== undefined) {
          searchParams.append('minPriceRials', request.minPriceRials.toString());
        }
        if (request.maxPriceRials !== undefined) {
          searchParams.append('maxPriceRials', request.maxPriceRials.toString());
        }
        return {
          url: `/hotels/accommodations?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Accommodations'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearItems());
            dispatch(setItems(payload.items || []));
            
            const pageSize = payload.pageSize || arg.pageSize;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            const pageNumber = payload.pageNumber || arg.pageNumber;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: pageNumber > 1,
              hasNextPage: pageNumber < totalPages,
            };
            dispatch(setPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Accommodation Detail
    getAccommodationDetail: builder.query<GetAccommodationDetailResponse, string>({
      query: (accommodationId) => `/hotels/accommodations/${accommodationId}`,
      providesTags: (result, error, accommodationId) => [{ type: 'Accommodations', id: accommodationId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedAccommodation());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedAccommodation(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Create Reservation
    createReservation: builder.mutation<CreateReservationResponse, CreateReservationRequest>({
      query: (request) => ({
        url: '/hotels/reservations/create',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Reservations'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data?.id) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Pay Reservation
    payReservation: builder.mutation<PayReservationResponse, string>({
      query: (reservationId) => ({
        url: `/hotels/reservations/${reservationId}/pay`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reservationId) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Reservation Detail
    getReservationDetail: builder.query<GetReservationDetailResponse, string>({
      query: (reservationId) => `/hotels/reservations/${reservationId}`,
      providesTags: (result, error, reservationId) => [{ type: 'Reservations', id: reservationId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedReservation());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedReservation(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Reservation Pricing
    getReservationPricing: builder.query<GetReservationPricingResponse, string>({
      query: (reservationId) => `/hotels/reservations/${reservationId}/pricing`,
      providesTags: (result, error, reservationId) => [{ type: 'Reservations', id: reservationId }],
      keepUnusedDataFor: 300,
    }),

    // Add Guest to Reservation
    addGuestToReservation: builder.mutation<AddGuestToReservationResponse, AddGuestToReservationRequest>({
      query: ({ reservationId, guest }) => ({
        url: `/hotels/reservations/${reservationId}/guests`,
        method: 'POST',
        body: guest,
      }),
      invalidatesTags: (result, error, { reservationId }) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Remove Guest from Reservation
    removeGuestFromReservation: builder.mutation<GetReservationDetailResponse, RemoveGuestFromReservationRequest>({
      query: ({ reservationId, guestId }) => ({
        url: `/hotels/reservations/${reservationId}/guests/${guestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { reservationId }) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Submit Reservation
    submitReservation: builder.mutation<SubmitReservationResponse, string>({
      query: (reservationId) => ({
        url: `/hotels/reservations/${reservationId}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reservationId) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Reject Reservation
    rejectReservation: builder.mutation<RejectReservationResponse, { reservationId: string; reason?: string }>({
      query: ({ reservationId, reason }) => ({
        url: `/hotels/reservations/${reservationId}/reject`,
        method: 'POST',
        body: reason ? { reason } : {},
      }),
      invalidatesTags: (result, error, { reservationId }) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Cancel Reservation
    cancelReservation: builder.mutation<CancelReservationResponse, { reservationId: string; reason?: string }>({
      query: ({ reservationId, reason }) => ({
        url: `/hotels/reservations/${reservationId}/cancel`,
        method: 'POST',
        body: reason ? { reason } : {},
      }),
      invalidatesTags: (result, error, { reservationId }) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Revert Reservation (from Submitted to Pending)
    revertReservation: builder.mutation<RevertReservationResponse, string>({
      query: (reservationId) => ({
        url: `/hotels/reservations/${reservationId}/revert`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reservationId) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Delete Reservation
    deleteReservation: builder.mutation<DeleteReservationResponse, string>({
      query: (reservationId) => ({
        url: `/hotels/reservations/${reservationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, reservationId) => [
        { type: 'Reservations', id: reservationId },
        { type: 'Reservations' },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),


    // Get Reservations Paginated
    getReservationsPaginated: builder.query<GetReservationsPaginatedResponse, GetReservationsPaginatedRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        searchParams.append('page', request.pageNumber.toString());
        searchParams.append('pageSize', request.pageSize.toString());
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        if (request.status) {
          searchParams.append('status', request.status);
        }
        if (request.accommodationId) {
          searchParams.append('accommodationId', request.accommodationId);
        }
        if (request.roomId) {
          searchParams.append('roomId', request.roomId);
        }
        if (request.externalUserId) {
          searchParams.append('externalUserId', request.externalUserId);
        }
        if (request.checkInDateFrom) {
          searchParams.append('checkInDateFrom', request.checkInDateFrom);
        }
        if (request.checkInDateTo) {
          searchParams.append('checkInDateTo', request.checkInDateTo);
        }
        if (request.checkOutDateFrom) {
          searchParams.append('checkOutDateFrom', request.checkOutDateFrom);
        }
        if (request.checkOutDateTo) {
          searchParams.append('checkOutDateTo', request.checkOutDateTo);
        }
        if (request.reservationDateFrom) {
          searchParams.append('reservationDateFrom', request.reservationDateFrom);
        }
        if (request.reservationDateTo) {
          searchParams.append('reservationDateTo', request.reservationDateTo);
        }
        if (request.minPriceRials !== undefined) {
          searchParams.append('minPriceRials', request.minPriceRials.toString());
        }
        if (request.maxPriceRials !== undefined) {
          searchParams.append('maxPriceRials', request.maxPriceRials.toString());
        }
        return {
          url: `/hotels/reservations?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Reservations'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearReservationsList());
            dispatch(setReservationsList(payload.items || []));
            
            const pageSize = payload.pageSize || arg.pageSize;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            const pageNumber = payload.pageNumber || arg.pageNumber;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: pageNumber > 1,
              hasNextPage: pageNumber < totalPages,
            };
            dispatch(setReservationsPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleAccommodationsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get User Reservations
    getUserReservations: builder.query<GetUserReservationsResponse, GetUserReservationsRequest | void>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        const req = request || {};
        if (req.accommodationId) {
          searchParams.append('accommodationId', req.accommodationId);
        }
        if (req.roomId) {
          searchParams.append('roomId', req.roomId);
        }
        if (req.status) {
          searchParams.append('status', req.status);
        }
        if (req.onlyActive !== undefined) {
          searchParams.append('onlyActive', req.onlyActive.toString());
        }
        if (req.onlyFuture !== undefined) {
          searchParams.append('onlyFuture', req.onlyFuture.toString());
        }
        if (req.onlyPast !== undefined) {
          searchParams.append('onlyPast', req.onlyPast.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `/hotels/reservations/user/me${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Reservations'],
      keepUnusedDataFor: 300,
    }),

    // Get My Reservations For Accommodation
    getMyReservationsForAccommodation: builder.query<GetUserReservationsResponse, { accommodationId: string; status?: string; onlyActive?: boolean; onlyFuture?: boolean; onlyPast?: boolean }>({
      query: ({ accommodationId, status, onlyActive, onlyFuture, onlyPast }) => {
        const searchParams = new URLSearchParams();
        if (status) {
          searchParams.append('status', status);
        }
        if (onlyActive !== undefined) {
          searchParams.append('onlyActive', onlyActive.toString());
        }
        if (onlyFuture !== undefined) {
          searchParams.append('onlyFuture', onlyFuture.toString());
        }
        if (onlyPast !== undefined) {
          searchParams.append('onlyPast', onlyPast.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `/hotels/reservations/accommodations/${accommodationId}/my-reservations${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, { accommodationId }) => [{ type: 'Reservations', id: `accommodation-${accommodationId}` }],
      keepUnusedDataFor: 300,
    }),

    // Get Room Reservations In Date Range
    getRoomReservationsInDateRange: builder.query<GetRoomReservationsInDateRangeResponse, GetRoomReservationsInDateRangeRequest>({
      query: ({ roomId, startDate, endDate, onlyActive = true }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('startDate', startDate);
        searchParams.append('endDate', endDate);
        searchParams.append('onlyActive', onlyActive.toString());
        return {
          url: `/hotels/reservations/rooms/${roomId}/calendar?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, { roomId }) => [{ type: 'Reservations', id: `room-${roomId}` }],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetAccommodationsPaginatedQuery,
  useLazyGetAccommodationsPaginatedQuery,
  useGetAccommodationDetailQuery,
  useLazyGetAccommodationDetailQuery,
  useCreateReservationMutation,
  usePayReservationMutation,
  useGetReservationDetailQuery,
  useLazyGetReservationDetailQuery,
  useGetReservationPricingQuery,
  useLazyGetReservationPricingQuery,
  useAddGuestToReservationMutation,
  useRemoveGuestFromReservationMutation,
  useSubmitReservationMutation,
  useRejectReservationMutation,
  useCancelReservationMutation,
  useRevertReservationMutation,
  useDeleteReservationMutation,
  useGetReservationsPaginatedQuery,
  useLazyGetReservationsPaginatedQuery,
  useGetUserReservationsQuery,
  useLazyGetUserReservationsQuery,
  useGetMyReservationsForAccommodationQuery,
  useLazyGetMyReservationsForAccommodationQuery,
  useGetRoomReservationsInDateRangeQuery,
  useLazyGetRoomReservationsInDateRangeQuery,
} = accommodationsApi;

export default accommodationsApi;

