// src/store/payments/payments.types.ts
// Payment-related types for frontend

// Payment API Types
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

// Payment State Types
export interface PaymentState {
  currentPayment: CreatePaymentResponse | null;
  paymentGateways: PaymentGatewayInfo[];
  isLoading: boolean;
  error: string | null;
}
