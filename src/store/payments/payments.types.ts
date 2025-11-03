// src/store/payments/payments.types.ts
// Payment-related types for frontend

// Payment API Types
import {PaymentDetailDto} from "@/src/services/Api";

export interface CreatePaymentRequest {
  billId?: string;
  amountRials?: number;
  paymentMethod?: string;
  paymentGateway?: string;
  callbackUrl?: string;
  description?: string;
  expiryDate?: string;
  autoIssueBill?: boolean;
  discountCode?: string;
  allowOverDiscount?: boolean;
  skipPaymentIfZero?: boolean;
}

export interface CreatePaymentResponse {
  paymentId?: string;
  billId?: string;
  billNumber?: string;
  amount?: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  expiryDate?: string;
  gatewayRedirectUrl?: string;
  billStatus?: string;
  billTotalAmount?: number;
  itemsAdded?: number;
  billWasIssued?: boolean;
  trackingNumber?: number;
  requiresRedirect?: boolean;
  paymentMessage?: string;
  paymentGateway?: string;
  appliedDiscountCode?: string;
  appliedDiscountAmount?: number;
  originalBillAmount?: number;
  finalBillAmount?: number;
  isFreePayment?: boolean;
  paymentSkipped?: boolean;
}

export interface CreatePaymentResponseWrapper {
  result: CreatePaymentResponse | null;
  errors: string[] | null;
}

export interface PaymentGatewayInfo {
  gatewayId: string; // Maps to gateway
  gatewayName: string; // Maps to name
  gatewayType: string; // Maps to displayName
  isActive: boolean; // Maps to isEnabled
  supportedMethods: string[]; // Not available in API, will be empty array
  fees?: {
    fixedFee?: number; // Not available in API
    percentageFee?: number; // Not available in API
  };
  limits?: {
    minAmount?: number; // Maps to minAmount
    maxAmount?: number; // Maps to maxAmount
  };
}

export interface GetPaymentGatewaysResponse {
  gateways: PaymentGatewayInfo[];
}
export interface GetPaymentDetailWrapper {
    result: PaymentDetailDto | undefined;
    errors: string[] | null;
}

export interface GetPaymentGatewaysResponseWrapper {
  result: GetPaymentGatewaysResponse | null;
  errors: string[] | null;
}

export interface PayWithWalletRequest {
  billId: string;
  amountRials: number;
  description?: string;
}

export interface PayWithWalletResponse {
  paymentId: string;
  billId: string;
  amount: number; // Maps to amountPaidRials
  status: string; // Maps to paymentStatus
  createdAt: string; // Maps to processedAt
  billStatus: string;
  billTotalAmount: number; // Maps to billRemainingAmountRials
  remainingAmount: number; // Maps to billRemainingAmountRials
  isFullyPaid: boolean; // Calculated from billRemainingAmountRials === 0
  message?: string; // Maps to description
}

export interface PayWithWalletResponseWrapper {
  result: PayWithWalletResponse | null;
  errors: string[] | null;
}

// Payment Status Types
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded';

// Paginated Payments Types
import { PaymentDtoPaginatedResultApplicationResult, PaymentDto } from '@/src/services/Api';

export type GetPaymentsPaginatedResponse = PaymentDtoPaginatedResultApplicationResult;

export interface GetPaymentsPaginatedRequest {
  pageNumber: number;
  pageSize: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

// Bill Payments Types
export type GetBillPaymentsResponse = PaymentDtoPaginatedResultApplicationResult;

export interface GetBillPaymentsRequest {
  billId: string;
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: string;
}

// Payment State Types
export interface PaymentState {
  currentPayment: PaymentDetailDto | null;
  paymentGateways: PaymentGatewayInfo[];
  payments: PaymentDto[]; // List of payments for paginated view
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
}

// Pagination info
export interface PaginationInfo {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
