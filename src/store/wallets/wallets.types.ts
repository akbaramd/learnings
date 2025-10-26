// src/store/wallets/wallets.types.ts
// Frontend-focused wallet types with clean naming

// Core wallet data structures for frontend
export interface Wallet {
  id: string;
  userId: string;
  userName: string;
  balance: number;
  currency: string;
  lastUpdated: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  createdAt: string;
  processedAt?: string;
  metadata?: Record<string, string>;
}

export interface WalletDeposit {
  id: string;
  walletId: string;
  trackingCode?: string;
  amount: number;
  status: DepositStatus;
  statusText?: string;
  description?: string;
  createdAt: string;
  processedAt?: string;
  metadata?: Record<string, string>;
}

export interface WalletStatistics {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPayments: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  totalPaymentAmount: number;
}

export interface WalletBalanceAnalysis {
  startingBalance: number;
  currentBalance: number;
  totalInflow: number;
  totalOutflow: number;
  netChange: number;
  trendPoints: BalanceTrendPoint[];
}

export interface BalanceTrendPoint {
  date: string;
  balance: number;
}

// Request types for API calls
export interface CreateDepositRequest {
  walletId: string;
  amount: number;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PayWithWalletRequest {
  paymentId: string;
  billId?: string;
  amount: number;
  description?: string;
  metadata?: Record<string, string>;
}

export interface GetTransactionsRequest {
  pageNumber?: number;
  pageSize?: number;
  type?: TransactionType;
  fromDate?: string;
  toDate?: string;
}

export interface GetDepositsRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: DepositStatus;
  fromDate?: string;
  toDate?: string;
}

// Response types
export interface CreateDepositResponse {
  id: string;
  walletId: string;
  trackingCode?: string;
  amount: number;
  status: DepositStatus;
  description?: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface PayWithWalletResponse {
  paymentId: string;
  billId?: string;
  walletId: string;
  amount: number;
  billRemainingAmount: number;
  walletBalanceAfter: number;
  processedAt: string;
  description?: string;
  reference?: string;
  transactionId: string;
  metadata?: Record<string, string>;
}

export interface GetTransactionsResponse {
  walletId: string;
  userId: string;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  transactions: WalletTransaction[];
  statistics: WalletStatistics;
}

export interface GetDepositsResponse {
  userId: string;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  deposits: WalletDeposit[];
}

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  result: T | null;
  errors: string[] | null;
}

// Specific response types for each endpoint
export interface GetWalletResponse {
  result: Wallet | null;
  errors: string[] | null;
}

export interface CreateDepositResponseWrapper {
  result: CreateDepositResponse | null;
  errors: string[] | null;
}

export interface PayWithWalletResponseWrapper {
  result: PayWithWalletResponse | null;
  errors: string[] | null;
}

export interface GetTransactionsResponseWrapper {
  result: GetTransactionsResponse | null;
  errors: string[] | null;
}

export interface GetDepositsResponseWrapper {
  result: GetDepositsResponse | null;
  errors: string[] | null;
}

// Wallet state for Redux store
export interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  deposits: WalletDeposit[];
  statistics: WalletStatistics | null;
  pagination: {
    transactions: {
      pageNumber: number;
      pageSize: number;
      totalPages: number;
    };
    deposits: {
      pageNumber: number;
      pageSize: number;
      totalPages: number;
    };
  };
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

// Transaction types for better type safety
export type TransactionType = 
  | 'Deposit'
  | 'Withdrawal'
  | 'Payment'
  | 'Adjustment'
  | 'Refund'
  | 'Transfer';

export type DepositStatus = 
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

// Filter options for transactions and deposits
export interface TransactionFilters {
  type?: TransactionType;
  fromDate?: string;
  toDate?: string;
}

export interface DepositFilters {
  status?: DepositStatus;
  fromDate?: string;
  toDate?: string;
}

// Wallet operation types
export type WalletOperation = 
  | 'deposit'
  | 'withdraw'
  | 'pay'
  | 'transfer'
  | 'adjust';

// Balance trend analysis
export interface BalanceTrend {
  period: 'daily' | 'weekly' | 'monthly';
  points: BalanceTrendPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}
