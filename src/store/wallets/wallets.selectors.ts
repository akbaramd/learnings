// src/store/wallets/wallets.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { WalletState, TransactionFilters, DepositFilters, TransactionType, DepositStatus } from './wallets.types';

// Base selector for wallet state
const selectWalletState = (state: RootState): WalletState => state.wallets;

// Basic selectors
export const selectWallet = createSelector(
  [selectWalletState],
  (walletState) => walletState.wallet
);

export const selectWalletTransactions = createSelector(
  [selectWalletState],
  (walletState) => walletState.transactions
);

export const selectWalletDeposits = createSelector(
  [selectWalletState],
  (walletState) => walletState.deposits
);

export const selectWalletStatistics = createSelector(
  [selectWalletState],
  (walletState) => walletState.statistics
);

export const selectWalletPagination = createSelector(
  [selectWalletState],
  (walletState) => walletState.pagination
);

export const selectWalletIsLoading = createSelector(
  [selectWalletState],
  (walletState) => walletState.isLoading
);

export const selectWalletError = createSelector(
  [selectWalletState],
  (walletState) => walletState.error
);

export const selectWalletLastFetched = createSelector(
  [selectWalletState],
  (walletState) => walletState.lastFetched
);

// Computed selectors for wallet
export const selectWalletBalance = createSelector(
  [selectWallet],
  (wallet) => wallet?.balance || 0
);

export const selectWalletId = createSelector(
  [selectWallet],
  (wallet) => wallet?.id || null
);

export const selectWalletUserId = createSelector(
  [selectWallet],
  (wallet) => wallet?.userId || null
);

export const selectWalletUserName = createSelector(
  [selectWallet],
  (wallet) => wallet?.userName || null
);

export const selectWalletCurrency = createSelector(
  [selectWallet],
  (wallet) => wallet?.currency || 'ریال'
);

export const selectWalletLastUpdated = createSelector(
  [selectWallet],
  (wallet) => wallet?.lastUpdated || null
);

// Computed selectors for transactions
export const selectHasTransactions = createSelector(
  [selectWalletTransactions],
  (transactions) => transactions.length > 0
);

export const selectTransactionCount = createSelector(
  [selectWalletTransactions],
  (transactions) => transactions.length
);

export const selectTransactionsByType = createSelector(
  [selectWalletTransactions, (state: RootState, type: TransactionType) => type],
  (transactions, type) => transactions.filter(transaction => transaction.type === type)
);

export const selectTransactionsByDateRange = createSelector(
  [selectWalletTransactions, (state: RootState, fromDate: string, toDate: string) => ({ fromDate, toDate })],
  (transactions, { fromDate, toDate }) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return transactions.filter(transaction => {
      if (!transaction.createdAt) return false;
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= from && transactionDate <= to;
    });
  }
);

export const selectTransactionsByFilters = createSelector(
  [selectWalletTransactions, (state: RootState, filters: TransactionFilters) => filters],
  (transactions, filters) => {
    return transactions.filter(transaction => {
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }
      if (filters.fromDate && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt);
        const fromDate = new Date(filters.fromDate);
        if (transactionDate < fromDate) return false;
      }
      if (filters.toDate && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt);
        const toDate = new Date(filters.toDate);
        if (transactionDate > toDate) return false;
      }
      return true;
    });
  }
);

export const selectRecentTransactions = createSelector(
  [selectWalletTransactions],
  (transactions) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return transactions.filter(transaction => {
      if (!transaction.createdAt) return false;
      const createdAt = new Date(transaction.createdAt);
      return createdAt >= oneWeekAgo;
    }).slice(0, 10); // Limit to 10 most recent
  }
);

export const selectTransactionById = createSelector(
  [selectWalletTransactions, (state: RootState, id: string) => id],
  (transactions, id) => transactions.find(transaction => transaction.id === id)
);

// Computed selectors for deposits
export const selectHasDeposits = createSelector(
  [selectWalletDeposits],
  (deposits) => deposits.length > 0
);

export const selectDepositCount = createSelector(
  [selectWalletDeposits],
  (deposits) => deposits.length
);

export const selectDepositsByStatus = createSelector(
  [selectWalletDeposits, (state: RootState, status: DepositStatus) => status],
  (deposits, status) => deposits.filter(deposit => deposit.status === status)
);

export const selectDepositsByFilters = createSelector(
  [selectWalletDeposits, (state: RootState, filters: DepositFilters) => filters],
  (deposits, filters) => {
    return deposits.filter(deposit => {
      if (filters.status && deposit.status !== filters.status) {
        return false;
      }
      if (filters.fromDate && deposit.createdAt) {
        const depositDate = new Date(deposit.createdAt);
        const fromDate = new Date(filters.fromDate);
        if (depositDate < fromDate) return false;
      }
      if (filters.toDate && deposit.createdAt) {
        const depositDate = new Date(deposit.createdAt);
        const toDate = new Date(filters.toDate);
        if (depositDate > toDate) return false;
      }
      return true;
    });
  }
);

