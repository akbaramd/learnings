// src/store/members/index.ts
// Members store module exports

// Types
export * from './members.types';

// Redux slice
export { default as membersReducer } from './members.slice';
export * from './members.slice';

// RTK Query API
export { default as membersApi } from './members.queries';
export * from './members.queries';

// Re-export commonly used types for convenience
export type {
  MemberDetailDto,
  MemberDto, // Legacy alias for backward compatibility
  GetCurrentMemberResponse,
  SyncCurrentMemberResponse,
  SyncCurrentMemberRequest,
  MembersState,
} from './members.types';

// Re-export commonly used actions
export {
  setCurrentMember,
  updateCurrentMember,
  setLoading,
  setError,
  clearError,
  setLastSynced,
  clearCurrentMember,
  resetMemberState,
} from './members.slice';

// Re-export commonly used hooks
export {
  useGetCurrentMemberQuery,
  useSyncCurrentMemberMutation,
  useLazyGetCurrentMemberQuery,
} from './members.queries';

