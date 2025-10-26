// src/store/payments/payments.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  CreatePaymentRequest,
  CreatePaymentResponseWrapper,
  PayWithWalletRequest,
  PayWithWalletResponseWrapper,
  GetPaymentGatewaysResponseWrapper,
  PaymentGatewayInfo,
} from './payments.types';
import {
  setCurrentPayment,
  setPaymentGateways,
  setWalletPayment,
  setError,
  setLoading,
} from './payments.slice';

// Error handling utility
export const handlePaymentsApiError = (error: unknown): string => {
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

// Payments API slice
export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/payments',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Payment', 'PaymentGateway', 'WalletPayment'],
  endpoints: (builder) => ({
    // Create payment
    createPayment: builder.mutation<CreatePaymentResponseWrapper, CreatePaymentRequest>({
      query: (paymentData) => ({
        url: '',
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

    // Get payment gateways
    getPaymentGateways: builder.query<GetPaymentGatewaysResponseWrapper, void>({
      query: () => '/gateways',
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

    // Pay with wallet
    payWithWallet: builder.mutation<PayWithWalletResponseWrapper, PayWithWalletRequest>({
      query: (walletPaymentData) => ({
        url: '/wallet',
        method: 'POST',
        body: walletPaymentData,
      }),
      invalidatesTags: ['WalletPayment', 'Payment'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          if (data.result) {
            dispatch(setWalletPayment(data.result));
          } else if (data.errors) {
            dispatch(setError(data.errors[0] || 'Failed to pay with wallet'));
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
  useLazyGetPaymentGatewaysQuery,
  usePayWithWalletMutation,
} = paymentsApi;

// Export the API slice
export default paymentsApi;
