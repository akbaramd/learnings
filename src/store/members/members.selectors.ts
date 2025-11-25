// src/store/members/members.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/src/store';
import { MembersState, MemberDetailDto } from './members.types';

// Select the members state
const selectMembersState = (state: RootState): MembersState => state.members;

// Select current member
export const selectCurrentMember = createSelector(
  [selectMembersState],
  (membersState): MemberDetailDto | null => membersState.currentMember
);

// Select member loading state
export const selectMembersLoading = createSelector(
  [selectMembersState],
  (membersState): boolean => membersState.isLoading
);

// Select member error
export const selectMembersError = createSelector(
  [selectMembersState],
  (membersState): string | null => membersState.error
);

// Select member gender
export const selectMemberGender = createSelector(
  [selectCurrentMember],
  (member): string | null | undefined => {
    // Check if gender exists in member data (it might be in the API response)
    return member && 'gender' in member ? (member as MemberDetailDto & { gender?: string | null }).gender : null;
  }
);

// Select member gender text
export const selectMemberGenderText = createSelector(
  [selectCurrentMember],
  (member): string | null | undefined => {
    return member && 'genderText' in member ? (member as MemberDetailDto & { genderText?: string | null }).genderText : null;
  }
);

// Select member agencies
export const selectMemberAgencies = createSelector(
  [selectCurrentMember],
  (member): Array<{ id?: string; title?: string | null }> | null => {
    return member?.agencyList || null;
  }
);

// Select member isSpecial status
export const selectMemberIsSpecial = createSelector(
  [selectCurrentMember],
  (member): boolean => {
    if (!member) return false;
    // Check if isSpecial exists and is true
    return member.isSpecial === true;
  }
);

// Select last fetched timestamp
export const selectMembersLastFetched = createSelector(
  [selectMembersState],
  (membersState): string | null => membersState.lastFetched
);

