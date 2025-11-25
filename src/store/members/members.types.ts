// src/store/members/members.types.ts
// Member types - re-exported from Api.ts to maintain consistency

import { UserDetailDto as ApiMemberDetailDto } from '@/src/services/Api';
import { ApplicationResult } from '@/src/store/api/api.types';

/**
 * Member Detail DTO - represents a detailed member entity
 * Extends UserDetailDto with additional member-specific fields
 */
export interface MemberDetailDto extends ApiMemberDetailDto {
  fullName?: string | null;
  membershipNumber?: string | null;
  email?: string | null;
  gender?: string | null;         // Gender: "Both", "Men", "Women"
  genderText?: string | null;      // Localized gender text
  isSpecial?: boolean;             // Special member status
  capabilityList?: Array<{ id?: string; title?: string | null }> | null;
  featureList?: Array<{ id?: string; title?: string | null }> | null;
  agencyList?: Array<{ id?: string; title?: string | null }> | null;
}

/**
 * Get current member response - uses MemberDetailDto
 */
export type GetCurrentMemberResponse = ApplicationResult<MemberDetailDto>;

/**
 * Sync current member response - uses MemberDetailDto
 */
export type SyncCurrentMemberResponse = ApplicationResult<MemberDetailDto>;

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

