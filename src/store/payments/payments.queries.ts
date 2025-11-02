// src/store/payments/payments.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
    CreatePaymentRequest,
    CreatePaymentResponseWrapper,
    PayWithWalletRequest,
    PayWithWalletResponseWrapper,
    GetPaymentGatewaysResponseWrapper,
    PaymentGatewayInfo, GetPaymentDetailWrapper,
} from './payments.types';
import {
  setCurrentPayment,
  setPaymentGateways,
  setError,
  setLoading,
} from './payments.slice';
import { AxiosError } from 'axios';
import { baseQueryWithReauth } from '../api/baseApi';


// Lightweight diagnostic logger to understand error shapes at runtime
const debugLogError = (error: unknown) => {
  const base = {
    typeof: typeof error,
    constructor: error && typeof error === 'object' ? (error as unknown as { constructor?: { name?: string } })?.constructor?.name : undefined,
  };
  try {
    if (error && typeof error === 'object') {
      const err = error as AxiosError & { isAxiosError?: boolean };
      // Avoid logging entire payloads; just summarize
      // eslint-disable-next-line no-console
      console.log('[payments] error diagnostic:', {
        ...base,
        isAxiosError: !!err?.isAxiosError,
        message: (err as unknown as Error)?.message,
        code: (err as unknown as AxiosError)?.code,
        status: err?.response?.status,  
        statusText: err?.response?.statusText,
        dataType: typeof err?.response?.data,
        dataKeys: err?.response?.data && typeof err.response.data === 'object' ? Object.keys(err.response.data as object) : undefined,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('[payments] error diagnostic:', base);
    }
  } catch {
    // Swallow any logging errors
  }
};

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
          debugLogError(error);
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
                  debugLogError(error);
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

  }),
});

// Export hooks for usage in functional components
export const {
  useCreatePaymentMutation,
  useGetPaymentGatewaysQuery,
  useGetPaymentDetailQuery,
  useLazyGetPaymentGatewaysQuery,
  useLazyGetPaymentDetailQuery,
} = paymentsApi;

// Export the API slice
export default paymentsApi;
