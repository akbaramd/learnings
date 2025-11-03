import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';
import {
  GetToursPaginatedRequest,
  GetToursPaginatedResponse,
  GetTourDetailResponse,
  GetReservationDetailResponse,
  GetReservationPricingResponse,
  StartReservationResponse,
  AddGuestToReservationResponseWrapper,
  RemoveGuestFromReservationResponseWrapper,
  FinalizeReservationResponse,
  ReactivateReservationResponse,
  StartReservationRequestWrapper,
  AddGuestToReservationRequest,
  GetReservationsPaginatedRequest,
  GetReservationsPaginatedResponse,
  PaginationInfo,
} from './tours.types';
import {
  clearItems,
  setItems,
  setPagination,
  setSelectedTour,
  clearSelectedTour,
  setSelectedReservation,
  clearSelectedReservation,
  setLoading,
  setError,
  setReservationsList,
  clearReservationsList,
  setReservationsPagination,
} from './tours.slice';

/** Error handler for Tours API */
export const handleToursApiError = (error: unknown): string => {
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

export const toursApi = createApi({
  reducerPath: 'toursApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Tours', 'Reservations'],
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // Get Tours Paginated
    getToursPaginated: builder.query<GetToursPaginatedResponse, GetToursPaginatedRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        searchParams.append('pageNumber', request.pageNumber.toString());
        searchParams.append('pageSize', request.pageSize.toString());
        if (request.isActive !== undefined) {
          searchParams.append('isActive', request.isActive.toString());
        }
        if (request.search) {
          searchParams.append('search', request.search);
        }
        return {
          url: `/tours?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Tours'],
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
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Tour Detail
    getTourDetail: builder.query<GetTourDetailResponse, string>({
      query: (tourId) => `/tours/${tourId}`,
      providesTags: (result, error, tourId) => [{ type: 'Tours', id: tourId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedTour());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedTour(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Start Reservation
    startReservation: builder.mutation<StartReservationResponse, StartReservationRequestWrapper>({
      query: (request) => ({
        url: '/tours/reservations/start',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Reservations'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data?.reservationId) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Reservation Detail
    getReservationDetail: builder.query<GetReservationDetailResponse, string>({
      query: (reservationId) => `/tours/reservations/${reservationId}`,
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
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Reservation Pricing
    getReservationPricing: builder.query<GetReservationPricingResponse, string>({
      query: (reservationId) => `/tours/reservations/${reservationId}/pricing`,
      providesTags: (result, error, reservationId) => [{ type: 'Reservations', id: reservationId }],
      keepUnusedDataFor: 300,
    }),

    // Add Guest to Reservation
    addGuestToReservation: builder.mutation<AddGuestToReservationResponseWrapper, AddGuestToReservationRequest>({
      query: ({ reservationId, guest }) => ({
        url: `/tours/reservations/${reservationId}/guests`,
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
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Remove Guest from Reservation
    removeGuestFromReservation: builder.mutation<RemoveGuestFromReservationResponseWrapper, { reservationId: string; participantId: string }>({
      query: ({ reservationId, participantId }) => ({
        url: `/tours/reservations/${reservationId}/guests/${participantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { reservationId }) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Finalize Reservation
    finalizeReservation: builder.mutation<FinalizeReservationResponse, string>({
      query: (reservationId) => ({
        url: `/tours/reservations/${reservationId}/finalize`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reservationId) => [{ type: 'Reservations', id: reservationId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            // Optionally update the reservation in state if needed
            // The reservation detail should be refetched after finalization
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Reactivate Reservation
    reactivateReservation: builder.mutation<ReactivateReservationResponse, string>({
      query: (reservationId) => ({
        url: `/tours/reservations/${reservationId}/reactivate`,
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
          const errorMessage = handleToursApiError(error);
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
        searchParams.append('pageNumber', request.pageNumber.toString());
        searchParams.append('pageSize', request.pageSize.toString());
        if (request.status) {
          searchParams.append('status', request.status);
        }
        if (request.search) {
          searchParams.append('search', request.search);
        }
        if (request.fromDate) {
          searchParams.append('fromDate', request.fromDate);
        }
        if (request.toDate) {
          searchParams.append('toDate', request.toDate);
        }
        return {
          url: `/tours/reservations?${searchParams.toString()}`,
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
          const errorMessage = handleToursApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
  }),
});

export const {
  useGetToursPaginatedQuery,
  useLazyGetToursPaginatedQuery,
  useGetTourDetailQuery,
  useLazyGetTourDetailQuery,
  useStartReservationMutation,
  useGetReservationDetailQuery,
  useLazyGetReservationDetailQuery,
  useGetReservationPricingQuery,
  useLazyGetReservationPricingQuery,
  useAddGuestToReservationMutation,
  useRemoveGuestFromReservationMutation,
  useFinalizeReservationMutation,
  useReactivateReservationMutation,
  useGetReservationsPaginatedQuery,
  useLazyGetReservationsPaginatedQuery,
} = toursApi;

export default toursApi;
