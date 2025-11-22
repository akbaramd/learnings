import {
  TourWithUserReservationDto,
  TourBriefDto,
  TourDetailWithUserReservationDto,
  ReservationDetailDto,
  TourReservationPricingResponse,
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
  TourReservationPricingResponseApplicationResult,
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
  TourReservationPricingResponse,
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

export type GetReservationPricingResponse = TourReservationPricingResponseApplicationResult;

export type StartReservationResponse = StartReservationCommandResultApplicationResult;

export type AddGuestToReservationResponseWrapper = AddGuestToReservationResponseApplicationResult;

export type RemoveGuestFromReservationResponseWrapper = RemoveGuestFromReservationResponseApplicationResult;

export type FinalizeReservationResponse = FinalizeReservationResponseApplicationResult;

export type ReactivateReservationResponse = ReactivateReservationResponseApplicationResult;

// Reservations paginated types
import { TourReservationDtoPaginatedResultApplicationResult, TourReservationDto } from '@/src/services/Api';

export type GetReservationsPaginatedResponse = TourReservationDtoPaginatedResultApplicationResult;

export interface GetReservationsPaginatedRequest {
  pageNumber: number;
  pageSize: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

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
  reservationsList: TourReservationDto[]; // Paginated reservations list
  selectedReservation: ReservationDetailDto | null;
  pagination: PaginationInfo | null;
  reservationsPagination: PaginationInfo | null; // Pagination for reservations list
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}