// app/api/discount-codes/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { ValidateDiscountCodeRequest, ValidateDiscountCodeResponseWrapper } from '@/src/store/discounts';
import { AxiosError } from 'axios';

export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Parse request body
    const requestBody: ValidateDiscountCodeRequest = await req.json();

    // Validate required fields
    if (!requestBody.billId || !requestBody.discountCode) {
      const errorResponse: ValidateDiscountCodeResponseWrapper = {
        result: null,
        errors: ['Bill ID and discount code are required']
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Call the upstream API to validate discount code
    const upstream = await api.api.validateDiscountCode({
      billId: requestBody.billId,
      discountCode: requestBody.discountCode,
    });
    const status = upstream.status ?? 200;

    // Map backend response to frontend ValidateDiscountCodeResponse type
    const backendData = upstream.data?.data;
    const frontendValidation = backendData ? {
      isValid: backendData.isValid || false,
      errors: backendData.errors || [],
      bill: backendData.bill ? {
        billId: backendData.bill.billId || '',
        billNumber: backendData.bill.billNumber || undefined,
        title: backendData.bill.title || undefined,
        referenceId: backendData.bill.referenceId || undefined,
        billType: backendData.bill.billType || undefined,
        status: backendData.bill.status || undefined,
        externalUserId: backendData.bill.externalUserId || undefined,
        userFullName: backendData.bill.userFullName || undefined,
        originalTotalAmountRials: backendData.bill.originalTotalAmountRials || 0,
        discountAmountRials: backendData.bill.discountAmountRials || 0,
        newTotalAmountRials: backendData.bill.newTotalAmountRials || 0,
        paidAmountRials: backendData.bill.paidAmountRials || 0,
        remainingAmountRials: backendData.bill.remainingAmountRials || 0,
        appliedDiscountCode: backendData.bill.appliedDiscountCode || undefined,
        appliedDiscountCodeId: backendData.bill.appliedDiscountCodeId || undefined,
        hasAppliedDiscount: backendData.bill.hasAppliedDiscount || false,
        issueDate: backendData.bill.issueDate || undefined,
        dueDate: backendData.bill.dueDate || undefined,
        fullyPaidDate: backendData.bill.fullyPaidDate || undefined,
        isPaid: backendData.bill.isPaid || false,
        isPartiallyPaid: backendData.bill.isPartiallyPaid || false,
        isOverdue: backendData.bill.isOverdue || false,
        isCancelled: backendData.bill.isCancelled || false,
        canApplyDiscount: backendData.bill.canApplyDiscount || false,
        items: backendData.bill.items?.map((item) => ({
          itemId: item.itemId || '',
          title: undefined, // Not available in DiscountValidationItemSummaryDto
          description: item.description || undefined,
          quantity: item.quantity || 0,
          unitPriceRials: item.unitPriceRials || 0,
          lineTotalRials: item.totalAmountRials || 0, // Using totalAmountRials instead of lineTotalRials
          discountAmountRials: 0, // Not available in DiscountValidationItemSummaryDto
          finalPriceRials: item.totalAmountRials || 0, // Using totalAmountRials instead of finalPriceRials
          referenceId: item.referenceId || undefined,
        })) || [],
      } : undefined,
      discountCode: backendData.discountCode ? {
        discountCodeId: backendData.discountCode.discountCodeId || undefined,
        code: backendData.discountCode.code || undefined,
        title: backendData.discountCode.title || undefined,
        type: backendData.discountCode.type || undefined,
        value: backendData.discountCode.value || 0,
        validFrom: backendData.discountCode.validFrom || undefined,
        validTo: backendData.discountCode.validTo || undefined,
        usageLimit: backendData.discountCode.usageLimit || undefined,
        currentUsages: backendData.discountCode.currentUsages || 0,
        isSingleUse: backendData.discountCode.isSingleUse || false,
        status: backendData.discountCode.status || undefined,
        description: backendData.discountCode.description || undefined,
        minimumBillAmountRials: backendData.discountCode.minimumBillAmountRials || undefined,
        maximumDiscountAmountRials: backendData.discountCode.maximumDiscountAmountRials || undefined,
        isExpired: backendData.discountCode.isExpired || false,
        isDepleted: backendData.discountCode.isDepleted || false,
        isActive: backendData.discountCode.isActive || false,
        remainingUsages: backendData.discountCode.remainingUsages || 0,
      } : undefined,
      discountAmountRials: backendData.discountAmountRials || 0,
      newTotalAmountRials: backendData.newTotalAmountRials || 0,
      discountPercentage: backendData.discountPercentage || undefined,
      isPercentageDiscount: backendData.isPercentageDiscount || false,
      isFixedAmountDiscount: backendData.isFixedAmountDiscount || false,
    } : null;

    // Strongly typed response structure
    const response: ValidateDiscountCodeResponseWrapper = {
      result: frontendValidation,
      errors: upstream.data?.errors || null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Validate discount code BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError, req);
  }
}
