// src/store/bills/bills.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Bill,
  BillItem,
  BillPayment,
  BillRefund,
  BillDetail,
  BillPaginatedResult,
  CancelBillRequest,
  CancelBillResponse,
  GetBillsRequest,
  IssueBillRequest,
   IssueBillResponse,
   BillState
} from './bills.types';

// Type guards for runtime validation
const isValidBill = (bill: unknown): bill is Bill => {
  if (bill === null || typeof bill !== 'object') return false;

  const billObj = bill as Record<string, unknown>;

  return 'id' in billObj &&
    'userId' in billObj &&
    'createdAt' in billObj &&
    typeof billObj.id === 'string' &&
    typeof billObj.userId === 'string' &&
    typeof billObj.createdAt === 'string';
};

const isValidBillItem = (item: unknown): item is BillItem => {
  if (item === null || typeof item !== 'object') return false;

  const itemObj = item as Record<string, unknown>;

  return 'id' in itemObj &&
    'billId' in itemObj &&
    'itemName' in itemObj &&
    'quantity' in itemObj &&
    'unitPrice' in itemObj &&
    typeof itemObj.id === 'string' &&
    typeof itemObj.billId === 'string' &&
    typeof itemObj.itemName === 'string' &&
    typeof itemObj.quantity === 'number' &&
    typeof itemObj.unitPrice === 'number';
};

const isValidBillPayment = (payment: unknown): payment is BillPayment => {
  if (payment === null || typeof payment !== 'object') return false;

  const paymentObj = payment as Record<string, unknown>;

  return 'id' in paymentObj &&
    'billId' in paymentObj &&
    'amount' in paymentObj &&
    'paymentStatus' in paymentObj &&
    typeof paymentObj.id === 'string' &&
    typeof paymentObj.billId === 'string' &&
    typeof paymentObj.amount === 'number' &&
    typeof paymentObj.paymentStatus === 'string';
};

const isValidBillRefund = (refund: unknown): refund is BillRefund => {
  if (refund === null || typeof refund !== 'object') return false;

  const refundObj = refund as Record<string, unknown>;

  return 'id' in refundObj &&
    'billId' in refundObj &&
    'amount' in refundObj &&
    'refundStatus' in refundObj &&
    typeof refundObj.id === 'string' &&
    typeof refundObj.billId === 'string' &&
    typeof refundObj.amount === 'number' &&
    typeof refundObj.refundStatus === 'string';
};

const initialState: BillState = {
  bills: [],
  billDetail: null,
  isLoading: false,
  error: null,
  };

    // Update specific bill
    updateBill: (state, action: PayloadAction<{ id: string; updates: Partial<BillDto> }>) => {
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

    // Set bill status with validation
    setBillStatus: (state, action: PayloadAction<GetBillStatusResponse | null>) => {
      state.billStatus = action.payload;
      state.error = null;
    },

    // Add bill payment
    addBillPayment: (state, action: PayloadAction<BillPayment>) => {
      if (isValidBillPayment(action.payload)) {
        if (state.billStatus?.paymentHistory) {
          state.billStatus.paymentHistory.push(action.payload);
        } else if (state.billStatus) {
          state.billStatus.paymentHistory = [action.payload];
        }

        // Update bill amounts
        const billId = action.payload.billId;
        const billIndex = state.bills.findIndex(bill => bill.id === billId);
        if (billIndex !== -1) {
          const bill = state.bills[billIndex];
          const newPaidAmount = (bill.billPaidAmount || 0) + action.payload.amount;
          const newRemainingAmount = Math.max(0, (bill.billTotalAmount || 0) - newPaidAmount);

          state.bills[billIndex] = {
            ...bill,
            billPaidAmount: newPaidAmount,
            billRemainingAmount: newRemainingAmount,
            isBillFullyPaid: newRemainingAmount === 0,
            billFullyPaidDate: newRemainingAmount === 0 ? action.payload.paymentDate : bill.billFullyPaidDate,
          };
        }

        // Update current bill if it's the same
        if (state.currentBill?.id === billId) {
          const newPaidAmount = (state.currentBill.billPaidAmount || 0) + action.payload.amount;
          const newRemainingAmount = Math.max(0, (state.currentBill.billTotalAmount || 0) - newPaidAmount);

          state.currentBill = {
            ...state.currentBill,
            billPaidAmount: newPaidAmount,
            billRemainingAmount: newRemainingAmount,
            isBillFullyPaid: newRemainingAmount === 0,
            billFullyPaidDate: newRemainingAmount === 0 ? action.payload.paymentDate : state.currentBill.billFullyPaidDate,
          };
        }
      } else {
        console.warn('Invalid bill payment data:', action.payload);
        state.error = 'Invalid bill payment data';
      }
    },

    // Add bill refund
    addBillRefund: (state, action: PayloadAction<BillRefund>) => {
      if (isValidBillRefund(action.payload)) {
        if (state.billStatus?.refundHistory) {
          state.billStatus.refundHistory.push(action.payload);
        } else if (state.billStatus) {
          state.billStatus.refundHistory = [action.payload];
        }

        // Update bill amounts
        const billId = action.payload.billId;
        const billIndex = state.bills.findIndex(bill => bill.id === billId);
        if (billIndex !== -1) {
          const bill = state.bills[billIndex];
          const newPaidAmount = Math.max(0, (bill.billPaidAmount || 0) - action.payload.amount);
          const newRemainingAmount = (bill.billTotalAmount || 0) - newPaidAmount;

          state.bills[billIndex] = {
            ...bill,
            billPaidAmount: newPaidAmount,
            billRemainingAmount: newRemainingAmount,
            isBillFullyPaid: newRemainingAmount === 0,
            billFullyPaidDate: newRemainingAmount === 0 ? undefined : bill.billFullyPaidDate,
          };
        }

        // Update current bill if it's the same
        if (state.currentBill?.id === billId) {
          const newPaidAmount = Math.max(0, (state.currentBill.billPaidAmount || 0) - action.payload.amount);
          const newRemainingAmount = (state.currentBill.billTotalAmount || 0) - newPaidAmount;

          state.currentBill = {
            ...state.currentBill,
            billPaidAmount: newPaidAmount,
            billRemainingAmount: newRemainingAmount,
            isBillFullyPaid: newRemainingAmount === 0,
            billFullyPaidDate: newRemainingAmount === 0 ? undefined : state.currentBill.billFullyPaidDate,
          };
        }
      } else {
        console.warn('Invalid bill refund data:', action.payload);
        state.error = 'Invalid bill refund data';
      }
    },

    // Set bill statistics
    setStatistics: (state, action: PayloadAction<BillStatistics | null>) => {
      state.statistics = action.payload;
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
      state.billStatus = null;
      state.statistics = null;
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
      state.billStatus = null;
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
          billStatus: status,
          updatedAt: new Date().toISOString(),
        };
      }

      // Update current bill if it's the same
      if (state.currentBill?.id === billId) {
        state.currentBill = {
          ...state.currentBill,
          billStatus: status,
          updatedAt: new Date().toISOString(),
        };
      }

      // Update bill status if it's the same
      if (state.billStatus?.billId === billId) {
        state.billStatus = {
          ...state.billStatus,
          billStatus: status,
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

export const {
  setBills,
  addBill,
  updateBill,
  removeBill,
  setCurrentBill,
  setBillStatus,
  addBillPayment,
  addBillRefund,
  setStatistics,
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
} = billsSlice.actions;

export default billsSlice.reducer;
