// src/store/bills/bills.types.ts
// Bill types - re-exported from Api.ts to maintain consistency

import { 
  BillDto,
  BillDetailDto,
  BillItemDto,
  PaymentDto,
  RefundDto,
  DiscountValidationItemDto,
  DiscountValidationDto,
} from '@/src/services/Api';
import { ApplicationResult } from '../api/api.types';
export type DiscountValidation = DiscountValidationDto;
// Re-export API types
export type Bill = BillDto;
export type BillDetail = BillDetailDto;
export type BillItem = BillItemDto;
export type Payment = PaymentDto; 
export type Refund = RefundDto;

/**
 * Get bills request matching backend API
 */
export interface GetBillsRequest {
  pageNumber?: number;
  pageSize?: number;
  billType?: string;
  billStatus?: string;
  status?: string;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: string;
}

/**
 * Issue bill request
 */
export interface IssueBillRequest {
  autoIssueBill?: boolean;
}


/**
 * Cancel bill request
 */
export interface CancelBillRequest {
  reason?: string;
}

/**
 * Cancel bill response
 */
export interface CancelBillResponse {
  billId?: string;
  status?: string | null;
  cancellationReason?: string | null;
}

/**
 * Re-export issue and cancel bill responses with proper structure
 */
export interface IssueBillResponseData {
  billId?: string;
  billNumber?: string | null;
  status?: string | null;
  issueDate?: string;
  totalAmount?: number;
}

export interface CancelBillResponseData {
  billId?: string; 
  status?: string | null;
  cancellationReason?: string | null;
}

/**
 * Issue bill response
 */
export interface IssueBillResponse {
  billId?: string;
  billNumber?: string | null;
  status?: string | null;
  issueDate?: string;
  totalAmount?: number;
}


/**
 * Bill Paginated Result Response
 */
export type GetUserBillsResponse = ApplicationResult<BillPaginatedResult>;

/**
 * Bill Detail Response  
 */
export type GetBillDetailResponse = ApplicationResult<BillDetail>;

/**
 * Issue Bill Response
 */
export type IssueBillResponseWrapper = ApplicationResult<IssueBillResponse>;

/**
 * Cancel Bill Response
 */
export type CancelBillResponseWrapper = ApplicationResult<CancelBillResponse>;

/**
 * Bill status types
 */
export type BillStatus = 
  | 'draft'
  | 'issued'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'overdue';

export type BillType = 
  | 'utility'
  | 'service'
  | 'purchase'
  | 'subscription'
  | 'other';

/**
 * Bill filters
 */
export interface BillFilters {
  billType?: BillType;
  billStatus?: BillStatus;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
}




/**
 * Bill Paginated Result
 */
export interface BillPaginatedResult {
  items: Bill[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/**
 * BillState for Redux store
 * This represents the complete state structure used by the bills slice and selectors
 */
export interface BillState {
  // List of all bills
  bills: Bill[];
  
  // Currently selected bill
  currentBill: Bill | null;
  
 
  // Pagination information
  pagination: {
    bills: {
      pageNumber: number;
      pageSize: number;
      totalPages: number;
    };
  };
  
  // Loading state
  isLoading: boolean;
  
  // Error message
  error: string | null;
}

/**
 * Extended Bill interface with additional computed fields
 * (These fields are computed in the slice/selectors but may not be in the API DTO)
 */
export interface ExtendedBill extends Bill {
  // Additional fields that may be computed or transformed
  billTotalAmount?: number;
  billPaidAmount?: number;
  billRemainingAmount?: number;
  isBillFullyPaid?: boolean;
  billFullyPaidDate?: string;
  billStatus?: BillStatus;
  billDueDate?: string;
  updatedAt?: string;
}