import {
  AccommodationDto,
  AccommodationDetailsDto,
  AccommodationSummaryDto,
  ReservationDetailsDto,
  ReservationDto,
  ReservationPricingResponse,
  AddGuestBody,
  AddGuestToReservationResponse as AddGuestToReservationResponseDto,
  GuestDto,
  RoomDto,
  RoomSummaryDto,
  FeatureSummaryDto,
  PhotoSummaryDto,
  DailyPriceDto,
  PriceSnapshotDto,
  GetAccommodationsPaginatedResultApplicationResult,
  AccommodationDetailsDtoApplicationResult,
  ReservationDetailsDtoApplicationResult,
  ReservationPricingResponseApplicationResult,
  AddGuestToReservationResponseApplicationResult,
  ReservationDetailsDtoServiceResult,
  GetReservationsPaginatedResultApplicationResult,
  GetUserReservationsResultApplicationResult,
  GetRoomReservationsInDateRangeDtoApplicationResult,
  AccommodationType,
  ReservationStatus,
} from '@/src/services/Api';

// Re-export types from Api
export type {
  AccommodationDto,
  AccommodationDetailsDto,
  AccommodationSummaryDto,
  ReservationDetailsDto,
  ReservationDto,
  ReservationPricingResponse,
  AddGuestBody,
  AddGuestToReservationResponseDto as AddGuestToReservationResponseDto,
  GuestDto,
  RoomDto,
  RoomSummaryDto,
  FeatureSummaryDto,
  PhotoSummaryDto,
  DailyPriceDto,
  PriceSnapshotDto,
  AccommodationType,
  ReservationStatus,
};

// Response wrappers matching BFF pattern - using types directly from Api
export type GetAccommodationsPaginatedResponse = GetAccommodationsPaginatedResultApplicationResult;

export type GetAccommodationDetailResponse = AccommodationDetailsDtoApplicationResult;

export type GetReservationDetailResponse = ReservationDetailsDtoApplicationResult;

export type GetReservationPricingResponse = ReservationPricingResponseApplicationResult;

// Note: createReservation, addGuestToReservation, finalizeReservation, and pay return ReservationDetailsDtoServiceResult
// But BFF transforms it to ApplicationResult format
export interface CreateReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

export interface PayReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

export interface AddGuestToReservationResponseType {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

// Alias for BFF response
export type AddGuestToReservationResponse = AddGuestToReservationResponseType;

export interface SubmitReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

export interface RejectReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

export interface CancelReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

export interface RevertReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

export interface DeleteReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: void | null;
}

export interface FinalizeReservationResponse {
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailsDto | null;
}

export type GetReservationsPaginatedResponse = GetReservationsPaginatedResultApplicationResult;

export type GetUserReservationsResponse = GetUserReservationsResultApplicationResult;

export type GetRoomReservationsInDateRangeResponse = GetRoomReservationsInDateRangeDtoApplicationResult;

// Request types
export interface GetAccommodationsPaginatedRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  type?: AccommodationType;
  isActive?: boolean;
  provinceId?: string;
  cityId?: string;
  featureIds?: string[];
  minPriceRials?: number;
  maxPriceRials?: number;
}

export interface CreateReservationRequestType {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  memberId?: string | null;
  notes?: string | null;
  tenantId?: string | null;
}

// Alias for consistency
export type CreateReservationRequest = CreateReservationRequestType;

export interface AddGuestToReservationRequest {
  reservationId: string;
  guest: AddGuestBody;
}

export interface RemoveGuestFromReservationRequest {
  reservationId: string;
  guestId: string;
}

export interface GetReservationsPaginatedRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  status?: ReservationStatus;
  accommodationId?: string;
  roomId?: string;
  externalUserId?: string;
  checkInDateFrom?: string;
  checkInDateTo?: string;
  checkOutDateFrom?: string;
  checkOutDateTo?: string;
  reservationDateFrom?: string;
  reservationDateTo?: string;
  minPriceRials?: number;
  maxPriceRials?: number;
}

export interface GetUserReservationsRequest {
  accommodationId?: string;
  roomId?: string;
  status?: ReservationStatus;
  onlyActive?: boolean;
  onlyFuture?: boolean;
  onlyPast?: boolean;
}

export interface GetRoomReservationsInDateRangeRequest {
  roomId: string;
  startDate: string;
  endDate: string;
  onlyActive?: boolean;
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

// Accommodations state
export interface AccommodationsState {
  items: AccommodationDto[];
  selectedAccommodation: AccommodationDetailsDto | null;
  reservations: ReservationDetailsDto[];
  reservationsList: ReservationDto[]; // Paginated reservations list
  selectedReservation: ReservationDetailsDto | null;
  pagination: PaginationInfo | null;
  reservationsPagination: PaginationInfo | null; // Pagination for reservations list
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

