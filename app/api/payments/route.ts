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

    const d = upstream.data?.data;

    // If upstream indicates failure, propagate errors/message in wrapper
    const isSuccess = upstream.data?.isSuccess ?? true;
    if (!isSuccess) {
      const allErrors = [
        ...(Array.isArray(upstream.data?.errors) ? upstream.data.errors : []),
        ...(upstream.data?.message ? [upstream.data.message] : []),
      ];
      const response: CreatePaymentResponseWrapper = {
        result: null,
        errors: allErrors.length > 0 ? allErrors : null,
      };
      const res = NextResponse.json(response, { status });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      const setCookieFail = upstream.headers?.['set-cookie'];
      if (setCookieFail) {
        if (Array.isArray(setCookieFail)) setCookieFail.forEach((c) => res.headers.append('set-cookie', c));
        else res.headers.set('set-cookie', setCookieFail as string);
      }
      return res;
    }
 
    const mappedResult = d
      ? {
          paymentId: d.paymentId,
          billId: d.billId,
          billNumber: d.billNumber ?? undefined,
          amount: d.amount ?? undefined,
          paymentMethod: d.paymentMethod ?? undefined,
          status: d.status ?? undefined,
          createdAt: d.createdAt ?? undefined,
          expiryDate: d.expiryDate ?? undefined,
          gatewayRedirectUrl: d.gatewayRedirectUrl ?? undefined,
          billStatus: d.billStatus ?? undefined,
          billTotalAmount: d.billTotalAmount ?? undefined,
          itemsAdded: d.itemsAdded ?? undefined,
          billWasIssued: d.billWasIssued ?? undefined,
          trackingNumber: d.trackingNumber ?? undefined,
          requiresRedirect: d.requiresRedirect ?? undefined,
          paymentMessage: d.paymentMessage ?? undefined,
          paymentGateway: d.paymentGateway ?? undefined,
          appliedDiscountCode: d.appliedDiscountCode ?? undefined,
          appliedDiscountAmount: d.appliedDiscountAmount ?? undefined,
          originalBillAmount: d.originalBillAmount ?? undefined,
          finalBillAmount: d.finalBillAmount ?? undefined,
          isFreePayment: d.isFreePayment ?? undefined,
          paymentSkipped: d.paymentSkipped ?? undefined,
          paymentStatus: d.paymentStatus ?? undefined,
        }
      : null;
  
    const response: CreatePaymentResponseWrapper = {
      result: mappedResult,
      errors: upstream.data?.errors || null,
    };

    const res = NextResponse.json(response, { status });

    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach((c) => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('Create payment BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    console.log((error as AxiosError).response?.data);
    return handleApiError(error as AxiosError);
  }
}
