// src/store/bills/bills.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  GetBillsRequest,
  IssueBillRequest,
  CancelBillRequest,
  GetBillsResponseWrapper,
  GetBillStatusResponseWrapper,
  IssueBillResponseWrapper,
  CancelBillResponseWrapper,
} from './bills.types';

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
    // Get user bills - Returns BillDtoPaginatedResultApplicationResult
    getUserBills: builder.query<GetBillsResponseWrapper, GetBillsRequest>({
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
    }),

    // Get bill details by ID - Returns BillDetailDtoApplicationResult
    getBillDetailsById: builder.query<GetBillStatusResponseWrapper, string>({
      query: (billId) => ({
        url: `/${billId}`,
        method: 'GET',
      }),
      providesTags: (result, error, billId) => [{ type: 'BillStatus', id: billId }],
    }),

    // Get bill details by number - Returns BillDetailDtoApplicationResult
    getBillDetailsByNumber: builder.query<GetBillStatusResponseWrapper, string>({
      query: (billNumber) => ({
        url: `/by-number/${billNumber}`,
        method: 'GET',
      }),
      providesTags: (result, error, billNumber) => [{ type: 'BillStatus', id: billNumber }],
    }),

    // Get bill details by tracking code - Returns BillDetailDtoApplicationResult
    getBillDetailsByTrackingCode: builder.query<GetBillStatusResponseWrapper, { trackingCode: string; billType?: string }>({
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
    }),

    // Issue bill - Returns IssueBillResponseApplicationResult
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
    }),

    // Cancel bill - Returns CancelBillResponseApplicationResult
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
