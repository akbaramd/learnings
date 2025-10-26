// src/store/discounts/discounts.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { DiscountState } from './discounts.types';

// Base selector for discount state
const selectDiscountState = (state: RootState): DiscountState => state.discounts;

// Basic selectors
export const selectCurrentValidation = createSelector(
  [selectDiscountState],
  (discountState) => discountState.currentValidation
);

export const selectAppliedDiscountCode = createSelector(
  [selectDiscountState],
  (discountState) => discountState.appliedDiscountCode
);

export const selectDiscountsLoading = createSelector(
  [selectDiscountState],
  (discountState) => discountState.isLoading
);

export const selectDiscountsError = createSelector(
  [selectDiscountState],
  (discountState) => discountState.error
);

// Computed selectors for validation
export const selectIsDiscountValid = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.isValid || false
);

export const selectDiscountAmount = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.discountAmountRials || 0
);

export const selectNewTotalAmount = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.newTotalAmountRials || 0
);

export const selectDiscountPercentage = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.discountPercentage || 0
);

export const selectIsPercentageDiscount = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.isPercentageDiscount || false
);

export const selectIsFixedAmountDiscount = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.isFixedAmountDiscount || false
);

export const selectValidationErrors = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.errors || []
);

// Computed selectors for discount code
export const selectDiscountCode = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.discountCode || null
);

export const selectDiscountCodeId = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.discountCodeId || null
);

export const selectDiscountCodeTitle = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.title || null
);

export const selectDiscountCodeType = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.type || null
);

export const selectDiscountCodeValue = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.value || 0
);

export const selectDiscountCodeDescription = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.description || null
);

export const selectDiscountCodeStatus = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.status || null
);

export const selectDiscountCodeValidFrom = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.validFrom || null
);

export const selectDiscountCodeValidTo = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.validTo || null
);

export const selectDiscountCodeUsageLimit = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.usageLimit || null
);

export const selectDiscountCodeCurrentUsages = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.currentUsages || 0
);

export const selectDiscountCodeRemainingUsages = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.remainingUsages || 0
);

export const selectIsDiscountCodeExpired = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.isExpired || false
);

export const selectIsDiscountCodeDepleted = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.isDepleted || false
);

export const selectIsDiscountCodeActive = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.isActive || false
);

export const selectIsDiscountCodeSingleUse = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.isSingleUse || false
);

export const selectMinimumBillAmount = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.minimumBillAmountRials || null
);

export const selectMaximumDiscountAmount = createSelector(
  [selectDiscountCode],
  (discountCode) => discountCode?.maximumDiscountAmountRials || null
);

// Computed selectors for bill with discount
export const selectBillWithDiscount = createSelector(
  [selectCurrentValidation],
  (validation) => validation?.bill || null
);

export const selectBillId = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.billId || null
);

export const selectBillNumber = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.billNumber || null
);

export const selectBillTitle = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.title || null
);

export const selectBillType = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.billType || null
);

export const selectBillStatus = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.status || null
);

export const selectOriginalTotalAmount = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.originalTotalAmountRials || 0
);

export const selectBillDiscountAmount = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.discountAmountRials || 0
);

export const selectBillNewTotalAmount = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.newTotalAmountRials || 0
);

export const selectBillPaidAmount = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.paidAmountRials || 0
);

export const selectBillRemainingAmount = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.remainingAmountRials || 0
);

export const selectAppliedDiscountCodeId = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.appliedDiscountCodeId || null
);

export const selectHasAppliedDiscount = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.hasAppliedDiscount || false
);

export const selectCanApplyDiscount = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.canApplyDiscount || false
);

export const selectIsBillPaid = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.isPaid || false
);

export const selectIsBillPartiallyPaid = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.isPartiallyPaid || false
);

export const selectIsBillOverdue = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.isOverdue || false
);

export const selectIsBillCancelled = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.isCancelled || false
);

export const selectBillItems = createSelector(
  [selectBillWithDiscount],
  (bill) => bill?.items || []
);

// Discount validation summary
export const selectDiscountValidationSummary = createSelector(
  [selectCurrentValidation],
  (validation) => {
    if (!validation) return null;
    
    return {
      isValid: validation.isValid,
      errors: validation.errors || [],
      discountAmount: validation.discountAmountRials || 0,
      newTotalAmount: validation.newTotalAmountRials || 0,
      discountPercentage: validation.discountPercentage || 0,
      isPercentageDiscount: validation.isPercentageDiscount || false,
      isFixedAmountDiscount: validation.isFixedAmountDiscount || false,
      discountCode: validation.discountCode,
      bill: validation.bill,
    };
  }
);

// Discount code eligibility
export const selectIsDiscountCodeEligible = createSelector(
  [selectIsDiscountCodeActive, selectIsDiscountCodeExpired, selectIsDiscountCodeDepleted],
  (isActive, isExpired, isDepleted) => isActive && !isExpired && !isDepleted
);

export const selectCanUseDiscountCode = createSelector(
  [selectIsDiscountCodeEligible, selectDiscountCodeRemainingUsages],
  (isEligible, remainingUsages) => isEligible && remainingUsages > 0
);

// Error handling selectors
export const selectHasDiscountError = createSelector(
  [selectDiscountsError],
  (error) => !!error
);

export const selectDiscountErrorMessage = createSelector(
  [selectDiscountsError],
  (error) => error || ''
);

// Loading state selectors
export const selectIsDiscountLoading = createSelector(
  [selectDiscountsLoading],
  (loading) => loading
);

export const selectIsDiscountIdle = createSelector(
  [selectDiscountsLoading, selectDiscountsError],
  (loading, error) => !loading && !error
);
