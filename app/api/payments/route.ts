// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { CreatePaymentRequest, CreatePaymentResponseWrapper } from '@/src/store/payments';
import { AxiosError } from 'axios';

export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Parse request body
    const requestBody: CreatePaymentRequest = await req.json();
    console.log('requestBody', requestBody);

    // Call the upstream API to create payment
    const upstream = await api.api.createPayment({
      billId: requestBody.billId,
      amountRials: requestBody.amountRials,
      paymentMethod: requestBody.paymentMethod,
      paymentGateway: requestBody.paymentGateway,
      callbackUrl: requestBody.callbackUrl,
      description: requestBody.description,
      expiryDate: requestBody.expiryDate,
      autoIssueBill: requestBody.autoIssueBill,
      discountCode: requestBody.discountCode,
      allowOverDiscount: requestBody.allowOverDiscount,
      skipPaymentIfZero: requestBody.skipPaymentIfZero,
    });
    const status = upstream.status ?? 200;

    // Map backend response to frontend CreatePaymentResponse type
    const backendData = upstream.data?.data;

    console.log('upstream', upstream.data);
    const frontendPayment = backendData ? {
      paymentId: backendData.paymentId || '',
      billId: backendData.billId || '',
      billNumber: backendData.billNumber || undefined,
      amount: backendData.amount || 0,
      paymentMethod: backendData.paymentMethod || undefined,
      status: backendData.status || undefined,
      createdAt: backendData.createdAt || new Date().toISOString(),
      expiryDate: backendData.expiryDate || undefined,
      gatewayRedirectUrl: backendData.gatewayRedirectUrl || undefined,
      billStatus: backendData.billStatus || undefined,
      billTotalAmount: backendData.billTotalAmount || 0,
      itemsAdded: backendData.itemsAdded || 0,
      billWasIssued: backendData.billWasIssued || false,
      trackingNumber: backendData.trackingNumber || undefined,
      requiresRedirect: backendData.requiresRedirect || false,
      paymentMessage: backendData.paymentMessage || undefined,
      paymentGateway: backendData.paymentGateway || undefined,
      appliedDiscountCode: backendData.appliedDiscountCode || undefined,
      appliedDiscountAmount: backendData.appliedDiscountAmount || 0,
      originalBillAmount: backendData.originalBillAmount || 0,
      finalBillAmount: backendData.finalBillAmount || 0,
      isFreePayment: backendData.isFreePayment || false,
      paymentSkipped: backendData.paymentSkipped || false,
    } : null;

    // Strongly typed response structure
    const response: CreatePaymentResponseWrapper = {
      result: frontendPayment,
      errors: upstream.data?.errors || null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Create payment BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
      console.log((error as AxiosError).response?.data);
    return handleApiError(error as AxiosError, req);
  }
}
