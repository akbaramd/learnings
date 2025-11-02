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
  (payment) => payment?.amountRials || 0
);

export const selectPaymentStatus = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.status || null
);

export const selectPaymentMethod = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.method || null
);

export const selectPaymentGateway = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.gateway || null
);


export const selectIsFreePayment = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.isFreePayment || false
);


export const selectAppliedDiscountCode = createSelector(
  [selectCurrentPayment],
  (payment) => payment?.appliedDiscountCode || null
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
