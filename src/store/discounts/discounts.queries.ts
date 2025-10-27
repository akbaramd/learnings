// src/store/discounts/discounts.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  ValidateDiscountCodeRequest,
  ValidateDiscountCodeResponseWrapper,
  ValidateDiscountCodeResponse,
} from './discounts.types';
import {
  setCurrentValidation,
  setAppliedDiscountCode,
  setError,
  setLoading,
  clearError,
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
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          // Handle ApplicationResult response
          if (data?.data) {
            dispatch(setCurrentValidation(data.data as ValidateDiscountCodeResponse));
            
            // Set applied discount code if validation is successful
            if (data.data.isValid && data.data.discountCode?.code) {
              dispatch(setAppliedDiscountCode(data.data.discountCode.code));
            } else {
              dispatch(setAppliedDiscountCode(null));
            }
          } else if (data?.errors && data.errors.length > 0) {
            dispatch(setError(data.errors[0]));
            dispatch(setAppliedDiscountCode(null));
          }
        } catch (error) {
          const errorMessage = handleDiscountsApiError(error);
          dispatch(setError(errorMessage));
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
