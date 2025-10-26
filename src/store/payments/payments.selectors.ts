// src/store/payments/payments.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { PaymentState } from './payments.types';

// Base selector for payment state
const selectPaymentState = (state: RootState): PaymentState => state.payments;

// Basic selectors
export const selectCurrentPayment = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.currentPayment
);

export const selectPaymentGateways = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.paymentGateways
);

export const selectPaymentsLoading = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.isLoading
);

export const selectPaymentsError = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.error
);

// Computed selectors for current payment
export const selectPaymentId = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.paymentId || null
);

export const selectPaymentBillId = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.billId || null
);

export const selectPaymentAmount = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.amount || 0
);

export const selectPaymentStatus = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.status || null
);

export const selectPaymentMethod = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.paymentMethod || null
);

export const selectPaymentGateway = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.paymentGateway || null
);

export const selectGatewayRedirectUrl = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.gatewayRedirectUrl || null
);

export const selectRequiresRedirect = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.requiresRedirect || false
);

export const selectIsFreePayment = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.isFreePayment || false
);

export const selectPaymentSkipped = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.paymentSkipped || false
);

export const selectAppliedDiscountCode = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.appliedDiscountCode || null
);

export const selectAppliedDiscountAmount = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.appliedDiscountAmount || 0
);

export const selectOriginalBillAmount = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.originalBillAmount || 0
);

export const selectFinalBillAmount = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.finalBillAmount || 0
);

export const selectPaymentMessage = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.paymentMessage || null
);

// Computed selectors for payment gateways
export const selectActivePaymentGateways = createSelector(
  [selectPaymentGateways],
  (gateways) => gateways.filter(gateway => gateway.isActive)
);

export const selectPaymentGatewayById = createSelector(
  [selectPaymentGateways, (_: RootState, gatewayId: string) => gatewayId],
  (gateways, gatewayId) => gateways.find(gateway => gateway.gatewayId === gatewayId)
);

export const selectPaymentGatewayByName = createSelector(
  [selectPaymentGateways, (_: RootState, gatewayName: string) => gatewayName],
  (gateways, gatewayName) => gateways.find(gateway => gateway.gatewayName === gatewayName)
);

export const selectPaymentGatewaysByType = createSelector(
  [selectPaymentGateways, (_: RootState, gatewayType: string) => gatewayType],
  (gateways, gatewayType) => gateways.filter(gateway => gateway.gatewayType === gatewayType)
);

export const selectSupportedPaymentMethods = createSelector(
  [selectActivePaymentGateways],
  (gateways) => {
    const methods = new Set<string>();
    gateways.forEach(gateway => {
      gateway.supportedMethods.forEach(method => methods.add(method));
    });
    return Array.from(methods);
  }
);

// Payment status selectors
export const selectIsPaymentPending = createSelector(
  [selectPaymentStatus],
  (status) => status === 'pending'
);

export const selectIsPaymentProcessing = createSelector(
  [selectPaymentStatus],
  (status) => status === 'processing'
);

export const selectIsPaymentCompleted = createSelector(
  [selectPaymentStatus],
  (status) => status === 'completed'
);

export const selectIsPaymentFailed = createSelector(
  [selectPaymentStatus],
  (status) => status === 'failed'
);

export const selectIsPaymentCancelled = createSelector(
  [selectPaymentStatus],
  (status) => status === 'cancelled'
);

export const selectIsPaymentExpired = createSelector(
  [selectPaymentStatus],
  (status) => status === 'expired'
);

export const selectIsPaymentRefunded = createSelector(
  [selectPaymentStatus],
  (status) => status === 'refunded'
);

// Payment flow selectors
export const selectCanProceedToPayment = createSelector(
  [selectCurrentPayment, selectPaymentGateways],
  (payment, gateways) => {
    if (!payment) return false;
    if (payment.isFreePayment || payment.paymentSkipped) return true;
    if (!payment.paymentMethod) return false;
    return gateways.some(gateway => 
      gateway.isActive && 
      gateway.supportedMethods.includes(payment.paymentMethod!)
    );
  }
);

export const selectNeedsRedirect = createSelector(
  [selectRequiresRedirect, selectGatewayRedirectUrl],
  (requiresRedirect, redirectUrl) => requiresRedirect && !!redirectUrl
);

export const selectPaymentSummary = createSelector(
  [selectCurrentPayment],
  (payment) => {
    if (!payment) return null;
    
    return {
      paymentId: payment.paymentId,
      billId: payment.billId,
      amount: payment.amount,
      status: payment.status,
      method: payment.paymentMethod,
      gateway: payment.paymentGateway,
      requiresRedirect: payment.requiresRedirect,
      redirectUrl: payment.gatewayRedirectUrl,
      isFree: payment.isFreePayment,
      skipped: payment.paymentSkipped,
      discountCode: payment.appliedDiscountCode,
      discountAmount: payment.appliedDiscountAmount,
      originalAmount: payment.originalBillAmount,
      finalAmount: payment.finalBillAmount,
      message: payment.paymentMessage,
    };
  }
);

// Error handling selectors
export const selectHasPaymentError = createSelector(
  [selectPaymentsError],
  (error) => !!error
);

export const selectPaymentErrorMessage = createSelector(
  [selectPaymentsError],
  (error) => error || ''
);

// Loading state selectors
export const selectIsPaymentLoading = createSelector(
  [selectPaymentsLoading],
  (loading) => loading
);

export const selectIsPaymentIdle = createSelector(
  [selectPaymentsLoading, selectPaymentsError],
  (loading, error) => !loading && !error
);
