// src/store/wallets/wallets.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  CreateDepositRequest,
  CreateDepositResponseWrapper,
  PayWithWalletRequest,
  PayWithWalletResponseWrapper,
  GetTransactionsRequest,
  GetTransactionsResponseWrapper,
  GetDepositsRequest,
  GetDepositsResponseWrapper,
  GetWalletResponse,
  WalletTransaction,
  WalletDeposit,
} from './wallets.types';
import {
  setWallet,
  setTransactions,
  addTransaction,
  setDeposits,
  addDeposit,
  setStatistics,
  setTransactionPagination,
  setDepositPagination,
  setError,
  setLastFetched,
  updateBalanceOptimistically,
} from './wallets.slice';

// Error handling utility
export const handleWalletsApiError = (error: unknown): string => {
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

// Wallets API slice
export const walletsApi = createApi({
  reducerPath: 'walletsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/wallets',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Wallet', 'Transactions', 'Deposits', 'Statistics'],
  // Add proper caching configuration
  keepUnusedDataFor: 300, // Keep data for 5 minutes
  refetchOnMountOrArgChange: false, // Don't refetch on mount
  refetchOnFocus: false, // Don't refetch on window focus
  refetchOnReconnect: true, // Refetch when reconnecting
  endpoints: (builder) => ({
    // Get wallet
    getWallet: builder.query<GetWalletResponse, void>({
      query: () => ({
        url: '/balance',
        method: 'GET',
      }),
      providesTags: ['Wallet'],
      keepUnusedDataFor: 300, // Keep wallet for 5 minutes
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            dispatch(setWallet(data.result));
            dispatch(setLastFetched(new Date().toISOString()));
          }
        } catch (error: unknown) {
          const errorMessage = handleWalletsApiError(error);
          dispatch(setError(errorMessage));
        }
      },
    }),

    // Create deposit
    createDeposit: builder.mutation<CreateDepositResponseWrapper, CreateDepositRequest>({
      query: (request) => ({
        url: '/deposit',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Wallet', 'Deposits'],
      async onQueryStarted(request, { dispatch, queryFulfilled }) {
        try {
          // Optimistically update balance
          if (request.amount) {
            dispatch(updateBalanceOptimistically({ 
              amount: request.amount, 
              operation: 'add' 
            }));
          }

          const { data } = await queryFulfilled;

          if (data?.result) {
            // Add the deposit to the list
            const deposit: WalletDeposit = {
              id: data.result.id,
              walletId: data.result.walletId,
              trackingCode: data.result.trackingCode,
              amount: data.result.amount,
              status: data.result.status,
              description: data.result.description,
              createdAt: data.result.createdAt,
              processedAt: data.result.createdAt, // Assuming processed immediately for deposits
              metadata: data.result.metadata,
            };
            dispatch(addDeposit(deposit));

            // Update wallet with actual data
            if (data.result.amount && data.result.walletId) {
              dispatch(walletsApi.endpoints.getWallet.initiate());
            }
          }
        } catch (error: unknown) {
          const errorMessage = handleWalletsApiError(error);
          dispatch(setError(errorMessage));
          // Revert optimistic update
          if (request.amount) {
            dispatch(updateBalanceOptimistically({ 
              amount: request.amount, 
              operation: 'subtract' 
            }));
          }
        }
      },
    }),

    // Pay with wallet
    payWithWallet: builder.mutation<PayWithWalletResponseWrapper, PayWithWalletRequest>({
      query: (request) => ({
        url: '/pay',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Wallet', 'Transactions'],
      async onQueryStarted(request, { dispatch, queryFulfilled }) {
        try {
          // Optimistically update balance
          if (request.amount) {
            dispatch(updateBalanceOptimistically({ 
              amount: request.amount, 
              operation: 'subtract' 
            }));
          }

          const { data } = await queryFulfilled;

          if (data?.result) {
            // Add the transaction to the list
            const transaction: WalletTransaction = {
              id: data.result.transactionId,
              type: 'Payment',
              amount: data.result.amount,
              balanceAfter: data.result.walletBalanceAfter,
              description: data.result.description,
              reference: data.result.reference,
              createdAt: data.result.processedAt,
              processedAt: data.result.processedAt,
              metadata: data.result.metadata,
            };
            dispatch(addTransaction(transaction));

            // Update wallet with actual data
            dispatch(walletsApi.endpoints.getWallet.initiate());
          }
        } catch (error: unknown) {
          const errorMessage = handleWalletsApiError(error);
          dispatch(setError(errorMessage));
          // Revert optimistic update
          if (request.amount) {
            dispatch(updateBalanceOptimistically({ 
              amount: request.amount, 
              operation: 'add' 
            }));
          }
        }
      },
    }),

    // Get transactions
    getTransactions: builder.query<GetTransactionsResponseWrapper, GetTransactionsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        
        if (request.pageNumber) {
          searchParams.append('pageNumber', request.pageNumber.toString());
        }
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.type) {
          searchParams.append('transactionType', request.type);
        }
        if (request.fromDate) {
          searchParams.append('fromDate', request.fromDate);
        }
        if (request.toDate) {
          searchParams.append('toDate', request.toDate);
        }

        return {
          url: `/transactions?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Transactions'],
      keepUnusedDataFor: 300, // Keep transactions for 5 minutes
      async onQueryStarted(request, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            // Update transactions in slice
            dispatch(setTransactions(data.result.transactions || []));
            
            // Update statistics
            if (data.result.statistics) {
              dispatch(setStatistics(data.result.statistics));
            }
            
            // Update pagination
            dispatch(setTransactionPagination({
              pageNumber: data.result.pageNumber || request.pageNumber || 1,
              pageSize: data.result.pageSize || request.pageSize || 10,
              totalPages: data.result.totalPages || 1,
            }));
          }
        } catch (error: unknown) {
          const errorMessage = handleWalletsApiError(error);
          dispatch(setError(errorMessage));
        }
      },
    }),

    // Get deposits
    getDeposits: builder.query<GetDepositsResponseWrapper, GetDepositsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        
        if (request.pageNumber) {
          searchParams.append('pageNumber', request.pageNumber.toString());
        }
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.status) {
          searchParams.append('status', request.status);
        }
        if (request.fromDate) {
          searchParams.append('fromDate', request.fromDate);
        }
        if (request.toDate) {
          searchParams.append('toDate', request.toDate);
        }

        return {
          url: `/deposits?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Deposits'],
      keepUnusedDataFor: 300, // Keep deposits for 5 minutes
      async onQueryStarted(request, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            // Update deposits in slice
            dispatch(setDeposits(data.result.deposits || []));
            
            // Update pagination
            dispatch(setDepositPagination({
              pageNumber: data.result.pageNumber || request.pageNumber || 1,
              pageSize: data.result.pageSize || request.pageSize || 10,
              totalPages: data.result.totalPages || 1,
            }));
          }
        } catch (error: unknown) {
          const errorMessage = handleWalletsApiError(error);
          dispatch(setError(errorMessage));
        }
      },
    }),
  }),
});

// Export hooks for components
export const {
  useGetWalletQuery,
  useCreateDepositMutation,
  usePayWithWalletMutation,
  useGetTransactionsQuery,
  useGetDepositsQuery,
  // Lazy query hooks
  useLazyGetWalletQuery,
  useLazyGetTransactionsQuery,
  useLazyGetDepositsQuery,
} = walletsApi;

// Export the API slice
export default walletsApi;
