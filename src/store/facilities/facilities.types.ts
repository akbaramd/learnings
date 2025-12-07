import {
  FacilityDto,
  FacilityDetailsDto,
  FacilityCycleWithUserDto,
  FacilityCycleWithUserDetailDto,
  FacilityRequestDto,
  FacilityRequestDetailsDto,
  GetFacilitiesResultApplicationResult,
  GetFacilityCyclesWithUserQueryResponseApplicationResult,
  GetFacilityRequestsByUserQueryResultApplicationResult,
  FacilityDetailsDtoApplicationResult,
  FacilityCycleWithUserDetailDtoApplicationResult,
  FacilityRequestDetailsDtoApplicationResult,
  CreateFacilityRequestResultApplicationResult,
  ApproveFacilityRequestResultApplicationResult,
  RejectFacilityRequestResultApplicationResult,
} from '@/src/services/Api';

// Re-export types from Api
export type {
  FacilityDto,
  FacilityDetailsDto,
  FacilityCycleWithUserDto,
  FacilityCycleWithUserDetailDto,
  FacilityRequestDto,
  FacilityRequestDetailsDto,
};

// Response wrappers matching BFF pattern
export type GetFacilitiesResponse = GetFacilitiesResultApplicationResult;
export type GetFacilityDetailsResponse = FacilityDetailsDtoApplicationResult;
export type GetFacilityCyclesResponse = GetFacilityCyclesWithUserQueryResponseApplicationResult;
export type GetFacilityCycleDetailsResponse = FacilityCycleWithUserDetailDtoApplicationResult;
export type GetFacilityRequestsResponse = GetFacilityRequestsByUserQueryResultApplicationResult;
export type GetFacilityRequestDetailsResponse = FacilityRequestDetailsDtoApplicationResult;
export type CreateFacilityRequestResponse = CreateFacilityRequestResultApplicationResult;
export type ApproveFacilityRequestResponse = ApproveFacilityRequestResultApplicationResult;
export type RejectFacilityRequestResponse = RejectFacilityRequestResultApplicationResult;

// Request types
export interface GetFacilitiesRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
}

export interface GetFacilityCyclesRequest {
  facilityId: string;
  page?: number;
  pageSize?: number;
  status?: string;
  searchTerm?: string;
  onlyActive?: boolean;
  onlyEligible?: boolean;
  onlyWithUserRequests?: boolean;
  includeUserRequestStatus?: boolean;
  includeDetailedRequestInfo?: boolean;
  includeStatistics?: boolean;
}

export interface GetFacilityCycleDetailsRequest {
  cycleId: string;
  includeFacilityInfo?: boolean;
  includeUserRequestHistory?: boolean;
  includeEligibilityDetails?: boolean;
  includeDependencies?: boolean;
  includeStatistics?: boolean;
}

export interface GetFacilityRequestsRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  searchTerm?: string;
  facilityId?: string;
  cycleId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateFacilityRequestRequest {
  facilityCycleId: string;
  priceOptionId: string;
  description?: string | null;
  metadata?: Record<string, string>;
  idempotencyKey?: string | null;
}

export interface ApproveFacilityRequestRequest {
  requestId: string;
  approvedAmountRials?: number;
  currency?: string;
  notes?: string;
  approverUserId?: string;
}

export interface RejectFacilityRequestRequest {
  requestId: string;
  reason?: string;
  rejectorUserId?: string;
}

export interface CancelFacilityRequestRequest {
  requestId: string;
  reason?: string;
  cancelledByUserId?: string;
}

// Pagination info
export interface PaginationInfo {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Facilities state
export interface FacilitiesState {
  // Facilities list
  facilities: FacilityDto[];
  selectedFacility: FacilityDetailsDto | null;
  facilitiesPagination: PaginationInfo | null;

  // Facility cycles
  cycles: FacilityCycleWithUserDto[];
  selectedCycle: FacilityCycleWithUserDetailDto | null;
  cyclesPagination: PaginationInfo | null;

  // Facility requests
  requests: FacilityRequestDto[];
  selectedRequest: FacilityRequestDetailsDto | null;
  requestsPagination: PaginationInfo | null;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

