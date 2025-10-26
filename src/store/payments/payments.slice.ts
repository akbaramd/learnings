// src/store/payments/payments.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  PaymentState, 
  CreatePaymentResponse,
  PaymentGatewayInfo,
  PayWithWalletResponse,
  PaymentStatus
} from './payments.types';

// Type guards for runtime validation
const isValidPayment = (payment: unknown): payment is CreatePaymentResponse => {
  if (payment === null || typeof payment !== 'object') return false;
  
  const paymentObj = payment as Record<string, unknown>;
  
  return 'paymentId' in paymentObj && 
    'billId' in paymentObj &&
    'amount' in paymentObj &&
    'status' in paymentObj &&
    typeof paymentObj.paymentId === 'string' && 
    typeof paymentObj.billId === 'string' &&
    typeof paymentObj.amount === 'number' &&
    typeof paymentObj.status === 'string';
};

const isValidGateway = (gateway: unknown): gateway is PaymentGatewayInfo => {
  if (gateway === null || typeof gateway !== 'object') return false;
  
  const gatewayObj = gateway as Record<string, unknown>;
  
  return 'gatewayId' in gatewayObj && 
    'gatewayName' in gatewayObj &&
    'isActive' in gatewayObj &&
    typeof gatewayObj.gatewayId === 'string' && 
    typeof gatewayObj.gatewayName === 'string' &&
    typeof gatewayObj.isActive === 'boolean';
};

const isValidWalletPayment = (payment: unknown): payment is PayWithWalletResponse => {
  if (payment === null || typeof payment !== 'object') return false;
  
  const paymentObj = payment as Record<string, unknown>;
  
  return 'paymentId' in paymentObj && 
    'billId' in paymentObj &&
    'amount' in paymentObj &&
    'status' in paymentObj &&
    typeof paymentObj.paymentId === 'string' && 
    typeof paymentObj.billId === 'string' &&
    typeof paymentObj.amount === 'number' &&
    typeof paymentObj.status === 'string';
};

// Initial state
const initialState: PaymentState = {
  currentPayment: null,
  paymentGateways: [],
  isLoading: false,
  error: null,
};

// Payment slice
const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    // Payment actions
    setCurrentPayment: (state, action: PayloadAction<CreatePaymentResponse | null>) => {
      if (action.payload === null || isValidPayment(action.payload)) {
        state.currentPayment = action.payload;
        state.error = null;
      } else {
        state.error = 'Invalid payment data received';
      }
    },

    clearCurrentPayment: (state) => {
      state.currentPayment = null;
      state.error = null;
    },

    // Payment gateways actions
    setPaymentGateways: (state, action: PayloadAction<PaymentGatewayInfo[]>) => {
      const validGateways = action.payload.filter(isValidGateway);
      if (validGateways.length === action.payload.length) {
        state.paymentGateways = validGateways;
        state.error = null;
      } else {
        state.error = 'Some payment gateways have invalid data';
      }
    },

    addPaymentGateway: (state, action: PayloadAction<PaymentGatewayInfo>) => {
      if (isValidGateway(action.payload)) {
        const existingIndex = state.paymentGateways.findIndex(
          gateway => gateway.gatewayId === action.payload.gatewayId
        );
        if (existingIndex >= 0) {
          state.paymentGateways[existingIndex] = action.payload;
        } else {
          state.paymentGateways.push(action.payload);
        }
        state.error = null;
      } else {
        state.error = 'Invalid payment gateway data received';
      }
    },

    updatePaymentGateway: (state, action: PayloadAction<{ gatewayId: string; updates: Partial<PaymentGatewayInfo> }>) => {
      const { gatewayId, updates } = action.payload;
      const gatewayIndex = state.paymentGateways.findIndex(gateway => gateway.gatewayId === gatewayId);
      
      if (gatewayIndex >= 0) {
        const updatedGateway = { ...state.paymentGateways[gatewayIndex], ...updates };
        if (isValidGateway(updatedGateway)) {
          state.paymentGateways[gatewayIndex] = updatedGateway;
          state.error = null;
        } else {
          state.error = 'Invalid payment gateway update data';
        }
      }
    },

    removePaymentGateway: (state, action: PayloadAction<string>) => {
      state.paymentGateways = state.paymentGateways.filter(
        gateway => gateway.gatewayId !== action.payload
      );
    },

    // Loading and error actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.isLoading = false;
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    // Reset actions
    resetPaymentsState: () => initialState,

    // Optimistic updates
    updatePaymentStatusOptimistically: (state, action: PayloadAction<{ paymentId: string; status: PaymentStatus }>) => {
      if (state.currentPayment && state.currentPayment.paymentId === action.payload.paymentId) {
        state.currentPayment.status = action.payload.status;
      }
    },

    // Wallet payment specific actions
    setWalletPayment: (state, action: PayloadAction<PayWithWalletResponse | null>) => {
      if (action.payload === null || isValidWalletPayment(action.payload)) {
        // Convert wallet payment to regular payment format for consistency
        if (action.payload) {
          state.currentPayment = {
            paymentId: action.payload.paymentId,
            billId: action.payload.billId,
            amount: action.payload.amount,
            status: action.payload.status,
            createdAt: action.payload.createdAt,
            billStatus: action.payload.billStatus,
            billTotalAmount: action.payload.billTotalAmount,
            paymentMessage: action.payload.message,
          };
        } else {
          state.currentPayment = null;
        }
        state.error = null;
      } else {
        state.error = 'Invalid wallet payment data received';
      }
    },
  },
});

// Export actions
export const {
  setCurrentPayment,
  clearCurrentPayment,
  setPaymentGateways,
  addPaymentGateway,
  updatePaymentGateway,
  removePaymentGateway,
  setLoading,
  setError,
  clearError,
  resetPaymentsState,
  updatePaymentStatusOptimistically,
  setWalletPayment,
} = paymentsSlice.actions;

// Export reducer
export const paymentsReducer = paymentsSlice.reducer;
export default paymentsReducer;
