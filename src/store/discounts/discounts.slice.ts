// src/store/discounts/discounts.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  DiscountState, 
  ValidateDiscountCodeResponse,
  DiscountCodeInfo,
  BillWithDiscountInfo
} from './discounts.types';

// Type guards for runtime validation
const isValidDiscountCode = (discountCode: unknown): discountCode is DiscountCodeInfo => {
  if (discountCode === null || typeof discountCode !== 'object') return false;
  
  const discountObj = discountCode as Record<string, unknown>;
  
  return 'code' in discountObj && 
    'type' in discountObj &&
    'value' in discountObj &&
    typeof discountObj.code === 'string' && 
    typeof discountObj.type === 'string' &&
    typeof discountObj.value === 'number';
};

const isValidBillWithDiscount = (bill: unknown): bill is BillWithDiscountInfo => {
  if (bill === null || typeof bill !== 'object') return false;
  
  const billObj = bill as Record<string, unknown>;
  
  return 'billId' in billObj && 
    'originalTotalAmountRials' in billObj &&
    'discountAmountRials' in billObj &&
    'newTotalAmountRials' in billObj &&
    typeof billObj.billId === 'string' && 
    typeof billObj.originalTotalAmountRials === 'number' &&
    typeof billObj.discountAmountRials === 'number' &&
    typeof billObj.newTotalAmountRials === 'number';
};

const isValidValidationResponse = (response: unknown): response is ValidateDiscountCodeResponse => {
  if (response === null || typeof response !== 'object') return false;
  
  const responseObj = response as Record<string, unknown>;
  
  return 'isValid' in responseObj && 
    'discountAmountRials' in responseObj &&
    'newTotalAmountRials' in responseObj &&
    typeof responseObj.isValid === 'boolean' && 
    typeof responseObj.discountAmountRials === 'number' &&
    typeof responseObj.newTotalAmountRials === 'number';
};

// Initial state
const initialState: DiscountState = {
  currentValidation: null,
  appliedDiscountCode: null,
  isLoading: false,
  error: null,
};

// Discount slice
const discountsSlice = createSlice({
  name: 'discounts',
  initialState,
  reducers: {
    // Validation actions
    setCurrentValidation: (state, action: PayloadAction<ValidateDiscountCodeResponse | null>) => {
      if (action.payload === null || isValidValidationResponse(action.payload)) {
        state.currentValidation = action.payload;
        state.error = null;
        
        // Update applied discount code if validation is successful
        if (action.payload?.isValid && action.payload.discountCode?.code) {
          state.appliedDiscountCode = action.payload.discountCode.code;
        }
      } else {
        state.error = 'Invalid discount validation data received';
      }
    },

    clearCurrentValidation: (state) => {
      state.currentValidation = null;
      state.error = null;
    },

    // Applied discount code actions
    setAppliedDiscountCode: (state, action: PayloadAction<string | null>) => {
      state.appliedDiscountCode = action.payload;
      if (!action.payload) {
        state.currentValidation = null;
      }
    },

    clearAppliedDiscountCode: (state) => {
      state.appliedDiscountCode = null;
      state.currentValidation = null;
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
    resetDiscountsState: () => initialState,

    // Optimistic updates
    updateDiscountValidationOptimistically: (state, action: PayloadAction<{ isValid: boolean; discountAmount: number }>) => {
      if (state.currentValidation) {
        state.currentValidation.isValid = action.payload.isValid;
        state.currentValidation.discountAmountRials = action.payload.discountAmount;
        state.currentValidation.newTotalAmountRials = 
          (state.currentValidation.bill?.originalTotalAmountRials || 0) - action.payload.discountAmount;
      }
    },

    // Discount code specific actions
    setDiscountCode: (state, action: PayloadAction<DiscountCodeInfo | null>) => {
      if (action.payload === null || isValidDiscountCode(action.payload)) {
        if (state.currentValidation) {
          state.currentValidation.discountCode = action.payload || undefined;
        }
        state.error = null;
      } else {
        state.error = 'Invalid discount code data received';
      }
    },

    setBillWithDiscount: (state, action: PayloadAction<BillWithDiscountInfo | null>) => {
      if (action.payload === null || isValidBillWithDiscount(action.payload)) {
        if (state.currentValidation) {
          state.currentValidation.bill = action.payload || undefined;
        }
        state.error = null;
      } else {
        state.error = 'Invalid bill with discount data received';
      }
    },
  },
});

// Export actions
export const {
  setCurrentValidation,
  clearCurrentValidation,
  setAppliedDiscountCode,
  clearAppliedDiscountCode,
  setLoading,
  setError,
  clearError,
  resetDiscountsState,
  updateDiscountValidationOptimistically,
  setDiscountCode,
  setBillWithDiscount,
} = discountsSlice.actions;

// Export reducer
export const discountsReducer = discountsSlice.reducer;
export default discountsReducer;
