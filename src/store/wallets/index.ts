// src/store/wallets/index.ts
// Central export file for all wallet-related modules

// Export types
export * from './wallets.types';

// Export slice actions and reducer
export * from './wallets.slice';
export { default as walletsReducer } from './wallets.slice';

// Export queries and hooks
export * from './wallets.queries';
export { default as walletsApi } from './wallets.queries';

// Export selectors
export * from './wallets.selectors';

// Re-export commonly used types for convenience
export type {
  TransactionType,
  DepositStatus,
  WalletOperation,
  TransactionFilters,
  DepositFilters,
  BalanceTrend,
} from './wallets.types';

// Re-export commonly used actions for convenience
export {
  setTransactions,
  addTransaction,
  updateTransaction,
  setDeposits,
  addDeposit,
  updateDeposit,
  setStatistics,
  setTransactionPagination,
  setDepositPagination,
  setLoading,
  setError,
  clearError,
  setLastFetched,
  clearWalletData,
  clearTransactions,
  clearDeposits,
  resetWalletState,
  updateBalanceOptimistically,
} from './wallets.slice';

// Re-export commonly used selectors for convenience
export {
  selectWalletBalance,
  selectWalletTransactions,
  selectWalletDeposits,
  selectWalletStatistics,
  selectWalletIsLoading,
  selectWalletError,
  selectWalletSummary,
  selectWalletActivity,
  selectWalletFinancials,
  selectHasTransactions,
  selectHasDeposits,
  selectRecentTransactions,
  selectPendingDeposits,
  selectCompletedDeposits,
  selectTransactionTypeBreakdown,
  selectDepositStatusBreakdown,
} from './wallets.selectors';

// Re-export commonly used hooks for convenience
export {
  usePayWithWalletMutation,
  useGetWalletQuery,
  useGetTransactionsQuery,
  useGetDepositsQuery,

  useLazyGetDepositsQuery,
  useLazyGetWalletQuery,
  useLazyGetTransactionsQuery,
} from './wallets.queries';