export const selectDepositById = createSelector(
  [selectWalletDeposits, (state: RootState, id: string) => id],
  (deposits, id) => deposits.find(deposit => deposit.id === id)
);

export const selectPendingDeposits = createSelector(
  [selectWalletDeposits],
  (deposits) => deposits.filter(deposit => deposit.status === 'Pending')
);

export const selectCompletedDeposits = createSelector(
  [selectWalletDeposits],
  (deposits) => deposits.filter(deposit => deposit.status === 'Completed')
);

// Pagination selectors
export const selectTransactionPagination = createSelector(
  [selectWalletPagination],
  (pagination) => pagination.transactions
);

export const selectDepositPagination = createSelector(
  [selectWalletPagination],
  (pagination) => pagination.deposits
);

export const selectHasNextTransactionPage = createSelector(
  [selectTransactionPagination],
  (pagination) => pagination.pageNumber < pagination.totalPages
);

export const selectHasPreviousTransactionPage = createSelector(
  [selectTransactionPagination],
  (pagination) => pagination.pageNumber > 1
);

export const selectHasNextDepositPage = createSelector(
  [selectDepositPagination],
  (pagination) => pagination.pageNumber < pagination.totalPages
);

export const selectHasPreviousDepositPage = createSelector(
  [selectDepositPagination],
  (pagination) => pagination.pageNumber > 1
);

// Statistics selectors
export const selectTotalDepositAmount = createSelector(
  [selectWalletStatistics],
  (statistics) => statistics?.totalDepositAmount || 0
);

export const selectTotalWithdrawalAmount = createSelector(
  [selectWalletStatistics],
  (statistics) => statistics?.totalWithdrawalAmount || 0
);

export const selectTotalPaymentAmount = createSelector(
  [selectWalletStatistics],
  (statistics) => statistics?.totalPaymentAmount || 0
);

export const selectTotalTransactionCount = createSelector(
  [selectWalletStatistics],
  (statistics) => statistics?.totalTransactions || 0
);

export const selectDepositCountFromStats = createSelector(
  [selectWalletStatistics],
  (statistics) => statistics?.totalDeposits || 0
);

export const selectWithdrawalCountFromStats = createSelector(
  [selectWalletStatistics],
  (statistics) => statistics?.totalWithdrawals || 0
);

export const selectPaymentCountFromStats = createSelector(
  [selectWalletStatistics],
  (statistics) => statistics?.totalPayments || 0
);

// Combined selectors for convenience
export const selectWalletSummary = createSelector(
  [selectWallet, selectWalletIsLoading, selectWalletError, selectWalletLastFetched],
  (wallet, isLoading, error, lastFetched) => ({
    hasWallet: !!wallet,
    walletId: wallet?.id,
    balance: wallet?.balance || 0,
    isLoading,
    error,
    lastFetched,
  })
);

export const selectWalletActivity = createSelector(
  [selectWalletTransactions, selectWalletDeposits, selectWalletStatistics],
  (transactions, deposits, statistics) => ({
    recentTransactions: transactions.slice(0, 5),
    recentDeposits: deposits.slice(0, 5),
    totalTransactions: statistics?.totalTransactions || 0,
    totalDeposits: statistics?.totalDeposits || 0,
    totalPayments: statistics?.totalPayments || 0,
  })
);

export const selectWalletFinancials = createSelector(
  [selectWalletBalance, selectTotalDepositAmount, selectTotalWithdrawalAmount, selectTotalPaymentAmount],
  (balance, totalDeposits, totalWithdrawals, totalPayments) => ({
    currentBalance: balance,
    totalDeposits,
    totalWithdrawals,
    totalPayments,
    totalActivity: totalDeposits + totalWithdrawals + totalPayments,
  })
);

// Error and loading state selectors
export const selectHasWalletError = createSelector(
  [selectWalletError],
  (error) => !!error
);

export const selectWalletReady = createSelector(
  [selectWalletIsLoading, selectWalletError],
  (isLoading, error) => !isLoading && !error
);

// Transaction type breakdown
export const selectTransactionTypeBreakdown = createSelector(
  [selectWalletTransactions],
  (transactions) => {
    const breakdown: Record<string, number> = {};
    transactions.forEach(transaction => {
      const type = transaction.type || 'unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return breakdown;
  }
);

// Deposit status breakdown
export const selectDepositStatusBreakdown = createSelector(
  [selectWalletDeposits],
  (deposits) => {
    const breakdown: Record<string, number> = {};
    deposits.forEach(deposit => {
      const status = deposit.status || 'unknown';
      breakdown[status] = (breakdown[status] || 0) + 1;
    });
    return breakdown;
  }
);
