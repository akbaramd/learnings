// src/store/bills/bills.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../types';
import {
  GetBillsRequest,
  IssueBillRequest,
  CancelBillRequest,
  Bill,
  BillDetail,
  BillPaginatedResult,
  GetUserBillsResponse,
  GetBillDetailResponse,
  IssueBillResponseWrapper,
  CancelBillResponseWrapper
} from './bills.types';
import {
  setBills,
  setCurrentBill,
  setBillPagination,
  setLoading,
  setError,
  clearError,
  clearCurrentBill,
} from './bills.slice';

// Error handling utility
export const handleBillsApiError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as Record<string, unknown>;
    if (apiError?.data && typeof apiError.data === 'object') {
      const data = apiError.data as Record<string, unknown>;
      if (Array.isArray(data.errors) && data.errors[0]) {
        return String(data.errors[0]);
      }
      if (data.message) {
        return String(data.message);
      }
    }
    if (apiError.message) {
      return String(apiError.message);
    }
  }
  return 'An unexpected error occurred';
};

// Bills API slice
export const billsApi = createApi({
  reducerPath: 'billsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/bills',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Bills', 'BillStatus', 'Statistics'],
  // Add proper caching configuration
  keepUnusedDataFor: 300, // Keep data for 5 minutes
  refetchOnMountOrArgChange: false, // Don't refetch on mount
  refetchOnFocus: false, // Don't refetch on window focus
  refetchOnReconnect: true, // Refetch when reconnecting
  endpoints: (builder) => ({
    // Get user bills - Returns GetUserBillsResponse
    getUserBills: builder.query<GetUserBillsResponse, GetBillsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        
        if (request.pageNumber) {
          searchParams.append('pageNumber', request.pageNumber.toString());
        }
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.billType) {
          searchParams.append('billType', request.billType);
        }
        if (request.billStatus) {
          searchParams.append('status', request.billStatus);
        }
        if (request.status) {
          searchParams.append('status', request.status);
        }
        if (request.onlyOverdue) {
          searchParams.append('onlyOverdue', request.onlyOverdue.toString());
        }
        if (request.onlyUnpaid) {
          searchParams.append('onlyUnpaid', request.onlyUnpaid.toString());
        }
        if (request.sortBy) {
          searchParams.append('sortBy', request.sortBy);
        }
        if (request.sortDirection) {
          searchParams.append('sortDirection', request.sortDirection);
        }

        return {
          url: `/me?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Bills'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.data && Array.isArray(data.data.items)) {
            dispatch(setBills(data.data.items));
            dispatch(setBillPagination({
              pageNumber: data.data.pageNumber || 1,
              pageSize: data.data.pageSize || 20,
              totalPages: data.data.totalPages || 1,
            }));
          }
        } catch (error) {
          const errorMessage = handleBillsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get bill details by ID - Returns GetBillDetailResponse
    getBillDetailsById: builder.query<GetBillDetailResponse, string>({
      query: (billId) => ({
        url: `/${billId}`,
        method: 'GET',
      }),
      providesTags: (result, error, billId) => [{ type: 'BillStatus', id: billId }],
      async onQueryStarted(billId, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.data) {
            dispatch(setCurrentBill(data.data as any));
          }
        } catch (error) {
          const errorMessage = handleBillsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get bill details by number - Returns GetBillDetailResponse
    getBillDetailsByNumber: builder.query<GetBillDetailResponse, string>({
      query: (billNumber) => ({
        url: `/by-number/${billNumber}`,
        method: 'GET',
      }),
      providesTags: (result, error, billNumber) => [{ type: 'BillStatus', id: billNumber }],
      async onQueryStarted(billNumber, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.data) {
            dispatch(setCurrentBill(data.data as any));
          }
        } catch (error) {
          const errorMessage = handleBillsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get bill details by tracking code - Returns GetBillDetailResponse
    getBillDetailsByTrackingCode: builder.query<GetBillDetailResponse, { trackingCode: string; billType?: string }>({
      query: ({ trackingCode, billType }) => {
        const searchParams = new URLSearchParams();
        if (billType) {
          searchParams.append('billType', billType);
        }
        return {
          url: `/by-tracking/${trackingCode}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, { trackingCode }) => [{ type: 'BillStatus', id: trackingCode }],
      async onQueryStarted({ trackingCode }, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.data) {
            dispatch(setCurrentBill(data.data as any));
          }
        } catch (error) {
          const errorMessage = handleBillsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Issue bill - Returns IssueBillResponseWrapper
    issueBill: builder.mutation<IssueBillResponseWrapper, { billId: string; request?: IssueBillRequest }>({
      query: ({ billId, request = {} }) => ({
        url: `/${billId}/issue`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: (result, error, { billId }) => [
        'Bills',
        { type: 'BillStatus', id: billId },
      ],
      async onQueryStarted({ billId }, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.data) {
            // Update the bill status in the current bill if it matches
            dispatch(setCurrentBill(data.data as any));
          }
        } catch (error) {
          const errorMessage = handleBillsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Cancel bill - Returns CancelBillResponseWrapper
    cancelBill: builder.mutation<CancelBillResponseWrapper, { billId: string; request: CancelBillRequest }>({
      query: ({ billId, request }) => ({
        url: `/${billId}/cancel`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: (result, error, { billId }) => [
        'Bills',
        { type: 'BillStatus', id: billId },
      ],
      async onQueryStarted({ billId }, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.data) {
            // Update the bill status in the current bill if it matches
            dispatch(setCurrentBill(data.data as any));
          }
        } catch (error) {
          const errorMessage = handleBillsApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
  }),
});

// Export hooks for components
export const {
  useGetUserBillsQuery,
  useGetBillDetailsByIdQuery,
  useGetBillDetailsByNumberQuery,
  useGetBillDetailsByTrackingCodeQuery,
  useIssueBillMutation,
  useCancelBillMutation,
  // Lazy query hooks
  useLazyGetUserBillsQuery,
  useLazyGetBillDetailsByIdQuery,
  useLazyGetBillDetailsByNumberQuery,
  useLazyGetBillDetailsByTrackingCodeQuery,
} = billsApi;

// Export the API slice
export default billsApi;
