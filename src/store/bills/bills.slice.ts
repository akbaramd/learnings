// src/store/bills/bills.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Bill,
  BillDetail,
  BillPaginatedResult,
  CancelBillRequest,
  CancelBillResponse,
  GetBillsRequest,
  IssueBillRequest,
  IssueBillResponse,
  BillState,
  BillStatus,
  BillFilters,
} from './bills.types';

// Type guards for runtime validation
const isValidBill = (bill: unknown): bill is Bill => {
  if (bill === null || typeof bill !== 'object') return false;

  const billObj = bill as Record<string, unknown>;

  return 'id' in billObj &&
    'externalUserId' in billObj &&
    'createdAt' in billObj &&
    typeof billObj.id === 'string' &&
    typeof billObj.externalUserId === 'string' &&
    typeof billObj.createdAt === 'string';
};

const initialState: BillState = {
  bills: [],
  currentBill: null,
  pagination: {
    bills: {
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    },
  },
  isLoading: false,
  error: null,
};

const billsSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {
    // Set bills list
    setBills: (state, action: PayloadAction<Bill[]>) => {
      state.bills = action.payload;
    },
    
    // Add bill
    addBill: (state, action: PayloadAction<Bill>) => {
      if (isValidBill(action.payload)) {
        state.bills.push(action.payload);
      }
    },

    // Update specific bill
    updateBill: (state, action: PayloadAction<{ id: string; updates: Partial<Bill> }>) => {
      const { id, updates } = action.payload;
      const index = state.bills.findIndex(bill => bill.id === id);
      if (index !== -1) {
        state.bills[index] = { ...state.bills[index], ...updates };
      }

      // Update current bill if it's the same
      if (state.currentBill?.id === id) {
        state.currentBill = { ...state.currentBill, ...updates };
      }
    },

    // Remove bill
    removeBill: (state, action: PayloadAction<string>) => {
      const billId = action.payload;
      state.bills = state.bills.filter(bill => bill.id !== billId);

      // Clear current bill if it's the same
      if (state.currentBill?.id === billId) {
        state.currentBill = null;
      }
    },

    // Set current bill
    setCurrentBill: (state, action: PayloadAction<Bill | null>) => {
      if (action.payload === null || isValidBill(action.payload)) {
        state.currentBill = action.payload;
        state.error = null;
      } else {
        console.warn('Invalid current bill data:', action.payload);
        state.error = 'Invalid current bill data';
      }
    },

   

    // Set pagination for bills
    setBillPagination: (state, action: PayloadAction<{ pageNumber: number; pageSize: number; totalPages: number }>) => {
      state.pagination.bills = action.payload;
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


    // Clear all bill data
    clearBillData: (state) => {
      state.bills = [];
      state.currentBill = null;
      state.error = null;
    },

    // Clear bills list
    clearBills: (state) => {
      state.bills = [];
      state.pagination.bills = {
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      };
    },

    // Clear current bill
    clearCurrentBill: (state) => {
      state.currentBill = null;
    },

    // Reset entire bill state
    resetBillState: () => initialState,

    // Update bill status optimistically
    updateBillStatusOptimistically: (state, action: PayloadAction<{ billId: string; status: BillStatus }>) => {
      const { billId, status } = action.payload;

      // Update in bills list
      const billIndex = state.bills.findIndex(bill => bill.id === billId);
      if (billIndex !== -1) {
        state.bills[billIndex] = {
          ...state.bills[billIndex],
          status: status,
          modifiedAt: new Date().toISOString(),
        };
      }

      // Update current bill if it's the same
      if (state.currentBill?.id === billId) {
        state.currentBill = {
          ...state.currentBill,
          status: status,
          modifiedAt: new Date().toISOString(),
        };
      }

    },

    // Filter bills locally
    filterBills: (state, action: PayloadAction<BillFilters>) => {
      // This would typically be handled by selectors, but keeping for local filtering
      // Implementation would depend on specific filtering requirements
      void state;
      void action;
    },

    // Sort bills
    sortBills: (state, action: PayloadAction<{ field: keyof Bill; direction: 'asc' | 'desc' }>) => {
      const { field, direction } = action.payload;

      state.bills.sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return direction === 'asc' ? 1 : -1;
        if (bValue === undefined) return direction === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    },
  },
});

const { actions, reducer } = billsSlice;

export const {
  setBills,
  addBill,
  updateBill,
  removeBill,
  setCurrentBill,
  setBillPagination,
  setLoading,
  setError,
  clearError,
  clearBillData,
  clearBills,
  clearCurrentBill,
  resetBillState,
  updateBillStatusOptimistically,
  filterBills,
  sortBills,
} = actions;

export default reducer;
