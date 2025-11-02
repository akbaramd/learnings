import {
  TourWithUserReservationDto,
  TourBriefDto,
  TourDetailWithUserReservationDto,
  ReservationDetailDto,
  ReservationPricingResponse,
  StartReservationRequest,
  GuestParticipantDto,
  ParticipantDto,
  ParticipantPricingDto,
  CapacitySummaryDto,
  AgencySummaryDto,
  FeatureSummaryDto,
  PhotoSummaryDto,
  PricingDetailDto,
  PriceSnapshotDto,
  TourWithUserReservationDtoPaginatedResultApplicationResult,
  TourDetailWithUserReservationDtoApplicationResult,
  ReservationDetailDtoApplicationResult,
  ReservationPricingResponseApplicationResult,
  StartReservationCommandResultApplicationResult,
  AddGuestToReservationResponseApplicationResult,
  RemoveGuestFromReservationResponseApplicationResult,
  FinalizeReservationResponseApplicationResult,
  ReactivateReservationResponseApplicationResult,
  CapacityDetailDto,
} from '@/src/services/Api';

// Re-export types from Api
export type {
  TourWithUserReservationDto,
  TourBriefDto,
  TourDetailWithUserReservationDto,
  ReservationDetailDto,
  ReservationPricingResponse,
  StartReservationRequest,
  GuestParticipantDto,
  ParticipantDto,
  ParticipantPricingDto,
  CapacitySummaryDto,
  CapacityDetailDto,
  AgencySummaryDto,
  FeatureSummaryDto,
  PhotoSummaryDto,
  PricingDetailDto,
  PriceSnapshotDto,
};

// Response wrappers matching BFF pattern - using types directly from Api
export type GetToursPaginatedResponse = TourWithUserReservationDtoPaginatedResultApplicationResult;

export type GetTourDetailResponse = TourDetailWithUserReservationDtoApplicationResult;

export type GetReservationDetailResponse = ReservationDetailDtoApplicationResult;

export type GetReservationPricingResponse = ReservationPricingResponseApplicationResult;

export type StartReservationResponse = StartReservationCommandResultApplicationResult;

export type AddGuestToReservationResponseWrapper = AddGuestToReservationResponseApplicationResult;

export type RemoveGuestFromReservationResponseWrapper = RemoveGuestFromReservationResponseApplicationResult;

export type FinalizeReservationResponse = FinalizeReservationResponseApplicationResult;

export type ReactivateReservationResponse = ReactivateReservationResponseApplicationResult;

// Request types
export interface GetToursPaginatedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

export interface StartReservationRequestWrapper {
  tourId: string;
  capacityId: string;
}

export interface AddGuestToReservationRequest {
  reservationId: string;
  guest: GuestParticipantDto;
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

// Tours state
export interface ToursState {
  items: TourWithUserReservationDto[];
  selectedTour: TourDetailWithUserReservationDto | null;
  reservations: ReservationDetailDto[];
  selectedReservation: ReservationDetailDto | null;
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}