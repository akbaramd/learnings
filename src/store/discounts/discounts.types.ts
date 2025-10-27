// src/store/discounts/discounts.types.ts
// Discount code-related types for frontend

import { 
  DiscountCodeSnapshotDto,
  BillDiscountSnapshotDto,
  DiscountValidationItemDto,
  DiscountValidationDto,
} from '@/src/services/Api';
import { ApplicationResult } from '../api/api.types';

// Re-export API types
export type DiscountCodeInfo = DiscountCodeSnapshotDto;
export type BillWithDiscountInfo = BillDiscountSnapshotDto;
export type DiscountValidationItemSummary = DiscountValidationItemDto;

export type DiscountValidation = DiscountValidationDto;
/**
 * Validate discount code request
 */
export interface ValidateDiscountCodeRequest {
  billId: string;
  discountCode: string;
}


/**
 * Validate discount code response (maps to DiscountValidationDto)
 */
export interface ValidateDiscountCodeResponse extends DiscountValidationDto {
  isValid?: boolean;
  errors?: string[] | null;
  bill?: BillWithDiscountInfo;
  discountCode?: DiscountCodeInfo;
  discountAmountRials?: number;
  newTotalAmountRials?: number;
  discountPercentage?: number | null;
  isPercentageDiscount?: boolean;
  isFixedAmountDiscount?: boolean;
}


/**
 * Validate discount code response wrapper
 */
export type ValidateDiscountCodeResponseWrapper = ApplicationResult<ValidateDiscountCodeResponse>;

// Discount State Types
export interface DiscountState {
  currentValidation: ValidateDiscountCodeResponse | null;
  appliedDiscountCode: string | null;
  isLoading: boolean;
  error: string | null;
}
