// src/store/members/members.queries.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';
import {
  GetCurrentMemberResponse,
  SyncCurrentMemberResponse,
  SyncCurrentMemberRequest,
} from './members.types';
import {
  setCurrentMember,
  setLoading,
  setError,
  clearError,
  setLastSynced,
} from './members.slice';

// Error handling utility
export const handleMembersApiError = (error: unknown): string => {
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

// Members API slice
export const membersApi = createApi({
  reducerPath: 'membersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Member'],
  // Add proper caching configuration
  keepUnusedDataFor: 300, // Keep data for 5 minutes
  refetchOnMountOrArgChange: false, // Don't refetch on mount
  refetchOnFocus: false, // Don't refetch on window focus
  refetchOnReconnect: true, // Refetch when reconnecting
  endpoints: (builder) => ({
    // Get current member - Returns GetCurrentMemberResponse
    getCurrentMember: builder.query<GetCurrentMemberResponse, void>({
      query: () => ({
        url: '/members/me/member',
        method: 'GET',
      }),
      providesTags: ['Member'],
      keepUnusedDataFor: 300,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.isSuccess && data.data) {
            dispatch(setCurrentMember(data.data));
          } else if (data?.errors && data.errors.length > 0) {
            dispatch(setError(data.errors[0]));
          } else if (data?.message) {
            dispatch(setError(data.message));
          }
        } catch (error) {
          const errorMessage = handleMembersApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Sync current member - Returns SyncCurrentMemberResponse
    syncCurrentMember: builder.mutation<SyncCurrentMemberResponse, SyncCurrentMemberRequest | void>({
      query: (request = {}) => ({
        url: '/members/me/member/sync',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Member'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.isSuccess && data.data) {
            dispatch(setCurrentMember(data.data));
            dispatch(setLastSynced(new Date().toISOString()));
          } else if (data?.errors && data.errors.length > 0) {
            dispatch(setError(data.errors[0]));
          } else if (data?.message) {
            dispatch(setError(data.message));
          }
        } catch (error) {
          const errorMessage = handleMembersApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetCurrentMemberQuery,
  useSyncCurrentMemberMutation,
  useLazyGetCurrentMemberQuery,
} = membersApi;

export default membersApi;

