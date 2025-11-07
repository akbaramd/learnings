// src/store/members/members.types.ts
// Member types - re-exported from Api.ts to maintain consistency

import { UserDetailDto as ApiMemberDetailDto, UserDetailDtoApplicationResult } from '@/src/services/Api';

/**
 * Member Detail DTO - represents a detailed member entity
 * Re-exported from Api.ts to maintain consistency
 */
export type MemberDetailDto = ApiMemberDetailDto;

/**
 * Get current member response - uses MemberDetailDto
 */
export type GetCurrentMemberResponse = UserDetailDtoApplicationResult;

/**
 * Sync current member response - uses MemberDetailDto
 */
export type SyncCurrentMemberResponse = UserDetailDtoApplicationResult;

/**
 * Legacy MemberDto type alias for backward compatibility
 * @deprecated Use MemberDetailDto instead
 */
export type MemberDto = MemberDetailDto;

/**
 * Sync current member request (empty body for now, can be extended)
 */
export interface SyncCurrentMemberRequest {
  force?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Members state
 */
export interface MembersState {
  // Current member - uses MemberDetailDto
  currentMember: MemberDetailDto | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  lastSynced: string | null;
}

