// src/store/discounts/discounts.types.ts
// Discount code-related types for frontend

// Discount Code API Types
export interface ValidateDiscountCodeRequest {
  billId?: string;
  discountCode?: string;
}

export interface DiscountCodeInfo {
  discountCodeId?: string;
  code?: string;
  title?: string;
  type?: string;
  value?: number;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  currentUsages?: number;
  isSingleUse?: boolean;
  status?: string;
  description?: string;
  minimumBillAmountRials?: number;
  maximumDiscountAmountRials?: number;
  isExpired?: boolean;
  isDepleted?: boolean;
  isActive?: boolean;
  remainingUsages?: number;
}

export interface BillWithDiscountInfo {
  billId?: string;
  billNumber?: string;
  title?: string;
  referenceId?: string;
  billType?: string;
  status?: string;
  externalUserId?: string;
  userFullName?: string;
  originalTotalAmountRials?: number;
  discountAmountRials?: number;
  newTotalAmountRials?: number;
  paidAmountRials?: number;
  remainingAmountRials?: number;
  appliedDiscountCode?: string;
  appliedDiscountCodeId?: string;
  hasAppliedDiscount?: boolean;
  issueDate?: string;
  dueDate?: string;
  fullyPaidDate?: string;
  isPaid?: boolean;
  isPartiallyPaid?: boolean;
  isOverdue?: boolean;
  isCancelled?: boolean;
  canApplyDiscount?: boolean;
  items?: DiscountValidationItemSummary[];
}

export interface DiscountValidationItemSummary {
  itemId?: string;
  title?: string; // Not available in API, will be undefined
  description?: string;
  quantity?: number;
  unitPriceRials?: number;
  lineTotalRials?: number; // Maps to totalAmountRials from API
  discountAmountRials?: number; // Not available in API, will be 0
  finalPriceRials?: number; // Maps to totalAmountRials from API
  referenceId?: string;
}

export interface ValidateDiscountCodeResponse {
  isValid?: boolean;
  errors?: string[];
  bill?: BillWithDiscountInfo;
  discountCode?: DiscountCodeInfo;
  discountAmountRials?: number;
  newTotalAmountRials?: number;
  discountPercentage?: number;
  isPercentageDiscount?: boolean;
  isFixedAmountDiscount?: boolean;
}

export interface ValidateDiscountCodeResponseWrapper {
  result: ValidateDiscountCodeResponse | null;
  errors: string[] | null;
}

// Discount State Types
export interface DiscountState {
  currentValidation: ValidateDiscountCodeResponse | null;
  appliedDiscountCode: string | null;
  isLoading: boolean;
  error: string | null;
}
