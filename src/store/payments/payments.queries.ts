// src/store/payments/payments.queries.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import {
    CreatePaymentRequest,
    CreatePaymentResponseWrapper,
    GetPaymentGatewaysResponseWrapper,
    GetPaymentDetailWrapper,
    GetPaymentsPaginatedRequest,
    GetPaymentsPaginatedResponse,
    GetBillPaymentsRequest,
    GetBillPaymentsResponse,
    PaginationInfo,
} from './payments.types';
import {
  setCurrentPayment,
  setPaymentGateways,
  setError,
  setLoading,
  setPayments,
  clearPayments,
  setPaymentsPagination,
} from './payments.slice';
import { baseQueryWithReauth } from '../api/baseApi';

export const handlePaymentsApiError = (payload: unknown): string => {
  try {
    const get = (o: unknown, path: readonly string[]): unknown => {
      let current: unknown = o;
      for (const key of path) {
        if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return undefined;
        }
      }
      return current;
    };

    const candidates: unknown[] = [
      // RTK Query error wrapper shapes
      get(payload, ['error', 'data', 'errors']),
      get(payload, ['data', 'errors']),
      (payload as { errors?: unknown })?.errors,
      // Messages
      get(payload, ['error', 'data', 'message']),
      get(payload, ['data', 'message']),
      (payload as { message?: unknown })?.message,
    ];

    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0) {
        return c.filter((x) => typeof x === 'string').join(' | ') || 'An unexpected error occurred';
      }
      if (typeof c === 'string' && c.trim() !== '') {
        return c;
      }
    }
  } catch {
    // ignore
  }
  return 'An unexpected error occurred';
};

// Payments API slice
export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Payment', 'PaymentGateway', 'WalletPayment'],
  endpoints: (builder) => ({
    // Create payment
    createPayment: builder.mutation<CreatePaymentResponseWrapper, CreatePaymentRequest>({
      query: (paymentData) => ({
        url: '/payments',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Payment'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          if (data.result) {
            dispatch(setCurrentPayment(data.result));
          } else if (data.errors) {
            dispatch(setError(data.errors[0] || 'Failed to create payment'));
          }
        } catch (error) {
          dispatch(setError(handlePaymentsApiError(error)));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
      getPaymentDetail: builder.query<GetPaymentDetailWrapper, string>({
          query: (id) => ({
              url: `/payments/${id}`,
              method: 'GET',
          }),
          providesTags: ['Payment'],
          async onQueryStarted(_, { dispatch, queryFulfilled }) {
              
              dispatch(setLoading(true));
              try {
                  const { data } = await queryFulfilled;
                  console.log('data', data);
                  if (data.result) {
                      dispatch(setCurrentPayment(data.result));
                  } else if (data.errors) {
                      dispatch(setError(data.errors[0] || 'Failed to create payment'));
                  }
              } catch (error) {
                  dispatch(setError(handlePaymentsApiError(error)));
              } finally {
                  dispatch(setLoading(false));
              }
          },
      }),
    // Get payment gateways
    getPaymentGateways: builder.query<GetPaymentGatewaysResponseWrapper, void>({
      query: () => ({
        url: '/payments/gateways',
        method: 'GET',
      }),
      providesTags: ['PaymentGateway'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          if (data.result?.gateways) {
            dispatch(setPaymentGateways(data.result.gateways));
          } else if (data.errors) {
            dispatch(setError(data.errors[0] || 'Failed to get payment gateways'));
          }
        } catch (error) {
          dispatch(setError(handlePaymentsApiError(error)));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Payments Paginated
    getPaymentsPaginated: builder.query<GetPaymentsPaginatedResponse, GetPaymentsPaginatedRequest>({
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
          url: `/payments?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Payment'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearPayments());
            dispatch(setPayments(payload.items || []));
            
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
            dispatch(setPaymentsPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          dispatch(setError(handlePaymentsApiError(error)));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Bill Payments Paginated
    getBillPayments: builder.query<GetBillPaymentsResponse, GetBillPaymentsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        searchParams.append('pageNumber', request.pageNumber.toString());
        searchParams.append('pageSize', request.pageSize.toString());
        // Valid sort fields: id, issuedate, duedate, amount, status
        const validSortFields = ['id', 'issuedate', 'duedate', 'amount', 'status'];
        const sortBy = request.sortBy && validSortFields.includes(request.sortBy)
          ? request.sortBy
          : 'issuedate'; // Default to issuedate if invalid or missing
        searchParams.append('sortBy', sortBy);
        searchParams.append('sortDirection', request.sortDirection || 'desc');
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        return {
          url: `/bills/${request.billId}/payments?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Payment'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearPayments());
            dispatch(setPayments(payload.items || []));
            
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
            dispatch(setPaymentsPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          dispatch(setError(handlePaymentsApiError(error)));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

  }),
});

// Export hooks for usage in functional components
export const {
  useCreatePaymentMutation,
  useGetPaymentGatewaysQuery,
  useGetPaymentDetailQuery,
  useGetPaymentsPaginatedQuery,
  useGetBillPaymentsQuery,
  useLazyGetPaymentGatewaysQuery,
  useLazyGetPaymentDetailQuery,
  useLazyGetPaymentsPaginatedQuery,
  useLazyGetBillPaymentsQuery,
} = paymentsApi;

// Export the API slice
export default paymentsApi;
