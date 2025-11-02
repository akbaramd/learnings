// app/api/payments/gateways/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetPaymentGatewaysResponseWrapper } from '@/src/store/payments';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Call the upstream API to get supported payment gateways
    const upstream = await api.api.getSupportedPaymentGateways();
    const status = upstream.status ?? 200;

    // Map backend response to frontend GetPaymentGatewaysResponse type
    const backendGateways = upstream.data || [];
    const frontendGateways = backendGateways.map((gateway) => ({
      gatewayId: gateway.gateway || '',
      gatewayName: gateway.name || '',
      gatewayType: gateway.displayName || '',
      isActive: gateway.isEnabled || false,
      supportedMethods: [], // Not available in API
      fees: undefined, // Not available in API
      limits: {
        minAmount: gateway.minAmount || undefined,
        maxAmount: gateway.maxAmount || undefined,
      },
    }));

    // Strongly typed response structure
    const response: GetPaymentGatewaysResponseWrapper = {
      result: {
        gateways: frontendGateways
      },
      errors: null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Get payment gateways BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
