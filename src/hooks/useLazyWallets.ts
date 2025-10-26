// src/hooks/useLazyWallets.ts
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  useLazyGetWalletQuery,
  useLazyGetTransactionsQuery,
  useLazyGetDepositsQuery,
  useCreateDepositMutation,
  usePayWithWalletMutation,
} from '@/src/store/wallets';
import {
  setWallet,
  setTransactions,
  setDeposits,
  setStatistics,
  setTransactionPagination,
  setDepositPagination,
  setError,
  setLastFetched,
  updateBalanceOptimistically,
} from '@/src/store/wallets';
import type {
  GetTransactionsRequest,
  GetDepositsRequest,
  CreateDepositRequest,
  PayWithWalletRequest,
} from '@/src/store/wallets/wallets.types';

export const useLazyWallets = () => {
  const dispatch = useDispatch();
  
  // Lazy query hooks
  const [getWallet] = useLazyGetWalletQuery();
  const [getTransactions] = useLazyGetTransactionsQuery();
  const [getDeposits] = useLazyGetDepositsQuery();
  
  // Mutation hooks
  const [createDeposit] = useCreateDepositMutation();
  const [payWithWallet] = usePayWithWalletMutation();

  // Wallet operations
  const fetchWallet = useCallback(async () => {
    try {
      dispatch(setError(null));
      const result = await getWallet().unwrap();
      
      if (result?.result) {
        dispatch(setWallet(result.result));
        dispatch(setLastFetched(new Date().toISOString()));
        return { success: true, data: result.result };
      } else {
        dispatch(setError(result?.errors?.[0] || 'Failed to fetch wallet'));
        return { success: false, error: result?.errors?.[0] || 'Failed to fetch wallet' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallet';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, getWallet]);

  // Wallet transactions operations
  const fetchTransactions = useCallback(async (params: GetTransactionsRequest & { walletId?: string }) => {
    try {
      dispatch(setError(null));
      const result = await getTransactions(params).unwrap();
      
      if (result?.result) {
        dispatch(setTransactions(result.result.transactions || []));
        
        if (result.result.statistics) {
          dispatch(setStatistics(result.result.statistics));
        }
        
        dispatch(setTransactionPagination({
          pageNumber: result.result.pageNumber || params.pageNumber || 1,
          pageSize: result.result.pageSize || params.pageSize || 10,
          totalPages: result.result.totalPages || 1,
        }));
        
        return { success: true, data: result.result };
      } else {
        dispatch(setError(result?.errors?.[0] || 'Failed to fetch transactions'));
        return { success: false, error: result?.errors?.[0] || 'Failed to fetch transactions' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, getTransactions]);

  // Wallet deposits operations
  const fetchDeposits = useCallback(async (params: GetDepositsRequest & { walletId?: string }) => {
    try {
      dispatch(setError(null));
      const result = await getDeposits(params).unwrap();
      
      if (result?.result) {
        dispatch(setDeposits(result.result.deposits || []));
        
        dispatch(setDepositPagination({
          pageNumber: result.result.pageNumber || params.pageNumber || 1,
          pageSize: result.result.pageSize || params.pageSize || 10,
          totalPages: result.result.totalPages || 1,
        }));
        
        return { success: true, data: result.result };
      } else {
        dispatch(setError(result?.errors?.[0] || 'Failed to fetch deposits'));
        return { success: false, error: result?.errors?.[0] || 'Failed to fetch deposits' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deposits';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, getDeposits]);

  // Create wallet deposit
  const createWalletDeposit = useCallback(async (request: CreateDepositRequest) => {
    try {
      dispatch(setError(null));
      
      // Optimistically update balance
      if (request.amount) {
        dispatch(updateBalanceOptimistically({ 
          amount: request.amount, 
          operation: 'add' 
        }));
      }
      
      const result = await createDeposit(request).unwrap();
      
      if (result?.result) {
        // Refresh wallet to get accurate data
        await fetchWallet();
        return { success: true, data: result.result };
      } else {
        // Revert optimistic update
        if (request.amount) {
          dispatch(updateBalanceOptimistically({ 
            amount: request.amount, 
            operation: 'subtract' 
          }));
        }
        dispatch(setError(result?.errors?.[0] || 'Failed to create deposit'));
        return { success: false, error: result?.errors?.[0] || 'Failed to create deposit' };
      }
    } catch (error) {
      // Revert optimistic update
      if (request.amount) {
        dispatch(updateBalanceOptimistically({ 
          amount: request.amount, 
          operation: 'subtract' 
        }));
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to create deposit';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, createDeposit, fetchWallet]);

  // Pay with wallet
  const payWithWalletAmount = useCallback(async (request: PayWithWalletRequest) => {
    try {
      dispatch(setError(null));
      
      // Optimistically update balance
      if (request.amount) {
        dispatch(updateBalanceOptimistically({ 
          amount: request.amount, 
          operation: 'subtract' 
        }));
      }
      
      const result = await payWithWallet(request).unwrap();
      
      if (result?.result) {
        // Refresh wallet to get accurate data
        await fetchWallet();
        return { success: true, data: result.result };
      } else {
        // Revert optimistic update
        if (request.amount) {
          dispatch(updateBalanceOptimistically({ 
            amount: request.amount, 
            operation: 'add' 
          }));
        }
        dispatch(setError(result?.errors?.[0] || 'Failed to process payment'));
        return { success: false, error: result?.errors?.[0] || 'Failed to process payment' };
      }
    } catch (error) {
      // Revert optimistic update
      if (request.amount) {
        dispatch(updateBalanceOptimistically({ 
          amount: request.amount, 
          operation: 'add' 
        }));
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, payWithWallet, fetchWallet]);

  // Refresh all wallet data
  const refreshWalletData = useCallback(async (walletId?: string) => {
    try {
      dispatch(setError(null));
      
      const [walletResult, transactionsResult, depositsResult] = await Promise.allSettled([
        fetchWallet(),
        fetchTransactions({ pageNumber: 1, pageSize: 10, walletId }),
        fetchDeposits({ pageNumber: 1, pageSize: 10, walletId }),
      ]);
      
      const results = {
        wallet: walletResult.status === 'fulfilled' ? walletResult.value : { success: false, error: 'Failed to fetch wallet' },
        transactions: transactionsResult.status === 'fulfilled' ? transactionsResult.value : { success: false, error: 'Failed to fetch transactions' },
        deposits: depositsResult.status === 'fulfilled' ? depositsResult.value : { success: false, error: 'Failed to fetch deposits' },
      };
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh wallet data';
      dispatch(setError(errorMessage));
      return {
        balance: { success: false, error: errorMessage },
        transactions: { success: false, error: errorMessage },
        deposits: { success: false, error: errorMessage },
      };
    }
  }, [dispatch, fetchWallet, fetchTransactions, fetchDeposits]);

  return {
    // Fetch operations
    fetchWallet,
    fetchTransactions,
    fetchDeposits,
    refreshWalletData,
    
    // Mutation operations
    createWalletDeposit,
    payWithWalletAmount,
    
    // Direct access to RTK Query hooks (for advanced usage)
    getWallet,
    getTransactions,
    getDeposits,
    createDeposit,
    payWithWallet,
  };
};
