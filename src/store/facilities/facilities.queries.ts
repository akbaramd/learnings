import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';
import {
  GetFacilitiesRequest,
  GetFacilitiesResponse,
  GetFacilityDetailsResponse,
  GetFacilityCyclesRequest,
  GetFacilityCyclesResponse,
  GetFacilityCycleDetailsRequest,
  GetFacilityCycleDetailsResponse,
  GetFacilityRequestsRequest,
  GetFacilityRequestsResponse,
  GetFacilityRequestDetailsResponse,
  CreateFacilityRequestRequest,
  CreateFacilityRequestResponse,
  RejectFacilityRequestRequest,
  RejectFacilityRequestResponse,
  CancelFacilityRequestRequest,
  PaginationInfo,
} from './facilities.types';
import {
  clearFacilities,
  setFacilities,
  setFacilitiesPagination,
  setSelectedFacility,
  clearSelectedFacility,
  clearCycles,
  setCycles,
  setCyclesPagination,
  setSelectedCycle,
  clearSelectedCycle,
  clearRequests,
  setRequests,
  setRequestsPagination,
  setSelectedRequest,
  clearSelectedRequest,
  setLoading,
  setError,
} from './facilities.slice';

/** Error handler for Facilities API */
export const handleFacilitiesApiError = (error: unknown): string => {
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

export const facilitiesApi = createApi({
  reducerPath: 'facilitiesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Facilities', 'FacilityCycles', 'FacilityRequests'],
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // Get Facilities Paginated
    getFacilities: builder.query<GetFacilitiesResponse, GetFacilitiesRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        // API uses 'page' but we accept pageNumber for consistency
        const page = request.pageNumber || 1;
        searchParams.append('page', page.toString());
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        if (request.isActive !== undefined) {
          searchParams.append('isActive', request.isActive.toString());
        }
        return {
          url: `/facilities?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Facilities'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearFacilities());
            dispatch(setFacilities(payload.items || []));
            
            const pageSize = payload.pageSize || arg.pageSize || 10;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            // API returns pageNumber, use it or fallback to our request
            const pageNumber = payload.pageNumber || arg.pageNumber || 1;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: pageNumber > 1,
              hasNextPage: pageNumber < totalPages,
            };
            dispatch(setFacilitiesPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Facility Details
    getFacilityDetails: builder.query<GetFacilityDetailsResponse, string>({
      query: (facilityId) => `/facilities/${facilityId}`,
      providesTags: (result, error, facilityId) => [{ type: 'Facilities', id: facilityId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedFacility());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedFacility(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Facility Cycles
    getFacilityCycles: builder.query<GetFacilityCyclesResponse, GetFacilityCyclesRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.page) {
          searchParams.append('page', request.page.toString());
        }
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.status) {
          searchParams.append('status', request.status);
        }
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        if (request.onlyActive !== undefined) {
          searchParams.append('onlyActive', request.onlyActive.toString());
        }
        if (request.onlyEligible !== undefined) {
          searchParams.append('onlyEligible', request.onlyEligible.toString());
        }
        if (request.onlyWithUserRequests !== undefined) {
          searchParams.append('onlyWithUserRequests', request.onlyWithUserRequests.toString());
        }
        if (request.includeUserRequestStatus !== undefined) {
          searchParams.append('includeUserRequestStatus', request.includeUserRequestStatus.toString());
        }
        if (request.includeDetailedRequestInfo !== undefined) {
          searchParams.append('includeDetailedRequestInfo', request.includeDetailedRequestInfo.toString());
        }
        if (request.includeStatistics !== undefined) {
          searchParams.append('includeStatistics', request.includeStatistics.toString());
        }
        return {
          url: `/facilities/${request.facilityId}/cycles?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'FacilityCycles', id: request.facilityId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearCycles());
            dispatch(setCycles(payload.items || []));
            
            const pageSize = payload.pageSize || arg.pageSize || 10;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            const pageNumber = payload.pageNumber || arg.page || 1;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: pageNumber > 1,
              hasNextPage: pageNumber < totalPages,
            };
            dispatch(setCyclesPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Facility Cycle Details
    getFacilityCycleDetails: builder.query<GetFacilityCycleDetailsResponse, GetFacilityCycleDetailsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeFacilityInfo !== undefined) {
          searchParams.append('includeFacilityInfo', request.includeFacilityInfo.toString());
        }
        if (request.includeUserRequestHistory !== undefined) {
          searchParams.append('includeUserRequestHistory', request.includeUserRequestHistory.toString());
        }
        if (request.includeEligibilityDetails !== undefined) {
          searchParams.append('includeEligibilityDetails', request.includeEligibilityDetails.toString());
        }
        if (request.includeDependencies !== undefined) {
          searchParams.append('includeDependencies', request.includeDependencies.toString());
        }
        if (request.includeStatistics !== undefined) {
          searchParams.append('includeStatistics', request.includeStatistics.toString());
        }
        return {
          url: `/facilities/cycles/${request.cycleId}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'FacilityCycles', id: request.cycleId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedCycle());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedCycle(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Facility Requests
    getFacilityRequests: builder.query<GetFacilityRequestsResponse, GetFacilityRequestsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        // API uses 'page' not 'pageNumber'
        const page = request.pageNumber || 1;
        searchParams.append('page', page.toString());
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.status) {
          searchParams.append('status', request.status);
        }
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        if (request.facilityId) {
          searchParams.append('facilityId', request.facilityId);
        }
        // API uses 'facilityCycleId' not 'cycleId'
        if (request.cycleId) {
          searchParams.append('facilityCycleId', request.cycleId);
        }
        // API uses 'dateFrom' and 'dateTo'
        if (request.fromDate) {
          searchParams.append('dateFrom', request.fromDate);
        }
        if (request.toDate) {
          searchParams.append('dateTo', request.toDate);
        }
        return {
          url: `/facilities/requests?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['FacilityRequests'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearRequests());
            dispatch(setRequests(payload.items || []));
            
            const pageSize = payload.pageSize || arg.pageSize || 10;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            const pageNumber = payload.pageNumber || arg.pageNumber || 1;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: pageNumber > 1,
              hasNextPage: pageNumber < totalPages,
            };
            dispatch(setRequestsPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Facility Request Details
    getFacilityRequestDetails: builder.query<GetFacilityRequestDetailsResponse, string>({
      query: (requestId) => `/facilities/requests/${requestId}`,
      providesTags: (result, error, requestId) => [{ type: 'FacilityRequests', id: requestId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedRequest());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedRequest(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Create Facility Request
    createFacilityRequest: builder.mutation<
      CreateFacilityRequestResponse,
      CreateFacilityRequestRequest
    >({
      query: (request) => ({
        url: '/facilities/requests',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['FacilityRequests'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    

    

    // Cancel Facility Request
    cancelFacilityRequest: builder.mutation<
      void,
      CancelFacilityRequestRequest
    >({
      query: (request) => ({
        url: `/facilities/requests/${request.requestId}/cancel`,
        method: 'POST',
        body: {
          reason: request.reason,
          cancelledByUserId: request.cancelledByUserId,
        },
      }),
      invalidatesTags: (result, error, request) => [{ type: 'FacilityRequests', id: request.requestId }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleFacilitiesApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
  }),
});

export const {
  useGetFacilitiesQuery,
  useLazyGetFacilitiesQuery,
  useGetFacilityDetailsQuery,
  useLazyGetFacilityDetailsQuery,
  useGetFacilityCyclesQuery,
  useLazyGetFacilityCyclesQuery,
  useGetFacilityCycleDetailsQuery,
  useLazyGetFacilityCycleDetailsQuery,
  useGetFacilityRequestsQuery,
  useLazyGetFacilityRequestsQuery,
  useGetFacilityRequestDetailsQuery,
  useLazyGetFacilityRequestDetailsQuery,
  useCreateFacilityRequestMutation,
  useCancelFacilityRequestMutation,
} = facilitiesApi;

export default facilitiesApi;

