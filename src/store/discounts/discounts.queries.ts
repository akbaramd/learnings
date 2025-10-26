// src/store/discounts/discounts.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  ValidateDiscountCodeRequest,
  ValidateDiscountCodeResponseWrapper,
} from './discounts.types';
import {
  setCurrentValidation,
  setAppliedDiscountCode,
  setError,
  setLoading,
} from './discounts.slice';

// Error handling utility
export const handleDiscountsApiError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as Record<string, unknown>;
    if (apiError?.data && typeof apiError.data === 'object') {
      const data = apiError.data as Record<string, unknown>;
      if (Array.isArray(data.errors) && data.errors[0]) {
        return String(data.errors[0]);
      }
      if (data.message) {
        return String(data.message);
      }
    }
    if (apiError.message) {
      return String(apiError.message);
    }
  }
  return 'An unexpected error occurred';
};

// Discounts API slice
export const discountsApi = createApi({
  reducerPath: 'discountsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/discount-codes',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['DiscountValidation'],
  endpoints: (builder) => ({
    // Validate discount code
    validateDiscountCode: builder.mutation<ValidateDiscountCodeResponseWrapper, ValidateDiscountCodeRequest>({
      query: (validationData) => ({
        url: '/validate',
        method: 'POST',
        body: validationData,
      }),
      invalidatesTags: ['DiscountValidation'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          if (data.result) {
            dispatch(setCurrentValidation(data.result));
            
            // Set applied discount code if validation is successful
            if (data.result.isValid && data.result.discountCode?.code) {
              dispatch(setAppliedDiscountCode(data.result.discountCode.code));
            } else {
              dispatch(setAppliedDiscountCode(null));
            }
          } else if (data.errors) {
            dispatch(setError(data.errors[0] || 'Failed to validate discount code'));
            dispatch(setAppliedDiscountCode(null));
          }
        } catch (error) {
          dispatch(setError(handleDiscountsApiError(error)));
          dispatch(setAppliedDiscountCode(null));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useValidateDiscountCodeMutation,
} = discountsApi;

// Export the API slice
export default discountsApi;
