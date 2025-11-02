// src/store/wallets/wallets.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  WalletState, 
  Wallet,
  WalletTransaction,
  WalletDeposit,
  WalletStatistics,
  TransactionFilters,
  DepositFilters,
  WalletDepositDetails
} from './wallets.types';

// Type guards for runtime validation
const isValidWallet = (wallet: unknown): wallet is Wallet => {
  if (wallet === null || typeof wallet !== 'object') return false;
  
  const walletObj = wallet as Record<string, unknown>;
  
  return 'id' in walletObj && 
    'balance' in walletObj &&
    'currency' in walletObj &&
    typeof walletObj.id === 'string' && 
    typeof walletObj.balance === 'number' &&
    typeof walletObj.currency === 'string';
};

const isValidTransaction = (transaction: unknown): transaction is WalletTransaction => {
  if (transaction === null || typeof transaction !== 'object') return false;
  
  const transactionObj = transaction as Record<string, unknown>;
  
  return 'id' in transactionObj && 
    'amount' in transactionObj &&
    'type' in transactionObj &&
    typeof transactionObj.id === 'string' && 
    typeof transactionObj.amount === 'number' &&
    typeof transactionObj.type === 'string';
};

const isValidDeposit = (deposit: unknown): deposit is WalletDeposit => {
  if (deposit === null || typeof deposit !== 'object') return false;
  
  const depositObj = deposit as Record<string, unknown>;
  
  return 'id' in depositObj && 
    'amount' in depositObj &&
    'status' in depositObj &&
    typeof depositObj.id === 'string' && 
    typeof depositObj.amount === 'number' &&
    typeof depositObj.status === 'string';
};

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  deposits: [],
  selectedDeposit: null,
  statistics: null,
  pagination: {
    transactions: {
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    },
    deposits: {
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    },
  },
  isLoading: false,
  error: null,
  lastFetched: null,
};

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    // Set wallet with validation
    setWallet: (state, action: PayloadAction<Wallet | null>) => {
      if (action.payload === null || isValidWallet(action.payload)) {
        state.wallet = action.payload;
        state.error = null;
      } else {
        console.warn('Invalid wallet data:', action.payload);
        state.error = 'Invalid wallet data';
      }
    },
    
    // Set transactions with validation
    setTransactions: (state, action: PayloadAction<WalletTransaction[]>) => {
      const validTransactions = action.payload.filter(isValidTransaction);
      if (validTransactions.length !== action.payload.length) {
        console.warn('Some transactions were invalid and filtered out');
      }
      state.transactions = validTransactions;
      state.error = null;
    },
    
    // Add new transaction (for optimistic updates)
    addTransaction: (state, action: PayloadAction<WalletTransaction>) => {
      if (isValidTransaction(action.payload)) {
        state.transactions.unshift(action.payload);
        // Update wallet balance if provided
        if (action.payload.balanceAfter !== undefined && state.wallet) {
          state.wallet.balance = action.payload.balanceAfter;
          state.wallet.lastUpdated = action.payload.createdAt;
        }
      } else {
        console.warn('Invalid transaction data:', action.payload);
        state.error = 'Invalid transaction data';
      }
    },
    
    // Update specific transaction
    updateTransaction: (state, action: PayloadAction<{ id: string; updates: Partial<WalletTransaction> }>) => {
      const { id, updates } = action.payload;
      const index = state.transactions.findIndex(transaction => transaction.id === id);
      if (index !== -1) {
        state.transactions[index] = { ...state.transactions[index], ...updates };
      }
    },
    
    // Set deposits with validation
    setDeposits: (state, action: PayloadAction<WalletDeposit[]>) => {
      const validDeposits = action.payload.filter(isValidDeposit);
      if (validDeposits.length !== action.payload.length) {
        console.warn('Some deposits were invalid and filtered out');
      }
      state.deposits = validDeposits;
      state.error = null;
    },
    
    // Add new deposit (for optimistic updates)
    addDeposit: (state, action: PayloadAction<WalletDeposit>) => {
      if (isValidDeposit(action.payload)) {
        state.deposits.unshift(action.payload);
      } else {
        console.warn('Invalid deposit data:', action.payload);
        state.error = 'Invalid deposit data';
      }
    },
    
    // Update specific deposit
    updateDeposit: (state, action: PayloadAction<{ id: string; updates: Partial<WalletDeposit> }>) => {
      const { id, updates } = action.payload;
      const index = state.deposits.findIndex(deposit => deposit.id === id);
      if (index !== -1) {
        state.deposits[index] = { ...state.deposits[index], ...updates };
      }
    },
    
    // Set transaction statistics
    setStatistics: (state, action: PayloadAction<WalletStatistics | null>) => {
      state.statistics = action.payload;
    },
    
    // Set pagination for transactions
    setTransactionPagination: (state, action: PayloadAction<{ pageNumber: number; pageSize: number; totalPages: number }>) => {
      state.pagination.transactions = action.payload;
    },
    
    // Set pagination for deposits
    setDepositPagination: (state, action: PayloadAction<{ pageNumber: number; pageSize: number; totalPages: number }>) => {
      state.pagination.deposits = action.payload;
    },
    
    // Select a specific deposit (details)
    setSelectedDeposit: (state, action: PayloadAction<WalletDepositDetails | null>) => {
      state.selectedDeposit = action.payload;
    },
    
    // Clear selected deposit
    clearSelectedDeposit: (state) => {
      state.selectedDeposit = null;
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error message with validation
    setError: (state, action: PayloadAction<string | null>) => {
      if (action.payload === null || typeof action.payload === 'string') {
        state.error = action.payload;
      } else {
        console.warn('Invalid error message:', action.payload);
        state.error = 'Invalid error message';
      }
    },
    
    // Clear error message
    clearError: (state) => {
      state.error = null;
    },
    
    // Set last fetched timestamp
    setLastFetched: (state, action: PayloadAction<string>) => {
      state.lastFetched = action.payload;
    },
    
    // Clear all wallet data
    clearWalletData: (state) => {
      state.wallet = null;
      state.transactions = [];
      state.deposits = [];
      state.statistics = null;
      state.error = null;
    },
    
    // Clear transactions
    clearTransactions: (state) => {
      state.transactions = [];
      state.pagination.transactions = {
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      };
    },
    
    // Clear deposits
    clearDeposits: (state) => {
      state.deposits = [];
      state.pagination.deposits = {
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      };
    },
    
    // Reset entire wallet state
    resetWalletState: () => initialState,
    
    // Update balance optimistically (for payments, deposits, etc.)
    updateBalanceOptimistically: (state, action: PayloadAction<{ amount: number; operation: 'add' | 'subtract' }>) => {
      if (state.wallet) {
        const { amount, operation } = action.payload;
        if (operation === 'add') {
          state.wallet.balance = (state.wallet.balance || 0) + amount;
        } else {
          state.wallet.balance = Math.max(0, (state.wallet.balance || 0) - amount);
        }
        state.wallet.lastUpdated = new Date().toISOString();
      }
    },
    
    // Filter transactions locally
    filterTransactions: (state, action: PayloadAction<TransactionFilters>) => {
      // This would typically be handled by selectors, but keeping for local filtering
      // Implementation would depend on specific filtering requirements
      void state;
      void action;
    },
    
    // Filter deposits locally
    filterDeposits: (state, action: PayloadAction<DepositFilters>) => {
      // This would typically be handled by selectors, but keeping for local filtering
      // Implementation would depend on specific filtering requirements
      void state;
      void action;
    },
  },
});

export const {
  setWallet,
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
  filterTransactions,
  filterDeposits,
  setSelectedDeposit,
  clearSelectedDeposit,
} = walletsSlice.actions;

export default walletsSlice.reducer;
