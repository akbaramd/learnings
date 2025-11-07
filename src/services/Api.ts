/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum SettingType {
  String = "String",
  Integer = "Integer",
  Boolean = "Boolean",
  Decimal = "Decimal",
  DateTime = "DateTime",
  Json = "Json",
  Email = "Email",
  Url = "Url",
  PhoneNumber = "PhoneNumber",
  Color = "Color",
}

export enum ResultStatus {
  Success = "Success",
  BadRequest = "BadRequest",
  Unauthorized = "Unauthorized",
  Forbidden = "Forbidden",
  NotFound = "NotFound",
  Conflict = "Conflict",
  Gone = "Gone",
  ValidationFailed = "ValidationFailed",
  RateLimited = "RateLimited",
  InternalError = "InternalError",
}

export enum ReservationStatus {
  Draft = "Draft",
  Confirmed = "Confirmed",
  OnHold = "OnHold",
  Cancelled = "Cancelled",
  Expired = "Expired",
  SystemCancelled = "SystemCancelled",
  ProcessingFailed = "ProcessingFailed",
  CancellationProcessing = "CancellationProcessing",
  CancellationProcessed = "CancellationProcessed",
  Waitlisted = "Waitlisted",
  CancellationRequested = "CancellationRequested",
  AmendmentRequested = "AmendmentRequested",
  NoShow = "NoShow",
  Rejected = "Rejected",
}

export enum PaymentStatus {
  Pending = "Pending",
  Processing = "Processing",
  Completed = "Completed",
  PaidFromWallet = "PaidFromWallet",
  Failed = "Failed",
  Cancelled = "Cancelled",
  Expired = "Expired",
  Refunded = "Refunded",
}

export enum AutoSaveMode {
  Merge = "Merge",
  Overwrite = "Overwrite",
}

export interface ActiveSurveysResponse {
  surveys?: SurveyDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ActiveSurveysResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ActiveSurveysResponse;
}

export interface AddClaimsRequest {
  claimValues?: string[] | null;
}

export interface AddClaimsToUserCommand {
  /** @format uuid */
  userId?: string;
  claimValues?: string[] | null;
  notes?: string | null;
  /** @format uuid */
  assignedBy?: string | null;
  /** @format date-time */
  expiresAt?: string | null;
}

export interface AddGuestToReservationResponse {
  /** @format uuid */
  participantId?: string;
  /** @format uuid */
  reservationId?: string;
  /** @format uuid */
  capacityId?: string | null;
}

export interface AddGuestToReservationResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: AddGuestToReservationResponse;
}

export interface AddRoleToUserRequest {
  /** @format uuid */
  roleId?: string;
  /** @format date-time */
  expiresAt?: string | null;
  /** @format uuid */
  assignedBy?: string | null;
  notes?: string | null;
}

export interface AgencyDetailDto {
  /** @format uuid */
  agencyId?: string;
  agencyName?: string | null;
}

export interface AgencySummaryDto {
  /** @format uuid */
  agencyId?: string;
  agencyName?: string | null;
}

export interface AnswerQuestionRequest {
  textAnswer?: string | null;
  selectedOptionIds?: string[] | null;
  allowBackNavigation?: boolean;
}

export interface AnswerQuestionResponse {
  /** @format uuid */
  responseId?: string;
  /** @format uuid */
  questionId?: string;
  /** @format int32 */
  repeatIndex?: number;
  isAnswered?: boolean;
  isOverwritten?: boolean;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format int32 */
  answeredRepeatsForThisQuestion?: number;
  /** @format int32 */
  totalRepeatsAllowed?: number | null;
  /** @format double */
  completionPercentage?: number;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  message?: string | null;
  validationErrors?: string[] | null;
}

export interface AnswerQuestionResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: AnswerQuestionResponse;
}

export interface ApplicantInfoDto {
  /** @format uuid */
  memberId?: string;
  fullName?: string | null;
  nationalId?: string | null;
  isComplete?: boolean;
}

export interface ApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
}

export interface AppliedFilters {
  sectionName?: string | null;
  categoryName?: string | null;
  searchTerm?: string | null;
  type?: SettingType;
  onlyActive?: boolean;
  sortBy?: string | null;
  sortDescending?: boolean;
}

export interface ApproveFacilityRequestRequest {
  /** @format double */
  approvedAmountRials?: number;
  currency?: string | null;
  notes?: string | null;
  /** @format uuid */
  approverUserId?: string;
}

export interface ApproveFacilityRequestResult {
  /** @format uuid */
  requestId?: string;
  requestNumber?: string | null;
  status?: string | null;
  /** @format double */
  approvedAmountRials?: number;
  currency?: string | null;
  /** @format date-time */
  approvedAt?: string;
  /** @format uuid */
  approverUserId?: string;
}

export interface ApproveFacilityRequestResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ApproveFacilityRequestResult;
}

export interface AttemptSummary {
  /** @format uuid */
  responseId?: string;
  /** @format int32 */
  attemptNumber?: number;
  status?: string | null;
  /** @format date-time */
  startedAt?: string | null;
  /** @format date-time */
  submittedAt?: string | null;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format int32 */
  totalQuestions?: number;
  /** @format double */
  completionPercentage?: number;
}

export interface AutoSaveAnswerRequestDto {
  /** @format uuid */
  questionId?: string;
  textAnswer?: string | null;
  selectedOptionIds?: string[] | null;
}

export interface AutoSaveAnswersRequest {
  answers?: AutoSaveAnswerRequestDto[] | null;
  mode?: AutoSaveMode;
}

export interface AutoSaveAnswersResponse {
  /** @format int32 */
  savedCount?: number;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  invalids?: InvalidAnswerDto[] | null;
}

export interface AutoSaveAnswersResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: AutoSaveAnswersResponse;
}

export interface BalanceTrendPointDto {
  /** @format date-time */
  date?: string;
  /** @format double */
  balanceRials?: number;
  /** @format double */
  dailyChangeRials?: number;
}

export interface BankInfoDto {
  bankName?: string | null;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
  isAvailable?: boolean;
}

export interface BillDetailDto {
  /** @format uuid */
  id?: string;
  /** @format date-time */
  createdAt?: string;
  createdBy?: string | null;
  /** @format date-time */
  lastModifiedAt?: string | null;
  lastModifiedBy?: string | null;
  isDeleted?: boolean;
  /** @format date-time */
  deletedAt?: string | null;
  deletedBy?: string | null;
  billNumber?: string | null;
  title?: string | null;
  referenceTrackingCode?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  /** @format uuid */
  externalUserId?: string;
  userFullName?: string | null;
  status?: string | null;
  statusText?: string | null;
  /** @format double */
  totalAmountRials?: number;
  /** @format double */
  paidAmountRials?: number;
  /** @format double */
  remainingAmountRials?: number;
  /** @format double */
  discountAmountRials?: number | null;
  discountCode?: string | null;
  /** @format uuid */
  discountCodeId?: string | null;
  /** @format date-time */
  issueDate?: string;
  /** @format date-time */
  dueDate?: string | null;
  /** @format date-time */
  fullyPaidDate?: string | null;
  description?: string | null;
  metadata?: Record<string, string>;
  isPaid?: boolean;
  isPartiallyPaid?: boolean;
  isOverdue?: boolean;
  isCancelled?: boolean;
  /** @format double */
  paymentCompletionPercentage?: number;
  /** @format int64 */
  secondsUntilDue?: number | null;
  /** @format int64 */
  secondsOverdue?: number;
  /** @format int32 */
  itemsCount?: number;
  /** @format int32 */
  paymentsCount?: number;
  /** @format int32 */
  refundsCount?: number;
  items?: BillItemDto[] | null;
  payments?: PaymentDto[] | null;
  refunds?: RefundDto[] | null;
}

export interface BillDetailDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: BillDetailDto;
}

export interface BillDiscountSnapshotDto {
  /** @format uuid */
  billId?: string;
  billNumber?: string | null;
  title?: string | null;
  referenceId?: string | null;
  billType?: string | null;
  status?: string | null;
  statusText?: string | null;
  /** @format uuid */
  externalUserId?: string;
  userFullName?: string | null;
  /** @format double */
  originalTotalAmountRials?: number;
  /** @format double */
  paidAmountRials?: number;
  /** @format double */
  remainingAmountRials?: number;
  appliedDiscountCode?: string | null;
  /** @format uuid */
  appliedDiscountCodeId?: string | null;
  hasAppliedDiscount?: boolean;
  /** @format date-time */
  issueDate?: string;
  /** @format date-time */
  dueDate?: string | null;
  /** @format date-time */
  fullyPaidDate?: string | null;
  isPaid?: boolean;
  isPartiallyPaid?: boolean;
  isOverdue?: boolean;
  isCancelled?: boolean;
  canApplyDiscount?: boolean;
  items?: DiscountValidationItemDto[] | null;
}

export interface BillDto {
  /** @format uuid */
  id?: string;
  /** @format date-time */
  createdAt?: string;
  createdBy?: string | null;
  /** @format date-time */
  lastModifiedAt?: string | null;
  lastModifiedBy?: string | null;
  isDeleted?: boolean;
  /** @format date-time */
  deletedAt?: string | null;
  deletedBy?: string | null;
  billNumber?: string | null;
  title?: string | null;
  referenceTrackingCode?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  /** @format uuid */
  externalUserId?: string;
  userFullName?: string | null;
  status?: string | null;
  statusText?: string | null;
  /** @format double */
  totalAmountRials?: number;
  /** @format double */
  paidAmountRials?: number;
  /** @format double */
  remainingAmountRials?: number;
  /** @format double */
  discountAmountRials?: number | null;
  discountCode?: string | null;
  /** @format uuid */
  discountCodeId?: string | null;
  /** @format date-time */
  issueDate?: string;
  /** @format date-time */
  dueDate?: string | null;
  /** @format date-time */
  fullyPaidDate?: string | null;
  description?: string | null;
  metadata?: Record<string, string>;
  isPaid?: boolean;
  isPartiallyPaid?: boolean;
  isOverdue?: boolean;
  isCancelled?: boolean;
  /** @format double */
  paymentCompletionPercentage?: number;
  /** @format int64 */
  secondsUntilDue?: number | null;
  /** @format int64 */
  secondsOverdue?: number;
  /** @format int32 */
  itemsCount?: number;
  /** @format int32 */
  paymentsCount?: number;
  /** @format int32 */
  refundsCount?: number;
}

export interface BillDtoPaginatedResult {
  items?: BillDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface BillDtoPaginatedResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: BillDtoPaginatedResult;
}

export interface BillItemDto {
  /** @format uuid */
  itemId?: string;
  title?: string | null;
  description?: string | null;
  /** @format double */
  unitPriceRials?: number;
  /** @format int32 */
  quantity?: number;
  /** @format double */
  discountPercentage?: number | null;
  /** @format double */
  lineTotalRials?: number;
  /** @format date-time */
  createdAt?: string;
}

export interface BulkUpdateSettingsCommand {
  settingUpdates?: Record<string, string>;
  /** @format uuid */
  userId?: string;
  changeReason?: string | null;
}

export interface BulkUpdateSettingsResponse {
  /** @format int32 */
  totalProcessed?: number;
  /** @format int32 */
  successfullyUpdated?: number;
  /** @format int32 */
  failedToUpdate?: number;
  /** @format int32 */
  changeEventsCreated?: number;
  successfulUpdates?: SuccessfulUpdate[] | null;
  failedUpdates?: FailedUpdate[] | null;
  /** @format date-time */
  completedAt?: string;
}

export interface CancelBillRequest {
  reason?: string | null;
}

export interface CancelBillResponse {
  /** @format uuid */
  billId?: string;
  status?: string | null;
  cancellationReason?: string | null;
}

export interface CancelBillResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CancelBillResponse;
}

export interface CancelFacilityRequestRequest {
  reason?: string | null;
  /** @format uuid */
  cancelledByUserId?: string;
}

export interface CancelFacilityRequestResult {
  /** @format uuid */
  requestId?: string;
  requestNumber?: string | null;
  status?: string | null;
  reason?: string | null;
  /** @format date-time */
  cancelledAt?: string;
  /** @format uuid */
  cancelledByUserId?: string;
}

export interface CancelFacilityRequestResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CancelFacilityRequestResult;
}

export interface CancelResponseResponse {
  canceled?: boolean;
  isAbandoned?: boolean;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  message?: string | null;
}

export interface CancelResponseResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CancelResponseResponse;
}

export interface CapacityDetailDto {
  /** @format uuid */
  id?: string;
  /** @format date-time */
  registrationStart?: string;
  /** @format date-time */
  registrationEnd?: string;
  /** @format int32 */
  maxParticipants?: number;
  /** @format int32 */
  remainingParticipants?: number;
  /** @format int32 */
  allocatedParticipants?: number;
  /** @format int32 */
  minParticipantsPerReservation?: number;
  /** @format int32 */
  maxParticipantsPerReservation?: number;
  isActive?: boolean;
  isSpecial?: boolean;
  capacityState?: string | null;
  isRegistrationOpen?: boolean;
  isFullyBooked?: boolean;
  isNearlyFull?: boolean;
  description?: string | null;
}

export interface CapacitySummaryDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  tourId?: string;
  /** @format int32 */
  maxParticipants?: number;
  /** @format date-time */
  registrationStart?: string;
  /** @format date-time */
  registrationEnd?: string;
  isActive?: boolean;
  capacityState?: string | null;
  isRegistrationOpen?: boolean;
  isFullyBooked?: boolean;
  isNearlyFull?: boolean;
  description?: string | null;
}

export interface CategoryDetailDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
  /** @format int32 */
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryInfo {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
}

export interface CategoryWithSettingsDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
  /** @format int32 */
  displayOrder?: number;
  isActive?: boolean;
  settings?: SimpleSettingDto[] | null;
  /** @format int32 */
  settingCount?: number;
}

export interface ChangeReservationCapacityCommandResult {
  /** @format uuid */
  reservationId?: string;
  /** @format uuid */
  capacityId?: string;
}

export interface ChangeReservationCapacityCommandResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ChangeReservationCapacityCommandResult;
}

export interface ChangeReservationCapacityRequest {
  /** @format uuid */
  newCapacityId?: string;
}

export interface ClaimDto {
  type?: string | null;
  value?: string | null;
  valueType?: string | null;
}

export interface ClaimDtoIEnumerableApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ClaimDto[] | null;
}

export interface CommandProgressDto {
  /** @format int32 */
  answered?: number;
  /** @format int32 */
  total?: number;
  /** @format double */
  completionPercentage?: number;
}

export interface CooldownInfo {
  enabled?: boolean;
  /** @format int32 */
  seconds?: number;
  message?: string | null;
}

export interface CreateAgencyRequest {
  /**
   * @minLength 2
   * @maxLength 50
   */
  code: string;
  /**
   * @minLength 2
   * @maxLength 50
   */
  externalCode: string;
  /**
   * @minLength 2
   * @maxLength 200
   */
  name: string;
  /**
   * @minLength 5
   * @maxLength 500
   */
  address: string;
  /**
   * @minLength 0
   * @maxLength 100
   */
  managerName?: string | null;
  /**
   * @format tel
   * @minLength 0
   * @maxLength 20
   */
  managerPhone?: string | null;
  /** @format date-time */
  establishedDate?: string | null;
}

export interface CreateCategoryCommand {
  name?: string | null;
  description?: string | null;
  /** @format uuid */
  sectionId?: string;
  /** @format int32 */
  displayOrder?: number;
}

export interface CreateCategoryResponse {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
  /** @format uuid */
  sectionId?: string;
  /** @format int32 */
  displayOrder?: number;
  isActive?: boolean;
  /** @format date-time */
  createdAt?: string;
}

export interface CreateFacilityRequestCommand {
  /** @format uuid */
  facilityCycleId?: string;
  /** @format uuid */
  priceOptionId?: string;
  description?: string | null;
  metadata?: Record<string, string>;
  idempotencyKey?: string | null;
}

export interface CreateFacilityRequestResult {
  /** @format uuid */
  requestId?: string;
  requestNumber?: string | null;
  status?: string | null;
  /** @format double */
  requestedAmountRials?: number;
  currency?: string | null;
  /** @format date-time */
  createdAt?: string;
}

export interface CreateFacilityRequestResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CreateFacilityRequestResult;
}

export interface CreatePaymentCommand {
  /** @format uuid */
  billId?: string;
  /** @format uuid */
  externalUserId?: string;
  /** @format double */
  amountRials?: number;
  paymentMethod?: string | null;
  paymentGateway?: string | null;
  callbackUrl?: string | null;
  description?: string | null;
  /** @format date-time */
  expiryDate?: string | null;
  autoIssueBill?: boolean;
  discountCode?: string | null;
  allowOverDiscount?: boolean;
  skipPaymentIfZero?: boolean;
}

export interface CreatePaymentResponse {
  /** @format uuid */
  paymentId?: string;
  /** @format uuid */
  billId?: string;
  billNumber?: string | null;
  /** @format double */
  amount?: number;
  paymentMethod?: string | null;
  status?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  expiryDate?: string | null;
  gatewayRedirectUrl?: string | null;
  billStatus?: string | null;
  /** @format double */
  billTotalAmount?: number;
  /** @format int32 */
  itemsAdded?: number;
  billWasIssued?: boolean;
  /** @format int64 */
  trackingNumber?: number | null;
  requiresRedirect?: boolean;
  paymentMessage?: string | null;
  paymentGateway?: string | null;
  appliedDiscountCode?: string | null;
  /** @format double */
  appliedDiscountAmount?: number;
  /** @format double */
  originalBillAmount?: number;
  /** @format double */
  finalBillAmount?: number;
  isFreePayment?: boolean;
  paymentSkipped?: boolean;
  paymentStatus?: string | null;
}

export interface CreatePaymentResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CreatePaymentResponse;
}

export interface CreateRoleRequest {
  name?: string | null;
  description?: string | null;
  isSystemRole?: boolean;
  /** @format int32 */
  displayOrder?: number;
}

export interface CreateSectionCommand {
  name?: string | null;
  description?: string | null;
  /** @format int32 */
  displayOrder?: number;
}

export interface CreateSectionResponse {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
  /** @format int32 */
  displayOrder?: number;
  isActive?: boolean;
  /** @format date-time */
  createdAt?: string;
}

export interface CreateUserCommand {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  nationalId?: string | null;
  email?: string | null;
  username?: string | null;
  /** @format uuid */
  externalUserId?: string | null;
  sourceSystem?: string | null;
  sourceVersion?: string | null;
  sourceChecksum?: string | null;
  claims?: Record<string, string | null>;
  roles?: string[] | null;
  profileSnapshot?: string | null;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  skipDuplicateCheck?: boolean;
  isSeedingOperation?: boolean;
}

export interface CreateWalletDepositRequest {
  /** @format double */
  amountRials?: number;
  description?: string | null;
  externalReference?: string | null;
  metadata?: Record<string, string>;
}

export interface CreateWalletDepositResponse {
  /** @format uuid */
  depositId?: string;
  /** @format uuid */
  billId?: string;
  billNumber?: string | null;
  /** @format uuid */
  userExternalUserId?: string;
  userFullName?: string | null;
  /** @format double */
  amountRials?: number;
  depositStatus?: string | null;
  depositStatusText?: string | null;
  billStatus?: string | null;
  billStatusText?: string | null;
  /** @format date-time */
  requestedAt?: string;
  /** @format date-time */
  billIssueDate?: string | null;
  referenceId?: string | null;
}

export interface CreateWalletDepositResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CreateWalletDepositResponse;
}

export interface CurrentQuestionResponse {
  /** @format uuid */
  questionId?: string;
  questionText?: string | null;
  questionKind?: string | null;
  /** @format int32 */
  order?: number;
  isRequired?: boolean;
  isAnswered?: boolean;
  isComplete?: boolean;
  repeatPolicy?: RepeatPolicyDto;
  /** @format int32 */
  repeatIndex?: number;
  isRepeatAnswered?: boolean;
  isLastRepeat?: boolean;
  /** @format int32 */
  answeredRepeats?: number;
  /** @format int32 */
  maxRepeats?: number | null;
  canAddMoreRepeats?: boolean;
  options?: QuestionOptionDto[] | null;
  textAnswer?: string | null;
  selectedOptionIds?: string[] | null;
  isFirstQuestion?: boolean;
  isLastQuestion?: boolean;
  /** @format int32 */
  currentQuestionNumber?: number;
  /** @format int32 */
  totalQuestions?: number;
  /** @format double */
  progressPercentage?: number;
  /** @format uuid */
  responseId?: string;
  /** @format int32 */
  attemptNumber?: number;
  allowBackNavigation?: boolean;
}

export interface CurrentQuestionResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CurrentQuestionResponse;
}

export interface CurrentUserResponse {
  /** @format uuid */
  id?: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nationalId?: string | null;
  phone?: string | null;
  roles?: string[] | null;
  claims?: ClaimDto[] | null;
  preferences?: UserPreferenceDto[] | null;
}

export interface CurrentUserResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: CurrentUserResponse;
}

export interface CycleRulesDto {
  restrictToPreviousCycles?: boolean;
  hasDependencies?: boolean;
}

export interface CycleStatisticsDto {
  /** @format int32 */
  totalQuota?: number;
  /** @format int32 */
  usedQuota?: number;
  /** @format int32 */
  availableQuota?: number;
  /** @format double */
  utilizationPercentage?: number;
  /** @format int32 */
  pendingRequests?: number;
  /** @format int32 */
  approvedRequests?: number;
  /** @format int32 */
  rejectedRequests?: number;
  /** @format double */
  averageProcessingTimeDays?: number | null;
  /** @format int32 */
  cycleDurationDays?: number;
  /** @format int32 */
  daysElapsed?: number;
  /** @format int32 */
  daysRemaining?: number;
  /** @format double */
  cycleProgressPercentage?: number;
}

export interface DeleteClaimsFromUserCommand {
  /** @format uuid */
  userId?: string;
  claimValues?: string[] | null;
  notes?: string | null;
  /** @format uuid */
  removedBy?: string | null;
}

export interface DiscountCodeSnapshotDto {
  /** @format uuid */
  discountCodeId?: string;
  code?: string | null;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  /** @format double */
  value?: number;
  /** @format date-time */
  validFrom?: string;
  /** @format date-time */
  validTo?: string;
  /** @format int32 */
  usageLimit?: number | null;
  /** @format int32 */
  currentUsages?: number;
  /** @format int32 */
  remainingUsages?: number;
  isSingleUse?: boolean;
  description?: string | null;
  /** @format double */
  minimumBillAmountRials?: number | null;
  /** @format double */
  maximumDiscountAmountRials?: number | null;
  isExpired?: boolean;
  isDepleted?: boolean;
  isActive?: boolean;
}

export interface DiscountValidationDto {
  isValid?: boolean;
  errors?: string[] | null;
  /** @format double */
  discountAmountRials?: number;
  /** @format double */
  newTotalAmountRials?: number;
  /** @format double */
  discountPercentage?: number | null;
  isPercentageDiscount?: boolean;
  isFixedAmountDiscount?: boolean;
  bill?: BillDiscountSnapshotDto;
  discountCode?: DiscountCodeSnapshotDto;
}

export interface DiscountValidationDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: DiscountValidationDto;
}

export interface DiscountValidationItemDto {
  /** @format uuid */
  itemId?: string;
  title?: string | null;
  description?: string | null;
  /** @format double */
  unitPriceRials?: number;
  /** @format int32 */
  quantity?: number;
  /** @format double */
  lineTotalRials?: number;
  referenceId?: string | null;
  metadata?: Record<string, string>;
}

export interface FacilityCycleDependencyDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  requiredFacilityId?: string;
  requiredFacilityName?: string | null;
  mustBeCompleted?: boolean;
  /** @format date-time */
  createdAt?: string;
}

export interface FacilityCyclePriceOptionDto {
  /** @format uuid */
  id?: string;
  /** @format double */
  amountRials?: number;
  currency?: string | null;
  /** @format int32 */
  displayOrder?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface FacilityCycleStatisticsDto {
  /** @format int32 */
  activeCyclesCount?: number;
  /** @format int32 */
  totalCyclesCount?: number;
  /** @format int32 */
  draftCyclesCount?: number;
  /** @format int32 */
  closedCyclesCount?: number;
  /** @format int32 */
  underReviewCyclesCount?: number;
  /** @format int32 */
  completedCyclesCount?: number;
  /** @format int32 */
  cancelledCyclesCount?: number;
  /** @format int32 */
  totalActiveQuota?: number;
  /** @format int32 */
  totalUsedQuota?: number;
  /** @format int32 */
  totalAvailableQuota?: number;
  /** @format double */
  quotaUtilizationPercentage?: number;
}

export interface FacilityCycleWithUserDetailDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  /** @format date-time */
  startDate?: string;
  /** @format date-time */
  endDate?: string;
  /** @format int32 */
  daysUntilStart?: number;
  /** @format int32 */
  daysUntilEnd?: number;
  hasStarted?: boolean;
  hasEnded?: boolean;
  isActive?: boolean;
  isAcceptingApplications?: boolean;
  /** @format int32 */
  quota?: number;
  /** @format int32 */
  usedQuota?: number;
  /** @format int32 */
  availableQuota?: number;
  /** @format double */
  quotaUtilizationPercentage?: number;
  status?: string | null;
  statusText?: string | null;
  description?: string | null;
  approvalMessage?: string | null;
  financialTerms?: FinancialTermsDto;
  rules?: CycleRulesDto;
  requiredFeatureIds?: string[] | null;
  requiredCapabilityIds?: string[] | null;
  userEligibility?: UserEligibilityDto;
  lastRequest?: FacilityRequestDto;
  /** @format date-time */
  createdAt?: string;
  dependencies?: FacilityCycleDependencyDto[] | null;
  metadata?: Record<string, string>;
  /** @format date-time */
  lastModifiedAt?: string | null;
  statistics?: CycleStatisticsDto;
  userRequestHistory?: UserRequestHistoryDto[] | null;
}

export interface FacilityCycleWithUserDetailDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: FacilityCycleWithUserDetailDto;
}

export interface FacilityCycleWithUserDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  /** @format date-time */
  startDate?: string;
  /** @format date-time */
  endDate?: string;
  /** @format int32 */
  daysUntilStart?: number;
  /** @format int32 */
  daysUntilEnd?: number;
  hasStarted?: boolean;
  hasEnded?: boolean;
  isActive?: boolean;
  isAcceptingApplications?: boolean;
  /** @format int32 */
  quota?: number;
  /** @format int32 */
  usedQuota?: number;
  /** @format int32 */
  availableQuota?: number;
  /** @format double */
  quotaUtilizationPercentage?: number;
  status?: string | null;
  statusText?: string | null;
  description?: string | null;
  approvalMessage?: string | null;
  financialTerms?: FinancialTermsDto;
  rules?: CycleRulesDto;
  requiredFeatureIds?: string[] | null;
  requiredCapabilityIds?: string[] | null;
  userEligibility?: UserEligibilityDto;
  lastRequest?: FacilityRequestDto;
  /** @format date-time */
  createdAt?: string;
}

export interface FacilityDetailsDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  bankInfo?: BankInfoDto;
  cycleStatistics?: FacilityCycleStatisticsDto;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  lastModifiedAt?: string | null;
  hasActiveCycles?: boolean;
  isAcceptingApplications?: boolean;
  bankName?: string | null;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
  cycles?: FacilityCycleWithUserDto[] | null;
}

export interface FacilityDetailsDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: FacilityDetailsDto;
}

export interface FacilityDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  bankInfo?: BankInfoDto;
  cycleStatistics?: FacilityCycleStatisticsDto;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  lastModifiedAt?: string | null;
  hasActiveCycles?: boolean;
  isAcceptingApplications?: boolean;
}

export interface FacilityInfoDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  bankInfo?: BankInfoDto;
}

export interface FacilityRequestDetailsDto {
  /** @format uuid */
  id?: string;
  facility?: FacilityInfoDto;
  cycle?: FacilityCycleWithUserDto;
  applicant?: ApplicantInfoDto;
  /** @format double */
  requestedAmountRials?: number;
  /** @format double */
  approvedAmountRials?: number | null;
  currency?: string | null;
  status?: string | null;
  statusText?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  approvedAt?: string | null;
  /** @format date-time */
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  /** @format int32 */
  daysSinceCreated?: number;
  isInProgress?: boolean;
  isCompleted?: boolean;
  isRejected?: boolean;
  isCancelled?: boolean;
  isLastRequest?: boolean;
  requestNumber?: string | null;
  description?: string | null;
  financialInfo?: RequestFinancialInfoDto;
  statusDetails?: RequestStatusDto;
  timeline?: RequestTimelineDto;
  metadata?: Record<string, string>;
  isTerminal?: boolean;
  canBeCancelled?: boolean;
  requiresApplicantAction?: boolean;
  requiresBankAction?: boolean;
  /** @format int32 */
  daysUntilBankAppointment?: number | null;
  isBankAppointmentOverdue?: boolean;
  /** @format date-time */
  lastModifiedAt?: string | null;
  facilityDetails?: FacilityDetailsDto;
}

export interface FacilityRequestDetailsDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: FacilityRequestDetailsDto;
}

export interface FacilityRequestDto {
  /** @format uuid */
  id?: string;
  facility?: FacilityInfoDto;
  cycle?: FacilityCycleWithUserDto;
  applicant?: ApplicantInfoDto;
  /** @format double */
  requestedAmountRials?: number;
  /** @format double */
  approvedAmountRials?: number | null;
  currency?: string | null;
  status?: string | null;
  statusText?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  approvedAt?: string | null;
  /** @format date-time */
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  /** @format int32 */
  daysSinceCreated?: number;
  isInProgress?: boolean;
  isCompleted?: boolean;
  isRejected?: boolean;
  isCancelled?: boolean;
  isLastRequest?: boolean;
}

export interface FailedUpdate {
  /** @format uuid */
  settingId?: string;
  failureReason?: string | null;
}

export interface FeatureDetailDto {
  /** @format uuid */
  featureId?: string;
  name?: string | null;
  description?: string | null;
}

export interface FeatureSummaryDto {
  /** @format uuid */
  featureId?: string;
  name?: string | null;
}

export interface FinalizeReservationResponse {
  /** @format uuid */
  reservationId?: string;
  trackingCode?: string | null;
  status?: string | null;
  /** @format uuid */
  billId?: string;
  billNumber?: string | null;
  /** @format double */
  totalAmountRials?: number;
  /** @format date-time */
  expiryDate?: string | null;
  /** @format int32 */
  participantCount?: number;
  tourTitle?: string | null;
}

export interface FinalizeReservationResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: FinalizeReservationResponse;
}

export interface FinancialTermsDto {
  priceOptions?: FacilityCyclePriceOptionDto[] | null;
  currency?: string | null;
  /** @format int32 */
  paymentMonths?: number | null;
  /** @format double */
  interestRate?: number | null;
  /** @format double */
  interestRatePercentage?: number | null;
  hasFinancialTerms?: boolean;
}

export interface GetFacilitiesResult {
  items?: FacilityDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface GetFacilitiesResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: GetFacilitiesResult;
}

export interface GetFacilityCyclesWithUserQueryResponse {
  items?: FacilityCycleWithUserDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface GetFacilityCyclesWithUserQueryResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: GetFacilityCyclesWithUserQueryResponse;
}

export interface GetFacilityRequestsByUserQueryResult {
  items?: FacilityRequestDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface GetFacilityRequestsByUserQueryResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: GetFacilityRequestsByUserQueryResult;
}

export interface GetPreviousQuestionsResponse {
  survey?: SurveyBasicInfoDto;
  previousQuestions?: PreviousQuestionDto[] | null;
  navigation?: PreviousQuestionsNavigationDto;
  userResponseStatus?: UserResponseStatusDto;
}

export interface GetPreviousQuestionsResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: GetPreviousQuestionsResponse;
}

export interface GetSettingByKeyResponse {
  setting?: SettingDetailDto;
  found?: boolean;
}

export interface GetSettingsBySectionResponse {
  sections?: SectionWithSettingsDto[] | null;
  /** @format int32 */
  totalSections?: number;
  /** @format int32 */
  totalCategories?: number;
  /** @format int32 */
  totalSettings?: number;
}

export interface GetSettingsResponse {
  settings?: SettingDto[] | null;
  pagination?: PaginationInfo;
  /** @format int32 */
  totalCount?: number;
  filters?: AppliedFilters;
}

export interface GetSpecificQuestionResponse {
  survey?: SurveyBasicInfoDto;
  currentQuestion?: QuestionDetailsDto;
  navigation?: QuestionNavigationDto;
  userAnswer?: QuestionAnswerDto;
  userResponseStatus?: UserResponseStatusDto;
  statistics?: QuestionStatisticsDto;
}

export interface GetSpecificQuestionResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: GetSpecificQuestionResponse;
}

export interface GoNextQuestionResponse {
  /** @format uuid */
  currentQuestionId?: string | null;
  /** @format int32 */
  currentRepeatIndex?: number;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  progress?: CommandProgressDto;
}

export interface GoNextQuestionResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: GoNextQuestionResponse;
}

export interface GoPreviousQuestionResponse {
  /** @format uuid */
  currentQuestionId?: string | null;
  /** @format int32 */
  currentRepeatIndex?: number;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  progress?: CommandProgressDto;
  backAllowed?: boolean;
  message?: string | null;
}

export interface GoPreviousQuestionResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: GoPreviousQuestionResponse;
}

export interface GuestParticipantDto {
  firstName?: string | null;
  lastName?: string | null;
  nationalNumber?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  /** @format date-time */
  birthDate?: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
}

export interface GuidApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  /** @format uuid */
  data?: string;
}

export interface InvalidAnswerDto {
  /** @format uuid */
  questionId?: string;
  errorMessage?: string | null;
}

export interface IssueBillResponse {
  /** @format uuid */
  billId?: string;
  billNumber?: string | null;
  status?: string | null;
  /** @format date-time */
  issueDate?: string;
  /** @format double */
  totalAmount?: number;
}

export interface IssueBillResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: IssueBillResponse;
}

export interface JumpToQuestionRequest {
  /** @format uuid */
  targetQuestionId?: string;
}

export interface JumpToQuestionResponse {
  /** @format uuid */
  currentQuestionId?: string | null;
  /** @format int32 */
  currentRepeatIndex?: number;
  backAllowed?: boolean;
  message?: string | null;
}

export interface JumpToQuestionResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: JumpToQuestionResponse;
}

export interface LogoutRequest {
  refreshToken?: string | null;
}

export interface LogoutResponse {
  isSuccess?: boolean;
  message?: string | null;
}

export interface LogoutResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: LogoutResponse;
}

export interface MarkByActionAsReadRequest {
  action?: string | null;
}

export interface MarkByContextAsReadRequest {
  context?: string | null;
}

export interface Money {
  /** @format double */
  amountRials?: number;
  currency?: string | null;
}

export interface NavigationQuestionDto {
  /** @format uuid */
  questionId?: string;
  questionText?: string | null;
  questionKind?: string | null;
  /** @format int32 */
  order?: number;
  isRequired?: boolean;
  isAnswered?: boolean;
  isComplete?: boolean;
  isCurrent?: boolean;
  /** @format date-time */
  lastAnsweredAt?: string | null;
}

export interface NotificationDto {
  /** @format uuid */
  id?: string;
  title?: string | null;
  message?: string | null;
  context?: string | null;
  action?: string | null;
  isRead?: boolean;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  expiresAt?: string | null;
  data?: any;
  hasAction?: boolean;
  isExpired?: boolean;
}

export interface NotificationDtoPaginatedResult {
  items?: NotificationDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface NotificationDtoPaginatedResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: NotificationDtoPaginatedResult;
}

export interface ObjectApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: any;
}

export interface PaginationInfo {
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface ParticipantDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  reservationId?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  nationalNumber?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  participantType?: string | null;
  /** @format date-time */
  birthDate?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  /** @format double */
  requiredAmountRials?: number;
  /** @format double */
  paidAmountRials?: number | null;
  /** @format date-time */
  paymentDate?: string | null;
  /** @format date-time */
  registrationDate?: string;
  hasPaid?: boolean;
  isFullyPaid?: boolean;
  /** @format double */
  remainingAmountRials?: number;
  isMainParticipant?: boolean;
  isGuest?: boolean;
  isPaymentPending?: boolean;
  isPaymentOverdue?: boolean;
  canMakePayment?: boolean;
  isPaymentRequired?: boolean;
  participantTypeText?: string | null;
  ageGroup?: string | null;
  /** @format int32 */
  age?: number;
  isEligible?: boolean;
  eligibilityIssues?: string[] | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  /** @format double */
  basePriceRials?: number;
  /** @format double */
  discountPercentage?: number | null;
  /** @format double */
  effectivePriceRials?: number;
  /** @format double */
  discountAmountRials?: number | null;
  priceNote?: string | null;
  hasDiscount?: boolean;
  discountReason?: string | null;
}

export interface ParticipantInfoDto {
  /** @format uuid */
  memberId?: string | null;
  participantHash?: string | null;
  nationalCode?: string | null;
  fullName?: string | null;
  isAnonymous?: boolean;
  demographyData?: Record<string, string>;
}

export interface ParticipantPricingDto {
  /** @format uuid */
  participantId?: string;
  participantType?: string | null;
  /** @format double */
  requiredAmount?: number;
  /** @format double */
  paidAmount?: number;
  /** @format double */
  remainingAmount?: number;
  isFullyPaid?: boolean;
}

export interface ParticipationPolicyDto {
  /** @format int32 */
  maxAttemptsPerMember?: number;
  maxAttemptsText?: string | null;
  allowMultipleSubmissions?: boolean;
  allowMultipleSubmissionsText?: string | null;
  /** @format int32 */
  coolDownSeconds?: number | null;
  coolDownText?: string | null;
  allowBackNavigation?: boolean;
  allowBackNavigationText?: string | null;
  requireAllQuestions?: boolean;
  requireAllQuestionsText?: string | null;
}

export interface ParticipationStatusResponse {
  /** @format uuid */
  surveyId?: string;
  userNationalNumber?: string | null;
  /** @format uuid */
  memberId?: string | null;
  isEligible?: boolean;
  eligibilityReason?: string | null;
  /** @format int32 */
  totalAttempts?: number;
  /** @format int32 */
  maxAllowedAttempts?: number;
  canStartNewAttempt?: boolean;
  /** @format uuid */
  currentResponseId?: string | null;
  currentAttemptStatus?: string | null;
  /** @format date-time */
  currentAttemptStartedAt?: string | null;
  /** @format date-time */
  currentAttemptSubmittedAt?: string | null;
  isInCooldown?: boolean;
  /** @format date-time */
  cooldownEndsAt?: string | null;
  remainingCooldown?: TimeSpan;
  allowMultipleSubmissions?: boolean;
  previousAttempts?: AttemptSummary[] | null;
}

export interface ParticipationStatusResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ParticipationStatusResponse;
}

export interface PayWithWalletCommand {
  /** @format uuid */
  paymentId?: string;
  /** @format uuid */
  billId?: string;
  /** @format uuid */
  walletId?: string;
  /** @format double */
  amountRials?: number | null;
  description?: string | null;
  externalReference?: string | null;
  metadata?: Record<string, string>;
}

export interface PayWithWalletResponse {
  /** @format uuid */
  paymentId?: string;
  /** @format uuid */
  billId?: string;
  billNumber?: string | null;
  /** @format double */
  amountPaidRials?: number;
  paymentStatus?: string | null;
  paymentStatusText?: string | null;
  billStatus?: string | null;
  billStatusText?: string | null;
  /** @format double */
  billRemainingAmountRials?: number;
  /** @format double */
  walletBalanceAfterPaymentRials?: number;
  /** @format date-time */
  processedAt?: string;
  description?: string | null;
  externalReference?: string | null;
  /** @format uuid */
  walletTransactionId?: string;
  metadata?: Record<string, string>;
}

export interface PayWithWalletResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: PayWithWalletResponse;
}

export interface PaymentCallbackResult {
  /** @format uuid */
  paymentId?: string;
  /** @format double */
  gatewayReference?: number;
  billTrackingCode?: string | null;
  billType?: string | null;
  isSuccessful?: boolean;
  message?: string | null;
  transactionCode?: string | null;
  amount?: Money;
  /** @format date-time */
  processedAt?: string;
  newStatus?: PaymentStatus;
  /** @format uuid */
  billId?: string;
  billStatus?: string | null;
  /** @format double */
  billTotalAmount?: number | null;
  /** @format double */
  billPaidAmount?: number | null;
  /** @format double */
  billRemainingAmount?: number | null;
  isBillFullyPaid?: boolean;
  /** @format date-time */
  billFullyPaidDate?: string | null;
}

export interface PaymentCallbackResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: PaymentCallbackResult;
}

export interface PaymentDetailDto {
  /** @format uuid */
  paymentId?: string;
  /** @format uuid */
  billId?: string;
  /** @format double */
  amountRials?: number;
  status?: string | null;
  methodText?: string | null;
  gatewayText?: string | null;
  method?: string | null;
  statusText?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  completedAt?: string | null;
  gateway?: string | null;
  gatewayTransactionId?: string | null;
  gatewayReference?: string | null;
  /** @format int64 */
  secondsUntilExpiry?: number | null;
  /** @format date-time */
  expiryDate?: string | null;
  failureReason?: string | null;
  appliedDiscountCode?: string | null;
  /** @format uuid */
  appliedDiscountCodeId?: string | null;
  /** @format double */
  appliedDiscountAmountRials?: number | null;
  isFreePayment?: boolean;
  bill?: BillDto;
  transactions?: PaymentTransactionDto[] | null;
}

export interface PaymentDetailDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: PaymentDetailDto;
}

export interface PaymentDto {
  /** @format uuid */
  paymentId?: string;
  /** @format uuid */
  billId?: string;
  /** @format double */
  amountRials?: number;
  status?: string | null;
  methodText?: string | null;
  gatewayText?: string | null;
  method?: string | null;
  statusText?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  completedAt?: string | null;
  gateway?: string | null;
  gatewayTransactionId?: string | null;
  gatewayReference?: string | null;
  /** @format int64 */
  secondsUntilExpiry?: number | null;
}

export interface PaymentDtoPaginatedResult {
  items?: PaymentDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface PaymentDtoPaginatedResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: PaymentDtoPaginatedResult;
}

export interface PaymentGatewayInfo {
  gateway?: string | null;
  name?: string | null;
  displayName?: string | null;
  isEnabled?: boolean;
  supportsDevelopmentMode?: boolean;
  /** @format double */
  minAmount?: number;
  /** @format double */
  maxAmount?: number;
}

export interface PaymentTransactionDto {
  /** @format uuid */
  transactionId?: string;
  /** @format double */
  amountRials?: number | null;
  /** @format date-time */
  createdAt?: string;
  gateway?: string | null;
  gatewayTransactionId?: string | null;
  gatewayReference?: string | null;
  status?: string | null;
  statusText?: string | null;
  note?: string | null;
}

export interface PhotoDetailDto {
  /** @format uuid */
  id?: string;
  url?: string | null;
  caption?: string | null;
  /** @format int32 */
  displayOrder?: number;
}

export interface PhotoSummaryDto {
  /** @format uuid */
  id?: string;
  url?: string | null;
  /** @format int32 */
  displayOrder?: number;
}

export interface PreferenceValueDto {
  rawValue?: string | null;
  /** @format int32 */
  type?: number;
}

export interface PreviousQuestionDto {
  question?: QuestionDetailsDto;
  /** @format int32 */
  index?: number;
  userAnswer?: QuestionAnswerDto;
  isAnswered?: boolean;
  canNavigateTo?: boolean;
}

export interface PreviousQuestionsNavigationDto {
  /** @format int32 */
  currentIndex?: number;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  previousQuestionsCount?: number;
  /** @format int32 */
  morePreviousAvailable?: number;
  canNavigatePrevious?: boolean;
  progress?: ProgressInfoDto;
}

export interface PriceSnapshotDto {
  participantType?: string | null;
  /** @format double */
  finalPriceRials?: number;
}

export interface PricingDetailDto {
  /** @format uuid */
  id?: string;
  participantType?: string | null;
  /** @format double */
  basePriceRials?: number;
  /** @format double */
  effectivePriceRials?: number;
  /** @format double */
  discountPercentage?: number | null;
  /** @format double */
  discountAmountRials?: number | null;
  /** @format date-time */
  validFrom?: string | null;
  /** @format date-time */
  validTo?: string | null;
  isActive?: boolean;
  isEarlyBird?: boolean;
  isLastMinute?: boolean;
  description?: string | null;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

export interface ProgressInfoDto {
  /** @format int32 */
  questionsAnswered?: number;
  /** @format int32 */
  questionsRemaining?: number;
  /** @format int32 */
  progressPercentage?: number;
  /** @format int32 */
  requiredQuestionsAnswered?: number;
  /** @format int32 */
  requiredQuestionsRemaining?: number;
}

export interface QuestionAnswerDetailsDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  responseId?: string;
  /** @format uuid */
  questionId?: string;
  textAnswer?: string | null;
  selectedOptionIds?: string[] | null;
  selectedOptions?: QuestionOptionDto[] | null;
  isAnswered?: boolean;
  isComplete?: boolean;
  question?: QuestionDetailsDto;
}

export interface QuestionAnswerDetailsDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: QuestionAnswerDetailsDto;
}

export interface QuestionAnswerDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  responseId?: string;
  /** @format uuid */
  questionId?: string;
  /** @format int32 */
  repeatIndex?: number;
  textAnswer?: string | null;
  selectedOptionIds?: string[] | null;
  selectedOptions?: QuestionAnswerOptionDto[] | null;
  hasAnswer?: boolean;
}

export interface QuestionAnswerOptionDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  questionAnswerId?: string;
  /** @format uuid */
  optionId?: string;
  optionText?: string | null;
}

export interface QuestionByIdResponse {
  /** @format uuid */
  questionId?: string;
  questionText?: string | null;
  questionKind?: string | null;
  /** @format int32 */
  order?: number;
  isRequired?: boolean;
  isAnswered?: boolean;
  isComplete?: boolean;
  repeatPolicy?: RepeatPolicyDto;
  /** @format int32 */
  repeatIndex?: number;
  isRepeatAnswered?: boolean;
  isLastRepeat?: boolean;
  /** @format int32 */
  answeredRepeats?: number;
  /** @format int32 */
  maxRepeats?: number | null;
  canAddMoreRepeats?: boolean;
  options?: QuestionOptionDto[] | null;
  textAnswer?: string | null;
  selectedOptionIds?: string[] | null;
  isFirstQuestion?: boolean;
  isLastQuestion?: boolean;
  /** @format int32 */
  currentQuestionNumber?: number;
  /** @format int32 */
  totalQuestions?: number;
  /** @format double */
  progressPercentage?: number;
  /** @format uuid */
  responseId?: string;
  /** @format int32 */
  attemptNumber?: number;
  allowBackNavigation?: boolean;
}

export interface QuestionByIdResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: QuestionByIdResponse;
}

export interface QuestionDetailsDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  surveyId?: string;
  kind?: string | null;
  kindText?: string | null;
  text?: string | null;
  /** @format int32 */
  order?: number;
  isRequired?: boolean;
  isRequiredText?: string | null;
  repeatPolicy?: RepeatPolicyDto;
  specification?: QuestionSpecificationDto;
  options?: QuestionOptionDto[] | null;
  userAnswers?: QuestionAnswerDetailsDto[] | null;
  latestUserAnswer?: QuestionAnswerDetailsDto;
  isAnswered?: boolean;
  isComplete?: boolean;
  /** @format int32 */
  answerCount?: number;
  statistics?: QuestionStatisticsDto;
  validation?: QuestionValidationDto;
}

export interface QuestionDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  surveyId?: string;
  kind?: string | null;
  kindText?: string | null;
  text?: string | null;
  /** @format int32 */
  order?: number;
  isRequired?: boolean;
  isRequiredText?: string | null;
  options?: QuestionOptionDto[] | null;
  userAnswer?: QuestionAnswerDto;
  isAnswered?: boolean;
  isComplete?: boolean;
}

export interface QuestionNavigationDto {
  /** @format uuid */
  previousQuestionId?: string | null;
  /** @format uuid */
  nextQuestionId?: string | null;
  canGoBack?: boolean;
  canGoForward?: boolean;
  canSkip?: boolean;
  isRequired?: boolean;
}

export interface QuestionOptionDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  questionId?: string;
  text?: string | null;
  /** @format int32 */
  order?: number;
  isActive?: boolean;
  isSelected?: boolean;
}

export interface QuestionProgressDto {
  /** @format uuid */
  questionId?: string;
  questionText?: string | null;
  /** @format int32 */
  order?: number;
  isRequired?: boolean;
  isAnswered?: boolean;
  isComplete?: boolean;
  /** @format date-time */
  lastAnsweredAt?: string | null;
  userTextAnswer?: string | null;
  userSelectedOptionIds?: string[] | null;
  userSelectedOptionValues?: string[] | null;
  /** @format int32 */
  repeatIndex?: number;
}

export interface QuestionSpecificationDto {
  /** @format int32 */
  minLength?: number | null;
  /** @format int32 */
  maxLength?: number | null;
  pattern?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  allowMultipleSelections?: boolean;
  allowCustomAnswers?: boolean;
  validationRules?: string[] | null;
}

export interface QuestionStatisticsDto {
  /** @format int32 */
  totalAnswers?: number;
  /** @format int32 */
  requiredAnswers?: number;
  /** @format int32 */
  optionalAnswers?: number;
  /** @format double */
  answerRate?: number;
  /** @format double */
  completionRate?: number;
  averageAnswerTime?: TimeSpan;
  averageAnswerTimeText?: string | null;
  optionSelectionCounts?: Record<string, number>;
  commonTextAnswers?: string[] | null;
}

export interface QuestionValidationDto {
  isValid?: boolean;
  validationErrors?: string[] | null;
  validationWarnings?: string[] | null;
  hasRequiredValidation?: boolean;
  hasLengthValidation?: boolean;
  hasPatternValidation?: boolean;
  validationMessage?: string | null;
}

export interface QuestionWithAnswersDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  surveyId?: string;
  kind?: string | null;
  kindText?: string | null;
  text?: string | null;
  /** @format int32 */
  order?: number;
  isRequired?: boolean;
  options?: QuestionOptionDto[] | null;
  userAnswers?: QuestionAnswerDto[] | null;
  latestAnswer?: QuestionAnswerDto;
  isAnswered?: boolean;
  isComplete?: boolean;
  /** @format int32 */
  answerCount?: number;
}

export interface QuestionsNavigationResponse {
  /** @format uuid */
  responseId?: string;
  /** @format uuid */
  surveyId?: string;
  /** @format int32 */
  attemptNumber?: number;
  allowBackNavigation?: boolean;
  includeBackNavigation?: boolean;
  questions?: NavigationQuestionDto[] | null;
  /** @format uuid */
  currentQuestionId?: string | null;
  /** @format int32 */
  currentQuestionNumber?: number;
  /** @format int32 */
  totalQuestions?: number;
  /** @format double */
  progressPercentage?: number;
}

export interface QuestionsNavigationResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: QuestionsNavigationResponse;
}

export interface ReactivateReservationResponse {
  /** @format uuid */
  reservationId?: string;
  status?: string | null;
}

export interface ReactivateReservationResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ReactivateReservationResponse;
}

export interface RefreshTokenRequest {
  refreshToken?: string | null;
}

export interface RefreshTokenResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
  /** @format int32 */
  expiryMinutes?: number;
  /** @format uuid */
  userId?: string;
  isSessionCompromised?: boolean;
}

export interface RefreshTokenResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: RefreshTokenResponse;
}

export interface RefundDto {
  /** @format uuid */
  refundId?: string;
  /** @format uuid */
  billId?: string;
  /** @format double */
  amountRials?: number;
  status?: string | null;
  statusText?: string | null;
  reason?: string | null;
  /** @format uuid */
  requestedByExternalUserId?: string;
  /** @format date-time */
  requestedAt?: string;
  /** @format date-time */
  processedAt?: string | null;
  /** @format date-time */
  completedAt?: string | null;
  gatewayRefundId?: string | null;
  gatewayReference?: string | null;
  processorNotes?: string | null;
  rejectionReason?: string | null;
  /** @format int64 */
  secondsSinceRequested?: number;
}

export interface RejectFacilityRequestRequest {
  reason?: string | null;
  /** @format uuid */
  rejectorUserId?: string;
}

export interface RejectFacilityRequestResult {
  /** @format uuid */
  requestId?: string;
  requestNumber?: string | null;
  status?: string | null;
  reason?: string | null;
  /** @format date-time */
  rejectedAt?: string;
  /** @format uuid */
  rejectorUserId?: string;
  /** @format uuid */
  rejectionId?: string;
  rejectionType?: string | null;
  details?: string | null;
  notes?: string | null;
}

export interface RejectFacilityRequestResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: RejectFacilityRequestResult;
}

export interface RemoveClaimsRequest {
  claimValues?: string[] | null;
}

export interface RemoveGuestFromReservationResponse {
  /** @format uuid */
  reservationId?: string;
  /** @format uuid */
  capacityId?: string | null;
}

export interface RemoveGuestFromReservationResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: RemoveGuestFromReservationResponse;
}

export interface RepeatPolicyDto {
  kind?: string | null;
  kindText?: string | null;
  /** @format int32 */
  maxRepeats?: number | null;
  /** @format int32 */
  minRepeats?: number | null;
  isRepeatable?: boolean;
  repeatDescription?: string | null;
}

export interface RepeatableAnswerDto {
  /** @format int32 */
  repeatIndex?: number;
  userTextAnswer?: string | null;
  userSelectedOptionIds?: string[] | null;
  userSelectedOptionValues?: string[] | null;
  isAnswered?: boolean;
}

export interface RepeatableQuestionProgressDto {
  /** @format uuid */
  questionId?: string;
  questionText?: string | null;
  repeatPolicy?: RepeatPolicyDto;
  /** @format int32 */
  answeredRepeats?: number;
  /** @format int32 */
  requiredRepeats?: number | null;
  canAddMoreRepeats?: boolean;
  answeredRepeatIndices?: number[] | null;
  repeatAnswers?: RepeatableAnswerDto[] | null;
}

export interface RequestFinancialInfoDto {
  /** @format double */
  requestedAmountRials?: number;
  /** @format double */
  approvedAmountRials?: number | null;
  currency?: string | null;
  amountWasModified?: boolean;
  /** @format double */
  finalAmountRials?: number;
  formattedRequestedAmount?: string | null;
  formattedApprovedAmount?: string | null;
  formattedFinalAmount?: string | null;
}

export interface RequestStatusDto {
  status?: string | null;
  statusDescription?: string | null;
  description?: string | null;
  rejectionReason?: string | null;
  isTerminal?: boolean;
  canBeCancelled?: boolean;
  isInProgress?: boolean;
  isCompleted?: boolean;
  isRejected?: boolean;
  isCancelled?: boolean;
  requiresApplicantAction?: boolean;
  requiresBankAction?: boolean;
}

export interface RequestTimelineDto {
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  approvedAt?: string | null;
  /** @format date-time */
  rejectedAt?: string | null;
  /** @format date-time */
  bankAppointmentScheduledAt?: string | null;
  /** @format date-time */
  bankAppointmentDate?: string | null;
  /** @format date-time */
  disbursedAt?: string | null;
  /** @format date-time */
  completedAt?: string | null;
  /** @format int32 */
  daysSinceCreated?: number;
  /** @format int32 */
  daysUntilBankAppointment?: number | null;
  isBankAppointmentOverdue?: boolean;
  /** @format int32 */
  processingTimeDays?: number | null;
}

export interface RequiredCapabilityDto {
  capabilityId?: string | null;
  name?: string | null;
}

export interface RequiredFeatureDto {
  featureId?: string | null;
  name?: string | null;
}

export interface ReservationDetailDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  tourId?: string;
  trackingCode?: string | null;
  status?: string | null;
  /** @format date-time */
  reservationDate?: string;
  /** @format date-time */
  expiryDate?: string | null;
  /** @format date-time */
  confirmationDate?: string | null;
  /** @format double */
  totalAmountRials?: number | null;
  /** @format double */
  paidAmountRials?: number | null;
  /** @format double */
  remainingAmountRials?: number | null;
  isFullyPaid?: boolean;
  /** @format int32 */
  participantCount?: number;
  /** @format int32 */
  mainParticipantCount?: number;
  /** @format int32 */
  guestParticipantCount?: number;
  isExpired?: boolean;
  isConfirmed?: boolean;
  isPending?: boolean;
  isDraft?: boolean;
  isPaying?: boolean;
  isCancelled?: boolean;
  isTerminal?: boolean;
  /** @format uuid */
  capacityId?: string | null;
  /** @format uuid */
  billId?: string | null;
  tourTitle?: string | null;
  /** @format date-time */
  tourStart?: string | null;
  /** @format date-time */
  tourEnd?: string | null;
  tourStatus?: string | null;
  tourIsActive?: boolean | null;
  /** @format date-time */
  cancellationDate?: string | null;
  cancellationReason?: string | null;
  /** @format uuid */
  memberId?: string | null;
  /** @format uuid */
  externalUserId?: string;
  capacity?: CapacitySummaryDto;
  tour?: TourBriefDto;
  participants?: ParticipantDto[] | null;
  priceSnapshots?: PriceSnapshotDto[] | null;
  notes?: string | null;
  tenantId?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ReservationDetailDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDetailDto;
}

export interface ReservationDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  tourId?: string;
  trackingCode?: string | null;
  status?: string | null;
  /** @format date-time */
  reservationDate?: string;
  /** @format date-time */
  expiryDate?: string | null;
  /** @format date-time */
  confirmationDate?: string | null;
  /** @format double */
  totalAmountRials?: number | null;
  /** @format double */
  paidAmountRials?: number | null;
  /** @format double */
  remainingAmountRials?: number | null;
  isFullyPaid?: boolean;
  /** @format int32 */
  participantCount?: number;
  /** @format int32 */
  mainParticipantCount?: number;
  /** @format int32 */
  guestParticipantCount?: number;
  isExpired?: boolean;
  isConfirmed?: boolean;
  isPending?: boolean;
  isDraft?: boolean;
  isPaying?: boolean;
  isCancelled?: boolean;
  isTerminal?: boolean;
  /** @format uuid */
  capacityId?: string | null;
  /** @format uuid */
  billId?: string | null;
  tourTitle?: string | null;
  /** @format date-time */
  tourStart?: string | null;
  /** @format date-time */
  tourEnd?: string | null;
  tourStatus?: string | null;
  tourIsActive?: boolean | null;
}

export interface ReservationDtoPaginatedResult {
  items?: ReservationDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface ReservationDtoPaginatedResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationDtoPaginatedResult;
}

export interface ReservationPricingResponse {
  /** @format uuid */
  reservationId?: string;
  /** @format double */
  totalRequiredAmount?: number;
  /** @format double */
  totalPaidAmount?: number;
  /** @format double */
  totalRemainingAmount?: number;
  isFullyPaid?: boolean;
  participants?: ParticipantPricingDto[] | null;
}

export interface ReservationPricingResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ReservationPricingResponse;
}

export interface ReservationSummaryDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  tourId?: string;
  trackingCode?: string | null;
  status?: string | null;
  /** @format date-time */
  reservationDate?: string;
}

export interface ResponseDetailsDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  surveyId?: string;
  /** @format int32 */
  attemptNumber?: number;
  participant?: ParticipantInfoDto;
  survey?: SurveyBasicInfoDto;
  questionAnswers?: QuestionAnswerDetailsDto[] | null;
  statistics?: ResponseStatisticsDto;
  status?: ResponseStatusDto;
}

export interface ResponseDetailsDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ResponseDetailsDto;
}

export interface ResponseDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  surveyId?: string;
  /** @format int32 */
  attemptNumber?: number;
  /** @format date-time */
  submittedAt?: string | null;
  /** @format date-time */
  expiredAt?: string | null;
  /** @format date-time */
  canceledAt?: string | null;
  participantDisplayName?: string | null;
  participantShortIdentifier?: string | null;
  isAnonymous?: boolean;
  isAnonymousText?: string | null;
  attemptStatus?: string | null;
  attemptStatusText?: string | null;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  isActive?: boolean;
  isSubmitted?: boolean;
  isExpired?: boolean;
  isCanceled?: boolean;
  questionAnswers?: QuestionAnswerDto[] | null;
  lastAnswers?: QuestionAnswerDto[] | null;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
  /** @format int32 */
  requiredAnsweredQuestions?: number;
  isComplete?: boolean;
  isCompleteText?: string | null;
  /** @format double */
  completionPercentage?: number;
  completionPercentageText?: string | null;
  responseDuration?: TimeSpan;
  responseDurationText?: string | null;
  timeToExpire?: TimeSpan;
  timeToExpireText?: string | null;
  surveyTitle?: string | null;
  surveyDescription?: string | null;
  canContinue?: boolean;
  canSubmit?: boolean;
  canCancel?: boolean;
  nextActionText?: string | null;
  validationErrors?: string[] | null;
  hasValidationErrors?: boolean;
  validationMessage?: string | null;
}

export interface ResponseInfoDto {
  /** @format uuid */
  responseId?: string;
  /** @format uuid */
  surveyId?: string;
  /** @format int32 */
  attemptNumber?: number;
  /** @format date-time */
  createdAt?: string;
  participantDisplayName?: string | null;
  participantShortIdentifier?: string | null;
  isAnonymous?: boolean;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format double */
  completionPercentage?: number;
  isComplete?: boolean;
}

export interface ResponseProgressResponse {
  /** @format uuid */
  responseId?: string;
  /** @format uuid */
  surveyId?: string;
  /** @format int32 */
  attemptNumber?: number;
  attemptStatus?: string | null;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
  /** @format int32 */
  answeredRequiredQuestions?: number;
  /** @format double */
  completionPercentage?: number;
  /** @format double */
  requiredCompletionPercentage?: number;
  isComplete?: boolean;
  isSubmitted?: boolean;
  /** @format date-time */
  submittedAt?: string | null;
  /** @format date-time */
  startedAt?: string | null;
  timeSpent?: TimeSpan;
  allowBackNavigation?: boolean;
  questionsProgress?: QuestionProgressDto[] | null;
  repeatables?: RepeatableQuestionProgressDto[] | null;
}

export interface ResponseProgressResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ResponseProgressResponse;
}

export interface ResponseStatisticsDto {
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
  /** @format int32 */
  requiredAnsweredQuestions?: number;
  /** @format double */
  completionPercentage?: number;
  isComplete?: boolean;
  timeSpent?: TimeSpan;
  /** @format date-time */
  firstAnswerAt?: string | null;
  /** @format date-time */
  lastAnswerAt?: string | null;
}

export interface ResponseStatusDto {
  responseStatus?: string | null;
  responseStatusText?: string | null;
  canContinue?: boolean;
  canSubmit?: boolean;
  isSubmitted?: boolean;
  statusMessage?: string | null;
  validationErrors?: string[] | null;
}

export interface ResponseSummaryDto {
  /** @format int32 */
  answered?: number;
  /** @format int32 */
  total?: number;
  /** @format double */
  completion?: number;
  unansweredRequiredQuestions?: string[] | null;
}

export interface RestrictedTourSummaryDto {
  /** @format uuid */
  restrictedTourId?: string;
  title?: string | null;
}

export interface SectionDetailDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
  /** @format int32 */
  displayOrder?: number;
  isActive?: boolean;
}

export interface SectionInfo {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
}

export interface SectionWithSettingsDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  description?: string | null;
  /** @format int32 */
  displayOrder?: number;
  isActive?: boolean;
  categories?: CategoryWithSettingsDto[] | null;
  /** @format int32 */
  categoryCount?: number;
  /** @format int32 */
  totalSettings?: number;
}

export interface SendOtpRequest {
  nationalCode?: string | null;
  purpose?: string | null;
  deviceId?: string | null;
  scope?: string | null;
}

export interface SendOtpResponse {
  /** @format int32 */
  expiryMinutes?: number;
  maskedPhoneNumber?: string | null;
  isRegistered?: boolean;
  isLocked?: boolean;
  /** @format int32 */
  remainingLockoutMinutes?: number;
  challengeId?: string | null;
}

export interface SendOtpResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SendOtpResponse;
}

export interface SetSettingCommand {
  key?: string | null;
  value?: string | null;
  type?: SettingType;
  description?: string | null;
  /** @format uuid */
  categoryId?: string;
  isReadOnly?: boolean;
  /** @format int32 */
  displayOrder?: number;
  changeReason?: string | null;
}

export interface SetSettingResponse {
  /** @format uuid */
  id?: string;
  key?: string | null;
  value?: string | null;
  type?: SettingType;
  wasCreated?: boolean;
  /** @format uuid */
  changeEventId?: string | null;
  /** @format date-time */
  modifiedAt?: string;
}

export interface SettingDetailDto {
  /** @format uuid */
  id?: string;
  key?: string | null;
  value?: string | null;
  type?: SettingType;
  description?: string | null;
  isReadOnly?: boolean;
  isActive?: boolean;
  /** @format int32 */
  displayOrder?: number;
  category?: CategoryDetailDto;
  section?: SectionDetailDto;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  modifiedAt?: string;
  typedValue?: any;
}

export interface SettingDto {
  /** @format uuid */
  id?: string;
  key?: string | null;
  value?: string | null;
  type?: SettingType;
  description?: string | null;
  isReadOnly?: boolean;
  isActive?: boolean;
  /** @format int32 */
  displayOrder?: number;
  category?: CategoryInfo;
  section?: SectionInfo;
  /** @format date-time */
  modifiedAt?: string;
}

export interface SimpleSettingDto {
  /** @format uuid */
  id?: string;
  key?: string | null;
  value?: string | null;
  type?: SettingType;
  description?: string | null;
  isReadOnly?: boolean;
  isActive?: boolean;
  /** @format int32 */
  displayOrder?: number;
}

export interface StartReservationCommandResult {
  /** @format uuid */
  reservationId?: string;
}

export interface StartReservationCommandResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: StartReservationCommandResult;
}

export interface StartReservationRequest {
  /** @format uuid */
  tourId?: string;
  /** @format uuid */
  capacityId?: string;
}

export interface StartSurveyResponseRequest {
  participantHash?: string | null;
  forceNewAttempt?: boolean;
  demographySnapshot?: Record<string, string>;
  resumeActiveIfAny?: boolean;
}

export interface StartSurveyResponseResponse {
  /** @format uuid */
  responseId?: string;
  /** @format uuid */
  surveyId?: string;
  /** @format int32 */
  attemptNumber?: number;
  attemptStatus?: string | null;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  /** @format uuid */
  currentQuestionId?: string | null;
  /** @format int32 */
  currentRepeatIndex?: number;
  allowsBackNavigation?: boolean;
  cooldown?: CooldownInfo;
  isResumed?: boolean;
  canAnswer?: boolean;
  message?: string | null;
  eligibilityReasons?: string[] | null;
}

export interface StartSurveyResponseResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: StartSurveyResponseResponse;
}

export interface SubmitResponseResponse {
  submitted?: boolean;
  /** @format date-time */
  submittedAt?: string | null;
  responseStatus?: string | null;
  responseStatusText?: string | null;
  summary?: ResponseSummaryDto;
  validationErrors?: string[] | null;
}

export interface SubmitResponseResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SubmitResponseResponse;
}

export interface SuccessfulUpdate {
  /** @format uuid */
  settingId?: string;
  newValue?: string | null;
  /** @format uuid */
  changeEventId?: string;
}

export interface SurveyBasicInfoDto {
  /** @format uuid */
  id?: string;
  title?: string | null;
  state?: string | null;
  stateText?: string | null;
  isActive?: boolean;
  isAnonymous?: boolean;
  /** @format date-time */
  startAt?: string | null;
  /** @format date-time */
  endAt?: string | null;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
}

export interface SurveyCapabilityDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  surveyId?: string;
  capabilityCode?: string | null;
  capabilityTitleSnapshot?: string | null;
}

export interface SurveyDto {
  /** @format uuid */
  id?: string;
  title?: string | null;
  description?: string | null;
  state?: string | null;
  stateText?: string | null;
  /** @format date-time */
  startAt?: string | null;
  /** @format date-time */
  endAt?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  lastModifiedAt?: string | null;
  isAnonymous?: boolean;
  isStructureFrozen?: boolean;
  /** @format int32 */
  maxAttemptsPerMember?: number;
  maxAttemptsText?: string | null;
  allowMultipleSubmissions?: boolean;
  allowMultipleSubmissionsText?: string | null;
  /** @format int32 */
  coolDownSeconds?: number | null;
  coolDownText?: string | null;
  allowBackNavigation?: boolean;
  allowBackNavigationText?: string | null;
  audienceFilter?: string | null;
  hasAudienceFilter?: boolean;
  questions?: QuestionDto[] | null;
  features?: SurveyFeatureDto[] | null;
  capabilities?: SurveyCapabilityDto[] | null;
  userLastResponse?: ResponseDto;
  userResponses?: ResponseDto[] | null;
  hasUserResponse?: boolean;
  canUserParticipate?: boolean;
  canParticipate?: boolean;
  participationMessage?: string | null;
  /** @format int32 */
  userAttemptCount?: number;
  /** @format int32 */
  remainingAttempts?: number;
  userEligibility?: UserEligibilityInfo;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
  /** @format int32 */
  responseCount?: number;
  /** @format int32 */
  uniqueParticipantCount?: number;
  isAcceptingResponses?: boolean;
  isAcceptingResponsesText?: string | null;
  duration?: TimeSpan;
  durationText?: string | null;
  timeRemaining?: TimeSpan;
  timeRemainingText?: string | null;
  isExpired?: boolean;
  isScheduled?: boolean;
  isActive?: boolean;
  /** @format double */
  userCompletionPercentage?: number | null;
  /** @format int32 */
  userAnsweredQuestions?: number;
  userHasCompletedSurvey?: boolean;
}

export interface SurveyDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SurveyDto;
}

export interface SurveyFeatureDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  surveyId?: string;
  featureCode?: string | null;
  featureTitleSnapshot?: string | null;
}

export interface SurveyOverviewResponse {
  /** @format uuid */
  id?: string;
  title?: string | null;
  description?: string | null;
  state?: string | null;
  stateText?: string | null;
  /** @format date-time */
  startAt?: string | null;
  /** @format date-time */
  endAt?: string | null;
  isAnonymous?: boolean;
  /** @format date-time */
  createdAt?: string;
  /** @format int32 */
  maxAttemptsPerMember?: number;
  allowMultipleSubmissions?: boolean;
  /** @format int32 */
  coolDownSeconds?: number | null;
  allowBackNavigation?: boolean;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
  estimatedDuration?: TimeSpan;
  featureCodes?: string[] | null;
  capabilityCodes?: string[] | null;
  audienceFilter?: string | null;
  /** @format int32 */
  structureVersion?: number;
  isStructureFrozen?: boolean;
}

export interface SurveyOverviewResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SurveyOverviewResponse;
}

export interface SurveyQuestionsDetailsResponse {
  /** @format uuid */
  surveyId?: string;
  surveyTitle?: string | null;
  surveyDescription?: string | null;
  surveyState?: SurveyStateInfoDto;
  questions?: QuestionDetailsDto[] | null;
  userAnswerStatus?: UserAnswerStatusDto;
  statistics?: SurveyStatisticsDto;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
}

export interface SurveyQuestionsDetailsResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SurveyQuestionsDetailsResponse;
}

export interface SurveyQuestionsResponse {
  /** @format uuid */
  surveyId?: string;
  surveyTitle?: string | null;
  surveyDescription?: string | null;
  questions?: QuestionDto[] | null;
  hasUserResponse?: boolean;
  /** @format uuid */
  userResponseId?: string | null;
  /** @format int32 */
  userAttemptNumber?: number | null;
}

export interface SurveyQuestionsResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SurveyQuestionsResponse;
}

export interface SurveyQuestionsWithAnswersResponse {
  /** @format uuid */
  surveyId?: string;
  surveyTitle?: string | null;
  surveyDescription?: string | null;
  questions?: QuestionWithAnswersDto[] | null;
  responseInfo?: ResponseInfoDto;
  hasUserResponse?: boolean;
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format double */
  completionPercentage?: number;
}

export interface SurveyQuestionsWithAnswersResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SurveyQuestionsWithAnswersResponse;
}

export interface SurveyStateInfoDto {
  state?: string | null;
  stateText?: string | null;
  isActive?: boolean;
  isAcceptingResponses?: boolean;
  /** @format date-time */
  startAt?: string | null;
  /** @format date-time */
  endAt?: string | null;
  isAnonymous?: boolean;
  participationPolicy?: ParticipationPolicyDto;
}

export interface SurveyStatisticsDto {
  /** @format int32 */
  totalQuestions?: number;
  /** @format int32 */
  requiredQuestions?: number;
  /** @format int32 */
  responseCount?: number;
  /** @format int32 */
  uniqueParticipantCount?: number;
  /** @format int32 */
  submittedResponseCount?: number;
  /** @format int32 */
  activeResponseCount?: number;
  /** @format int32 */
  canceledResponseCount?: number;
  /** @format int32 */
  expiredResponseCount?: number;
  /** @format double */
  averageCompletionPercentage?: number;
  /** @format double */
  averageResponseTime?: number;
  isAcceptingResponses?: boolean;
  isAcceptingResponsesText?: string | null;
}

export interface SurveysWithUserLastResponseResponse {
  surveys?: SurveyDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  /** @format int32 */
  userParticipatedSurveys?: number;
  /** @format int32 */
  userCompletedSurveys?: number;
  /** @format int32 */
  userActiveSurveys?: number;
  /** @format int32 */
  userAvailableSurveys?: number;
  queryExecutionTime?: TimeSpan;
  /** @format date-time */
  queryExecutedAt?: string;
}

export interface SurveysWithUserLastResponseResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SurveysWithUserLastResponseResponse;
}

export interface SurveysWithUserResponsesResponse {
  surveys?: SurveyDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  searchTerm?: string | null;
  appliedFilters?: string | null;
  /** @format int32 */
  filteredCount?: number;
  /** @format int32 */
  userParticipatedSurveys?: number;
  /** @format int32 */
  userCompletedSurveys?: number;
  /** @format int32 */
  userActiveSurveys?: number;
  /** @format int32 */
  userAvailableSurveys?: number;
  /** @format int32 */
  totalActiveSurveys?: number;
  /** @format int32 */
  totalScheduledSurveys?: number;
  /** @format int32 */
  totalClosedSurveys?: number;
  /** @format int32 */
  totalArchivedSurveys?: number;
  queryExecutionTime?: TimeSpan;
  /** @format date-time */
  queryExecutedAt?: string;
}

export interface SurveysWithUserResponsesResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: SurveysWithUserResponsesResponse;
}

export interface TimeSpan {
  /** @format int64 */
  ticks?: number;
  /** @format int32 */
  days?: number;
  /** @format int32 */
  hours?: number;
  /** @format int32 */
  milliseconds?: number;
  /** @format int32 */
  microseconds?: number;
  /** @format int32 */
  nanoseconds?: number;
  /** @format int32 */
  minutes?: number;
  /** @format int32 */
  seconds?: number;
  /** @format double */
  totalDays?: number;
  /** @format double */
  totalHours?: number;
  /** @format double */
  totalMilliseconds?: number;
  /** @format double */
  totalMicroseconds?: number;
  /** @format double */
  totalNanoseconds?: number;
  /** @format double */
  totalMinutes?: number;
  /** @format double */
  totalSeconds?: number;
}

export interface TourBriefDto {
  /** @format uuid */
  id?: string;
  title?: string | null;
  /** @format date-time */
  tourStart?: string;
  /** @format date-time */
  tourEnd?: string;
  status?: string | null;
  isActive?: boolean;
}

export interface TourDetailWithUserReservationDto {
  /** @format uuid */
  id?: string;
  title?: string | null;
  /** @format date-time */
  tourStart?: string;
  /** @format date-time */
  tourEnd?: string;
  isActive?: boolean;
  status?: string | null;
  capacityState?: string | null;
  /** @format date-time */
  registrationStart?: string | null;
  /** @format date-time */
  registrationEnd?: string | null;
  isRegistrationOpen?: boolean;
  /** @format int32 */
  maxCapacity?: number;
  /** @format int32 */
  remainingCapacity?: number;
  /** @format int32 */
  reservedCapacity?: number;
  /** @format double */
  utilizationPct?: number;
  isFullyBooked?: boolean;
  isNearlyFull?: boolean;
  agencies?: AgencyDetailDto[] | null;
  features?: FeatureDetailDto[] | null;
  photos?: PhotoDetailDto[] | null;
  /** @format double */
  lowestPriceRials?: number | null;
  /** @format double */
  highestPriceRials?: number | null;
  hasDiscount?: boolean;
  pricing?: PricingDetailDto[] | null;
  description?: string | null;
  longDescription?: string | null;
  summary?: string | null;
  /** @format int32 */
  minAge?: number | null;
  /** @format int32 */
  maxAge?: number | null;
  /** @format int32 */
  maxGuestsPerReservation?: number | null;
  requiredCapabilities?: RequiredCapabilityDto[] | null;
  requiredFeatures?: RequiredFeatureDto[] | null;
  capacities?: CapacityDetailDto[] | null;
  restrictedTours?: RestrictedTourSummaryDto[] | null;
  /** @format int32 */
  totalReservations?: number | null;
  /** @format int32 */
  confirmedReservations?: number | null;
  /** @format int32 */
  pendingReservations?: number | null;
  /** @format int32 */
  cancelledReservations?: number | null;
  userReservationTrackingCode?: string | null;
  /** @format date-time */
  userReservationDate?: string | null;
  /** @format date-time */
  userReservationExpiryDate?: string | null;
  reservation?: ReservationDto;
}

export interface TourDetailWithUserReservationDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: TourDetailWithUserReservationDto;
}

export interface TourWithUserReservationDto {
  /** @format uuid */
  id?: string;
  title?: string | null;
  /** @format date-time */
  tourStart?: string;
  /** @format date-time */
  tourEnd?: string;
  isActive?: boolean;
  status?: string | null;
  capacityState?: string | null;
  /** @format date-time */
  registrationStart?: string | null;
  /** @format date-time */
  registrationEnd?: string | null;
  isRegistrationOpen?: boolean;
  /** @format int32 */
  maxCapacity?: number;
  /** @format int32 */
  remainingCapacity?: number;
  /** @format int32 */
  reservedCapacity?: number;
  /** @format double */
  utilizationPct?: number;
  isFullyBooked?: boolean;
  isNearlyFull?: boolean;
  agencies?: AgencySummaryDto[] | null;
  features?: FeatureSummaryDto[] | null;
  photos?: PhotoSummaryDto[] | null;
  /** @format double */
  lowestPriceRials?: number | null;
  /** @format double */
  highestPriceRials?: number | null;
  hasDiscount?: boolean;
  pricing?: PricingDetailDto[] | null;
  reservation?: ReservationSummaryDto;
}

export interface TourWithUserReservationDtoPaginatedResult {
  items?: TourWithUserReservationDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface TourWithUserReservationDtoPaginatedResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: TourWithUserReservationDtoPaginatedResult;
}

export interface UnreadCountResponse {
  /** @format int32 */
  totalCount?: number;
  contextBreakdown?: Record<string, number | null>;
  actionBreakdown?: Record<string, number | null>;
}

export interface UnreadCountResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: UnreadCountResponse;
}

export interface UpdateAgencyRequest {
  /** @format uuid */
  id: string;
  /**
   * @minLength 2
   * @maxLength 50
   */
  code: string;
  /**
   * @minLength 2
   * @maxLength 50
   */
  externalCode: string;
  /**
   * @minLength 2
   * @maxLength 200
   */
  name: string;
  /**
   * @minLength 5
   * @maxLength 500
   */
  address: string;
  /**
   * @minLength 0
   * @maxLength 100
   */
  managerName?: string | null;
  /**
   * @format tel
   * @minLength 0
   * @maxLength 20
   */
  managerPhone?: string | null;
  isActive?: boolean;
  /** @format date-time */
  establishedDate?: string | null;
}

export interface UpdateRoleRequest {
  name?: string | null;
  description?: string | null;
  /** @format int32 */
  displayOrder?: number;
}

export interface UpdateSettingCommand {
  /** @format uuid */
  settingId?: string;
  newValue?: string | null;
  changeReason?: string | null;
}

export interface UpdateSettingResponse {
  /** @format uuid */
  settingId?: string;
  newValue?: string | null;
  /** @format uuid */
  changeEventId?: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format uuid */
  changedByUserId?: string;
}

export interface UpdateUserCommand {
  /** @format uuid */
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  nationalId?: string | null;
}

export interface UserAnswerStatusDto {
  /** @format uuid */
  responseId?: string | null;
  /** @format int32 */
  attemptNumber?: number | null;
  /** @format date-time */
  lastAnsweredAt?: string | null;
  /** @format int32 */
  answeredQuestions?: number;
  /** @format int32 */
  totalQuestions?: number;
  /** @format double */
  completionPercentage?: number;
  isComplete?: boolean;
  canContinue?: boolean;
  statusMessage?: string | null;
}

export interface UserClaimDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  userId?: string;
  claim?: ClaimDto;
  isActive?: boolean;
  /** @format date-time */
  assignedAt?: string;
  /** @format date-time */
  expiresAt?: string | null;
  assignedBy?: string | null;
  notes?: string | null;
}

export interface UserDetailDto {
  /** @format uuid */
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  nationalId?: string | null;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  /** @format date-time */
  phoneVerifiedAt?: string | null;
  isActive?: boolean;
  /** @format date-time */
  lastLoginAt?: string | null;
  /** @format date-time */
  lastAuthenticatedAt?: string | null;
  /** @format int32 */
  failedAttempts?: number;
  /** @format date-time */
  lockedAt?: string | null;
  lockReason?: string | null;
  /** @format date-time */
  unlockAt?: string | null;
  lastIpAddress?: string | null;
  lastUserAgent?: string | null;
  lastDeviceFingerprint?: string | null;
  /** @format date-time */
  createdAtUtc?: string;
  createdBy?: string | null;
  /** @format date-time */
  updatedAtUtc?: string | null;
  updatedBy?: string | null;
  roles?: UserRoleDto[] | null;
  claims?: UserClaimDto[] | null;
  preferences?: UserPreferenceDto[] | null;
}

export interface UserDetailDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: UserDetailDto;
}

export interface UserDto {
  /** @format uuid */
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  nationalId?: string | null;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  /** @format date-time */
  phoneVerifiedAt?: string | null;
  isActive?: boolean;
  /** @format date-time */
  lastLoginAt?: string | null;
  /** @format date-time */
  lastAuthenticatedAt?: string | null;
  /** @format int32 */
  failedAttempts?: number;
  /** @format date-time */
  lockedAt?: string | null;
  lockReason?: string | null;
  /** @format date-time */
  unlockAt?: string | null;
  lastIpAddress?: string | null;
  lastUserAgent?: string | null;
  lastDeviceFingerprint?: string | null;
  /** @format date-time */
  createdAtUtc?: string;
  createdBy?: string | null;
  /** @format date-time */
  updatedAtUtc?: string | null;
  updatedBy?: string | null;
}

export interface UserDtoPaginatedResult {
  items?: UserDto[] | null;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface UserDtoPaginatedResultApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: UserDtoPaginatedResult;
}

export interface UserEligibilityDto {
  isEligible?: boolean;
  validationMessage?: string | null;
  validationErrors?: string[] | null;
  meetsFeatureRequirements?: boolean;
  meetsCapabilityRequirements?: boolean;
  missingFeatures?: string[] | null;
  missingCapabilities?: string[] | null;
}

export interface UserEligibilityInfo {
  canParticipate?: boolean;
  message?: string | null;
  errorCode?: string | null;
  isSurveyActive?: boolean;
  isWithinTimeWindow?: boolean;
  hasRequiredCapabilities?: boolean;
  hasRequiredFeatures?: boolean;
  withinAttemptLimit?: boolean;
  notInCooldown?: boolean;
  canSubmitMultiple?: boolean;
  missingCapabilities?: string[] | null;
  missingFeatures?: string[] | null;
  /** @format date-time */
  surveyStartTime?: string | null;
  /** @format date-time */
  surveyEndTime?: string | null;
  /** @format date-time */
  cooldownEndTime?: string | null;
  /** @format int32 */
  remainingCooldownSeconds?: number | null;
  /** @format int32 */
  currentAttempts?: number;
  /** @format int32 */
  maxAllowedAttempts?: number;
  /** @format int32 */
  remainingAttempts?: number;
}

export interface UserPreferenceDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  userId?: string;
  key?: string | null;
  value?: PreferenceValueDto;
  category?: string | null;
  /** @format int32 */
  displayOrder?: number;
  isActive?: boolean;
}

export interface UserRequestHistoryDto {
  /** @format uuid */
  requestId?: string;
  status?: string | null;
  statusText?: string | null;
  /** @format double */
  requestedAmountRials?: number;
  /** @format double */
  approvedAmountRials?: number | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  approvedAt?: string | null;
  /** @format date-time */
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  /** @format int32 */
  daysSinceCreated?: number;
  isInProgress?: boolean;
  isCompleted?: boolean;
  isRejected?: boolean;
  isCancelled?: boolean;
}

export interface UserResponseStatusDto {
  /** @format uuid */
  responseId?: string;
  /** @format int32 */
  attemptNumber?: number;
  attemptStatus?: string | null;
  attemptStatusTextFa?: string | null;
  responseStatus?: string | null;
  responseStatusTextFa?: string | null;
  /** @format date-time */
  startedAt?: string | null;
  /** @format date-time */
  startedAtLocal?: string | null;
  /** @format date-time */
  submittedAt?: string | null;
  /** @format date-time */
  submittedAtLocal?: string | null;
  /** @format int32 */
  questionsAnswered?: number;
  /** @format int32 */
  questionsTotal?: number;
  /** @format int32 */
  completionPercentage?: number;
  isActive?: boolean;
  isSubmitted?: boolean;
  canContinue?: boolean;
  nextActionText?: string | null;
}

export interface UserRoleDto {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  userId?: string;
  /** @format uuid */
  roleId?: string;
  roleName?: string | null;
  isActive?: boolean;
  /** @format date-time */
  assignedAt?: string;
  /** @format date-time */
  expiresAt?: string | null;
  assignedBy?: string | null;
  notes?: string | null;
}

export interface UserSurveyResponsesResponse {
  /** @format uuid */
  surveyId?: string;
  surveyTitle?: string | null;
  surveyDescription?: string | null;
  responses?: ResponseDto[] | null;
  /** @format int32 */
  totalAttempts?: number;
  /** @format int32 */
  completedAttempts?: number;
  /** @format int32 */
  activeAttempts?: number;
  /** @format int32 */
  canceledAttempts?: number;
  /** @format int32 */
  expiredAttempts?: number;
  latestResponse?: ResponseDto;
  hasActiveResponse?: boolean;
  canStartNewAttempt?: boolean;
  nextActionText?: string | null;
  /** @format int32 */
  maxAttemptsAllowed?: number;
  /** @format int32 */
  remainingAttempts?: number;
  isSurveyActive?: boolean;
  surveyStatusText?: string | null;
}

export interface UserSurveyResponsesResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: UserSurveyResponsesResponse;
}

export interface ValidateNationalCodeRequest {
  nationalCode?: string | null;
}

export interface ValidateNationalCodesResponse {
  nationalCode?: string | null;
  isValidFormat?: boolean;
  exists?: boolean;
  fullName?: string | null;
  membershipNumber?: string | null;
}

export interface ValidateNationalCodesResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: ValidateNationalCodesResponse;
}

export interface VerifyOtpRequest {
  challengeId?: string | null;
  otpCode?: string | null;
  scope?: string | null;
}

export interface VerifyOtpResponse {
  /** @format uuid */
  userId?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  /** @format int32 */
  expiryMinutes?: number;
  isRegistered?: boolean;
  requiresRegistrationCompletion?: boolean;
}

export interface VerifyOtpResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: VerifyOtpResponse;
}

export interface WalletBalanceAnalysisDto {
  /** @format double */
  startingBalanceRials?: number;
  /** @format double */
  endingBalanceRials?: number;
  /** @format double */
  totalInflowRials?: number;
  /** @format double */
  totalOutflowRials?: number;
  /** @format int32 */
  totalTransactions?: number;
  trendPoints?: BalanceTrendPointDto[] | null;
}

export interface WalletBalanceResponse {
  /** @format uuid */
  walletId?: string;
  /** @format uuid */
  userExternalUserId?: string;
  userFullName?: string | null;
  /** @format double */
  currentBalanceRials?: number;
  status?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  lastTransactionAt?: string | null;
  lastTransaction?: WalletTransactionSummaryDto;
  recentTransactions?: WalletTransactionSummaryDto[] | null;
  balanceAnalysis?: WalletBalanceAnalysisDto;
}

export interface WalletBalanceResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: WalletBalanceResponse;
}

export interface WalletDepositDetailsDto {
  /** @format uuid */
  depositId?: string;
  /** @format uuid */
  walletId?: string;
  /** @format uuid */
  externalUserId?: string;
  trackingCode?: string | null;
  /** @format double */
  amountRials?: number;
  currency?: string | null;
  status?: string | null;
  /** @format date-time */
  requestedAt?: string;
  /** @format date-time */
  completedAt?: string | null;
}

export interface WalletDepositDetailsDtoApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: WalletDepositDetailsDto;
}

export interface WalletDepositDto {
  /** @format uuid */
  depositId?: string;
  /** @format uuid */
  walletId?: string;
  trackingCode?: string | null;
  /** @format uuid */
  externalUserId?: string;
  /** @format double */
  amountRials?: number;
  status?: string | null;
  statusText?: string | null;
  description?: string | null;
  externalReference?: string | null;
  /** @format date-time */
  requestedAt?: string;
  /** @format date-time */
  completedAt?: string | null;
  metadata?: Record<string, string>;
}

export interface WalletDepositsResponse {
  /** @format uuid */
  externalUserId?: string;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalPages?: number;
  deposits?: WalletDepositDto[] | null;
}

export interface WalletDepositsResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: WalletDepositsResponse;
}

export interface WalletTransactionDetailDto {
  /** @format uuid */
  transactionId?: string;
  transactionType?: string | null;
  /** @format double */
  amountRials?: number;
  /** @format double */
  balanceBeforeRials?: number;
  /** @format double */
  previousBalanceRials?: number;
  status?: string | null;
  /** @format date-time */
  createdAt?: string;
  referenceId?: string | null;
  externalReference?: string | null;
  description?: string | null;
  metadata?: Record<string, string>;
}

export interface WalletTransactionStatisticsDto {
  /** @format int32 */
  totalTransactions?: number;
  /** @format int32 */
  depositTransactions?: number;
  /** @format int32 */
  withdrawalTransactions?: number;
  /** @format int32 */
  transferInTransactions?: number;
  /** @format int32 */
  transferOutTransactions?: number;
  /** @format int32 */
  paymentTransactions?: number;
  /** @format int32 */
  refundTransactions?: number;
  /** @format int32 */
  adjustmentTransactions?: number;
  /** @format double */
  totalDepositRials?: number;
  /** @format double */
  totalWithdrawalRials?: number;
  /** @format double */
  totalTransferInRials?: number;
  /** @format double */
  totalTransferOutRials?: number;
  /** @format double */
  totalPaymentRials?: number;
  /** @format double */
  totalRefundRials?: number;
  /** @format double */
  totalAdjustmentRials?: number;
}

export interface WalletTransactionSummaryDto {
  /** @format uuid */
  transactionId?: string;
  transactionType?: string | null;
  /** @format double */
  amountRials?: number;
  /** @format double */
  previousBalanceRials?: number;
  status?: string | null;
  /** @format date-time */
  createdAt?: string;
  referenceId?: string | null;
  externalReference?: string | null;
  description?: string | null;
}

export interface WalletTransactionsResponse {
  /** @format uuid */
  walletId?: string;
  /** @format uuid */
  userExternalUserId?: string;
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalPages?: number;
  transactions?: WalletTransactionDetailDto[] | null;
  statistics?: WalletTransactionStatisticsDto;
}

export interface WalletTransactionsResponseApplicationResult {
  isSuccess?: boolean;
  status?: ResultStatus;
  message?: string | null;
  errors?: string[] | null;
  data?: WalletTransactionsResponse;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Nezam Refahi API
 * @version v1
 * @contact Development Team <support@nezamrefahi.com>
 *
 * API for Nezam Refahi application
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 Sends an OTP (One-Time Password) code to the user's phone number for authentication purposes
     *
     * @tags Authentication
     * @name SendOtp
     * @summary Send OTP Code
     * @request POST:/api/v1/auth/otp
     */
    sendOtp: (data: SendOtpRequest, params: RequestParams = {}) =>
      this.request<
        SendOtpResponseApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/auth/otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 Verifies an OTP code and returns authentication tokens if successful
     *
     * @tags Authentication
     * @name VerifyOtp
     * @summary Verify OTP Code
     * @request POST:/api/v1/auth/otp/verify
     */
    verifyOtp: (data: VerifyOtpRequest, params: RequestParams = {}) =>
      this.request<
        VerifyOtpResponseApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/auth/otp/verify`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 RefreshToken an OTP code and returns authentication tokens if successful
     *
     * @tags Authentication
     * @name RefreshToken
     * @summary RefreshToken
     * @request POST:/api/v1/auth/refresh
     */
    refreshToken: (data: RefreshTokenRequest, params: RequestParams = {}) =>
      this.request<
        RefreshTokenResponseApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/auth/refresh`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Retrieves the profile information of the currently authenticated user
     *
     * @tags Authentication
     * @name GetCurrentUser
     * @summary Get Current UserDetail Profile
     * @request GET:/api/v1/auth/profile
     * @secure
     */
    getCurrentUser: (data: any, params: RequestParams = {}) =>
      this.request<
        CurrentUserResponseApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/auth/profile`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Logs out the user and revokes both access and refresh tokens
     *
     * @tags Authentication
     * @name Logout
     * @summary UserDetail Logout
     * @request POST:/api/v1/auth/logout
     * @secure
     */
    logout: (data: LogoutRequest, params: RequestParams = {}) =>
      this.request<
        LogoutResponseApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/auth/logout`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 Validates a national code format and checks if a member exists with this national code
     *
     * @tags Authentication
     * @name ValidateNationalCode
     * @summary Validate National Code
     * @request POST:/api/v1/auth/validate-national-code
     */
    validateNationalCode: (
      data: ValidateNationalCodeRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ValidateNationalCodesResponseApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/auth/validate-national-code`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns a paginated list of BillDto for the current user with filtering and sorting.
     *
     * @tags Bills
     * @name GetMyBills
     * @summary List current user's bills (paginated)
     * @request GET:/api/v1/me/bills
     * @secure
     */
    getMyBills: (
      data: any,
      query?: {
        status?: string;
        billType?: string;
        searchTerm?: string;
        /**
         * @format int32
         * @default 1
         */
        pageNumber?: number;
        /**
         * @format int32
         * @default 20
         */
        pageSize?: number;
        /** @default "IssueDate" */
        sortBy?: string;
        /** @default "desc" */
        sortDirection?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        BillDtoPaginatedResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/me/bills`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Admin/operator variant. Requires explicit externalUserId.
     *
     * @tags Discount Codes
     * @name ValidateDiscountCodeForUser
     * @summary Validate a discount code for a specific user's bill
     * @request GET:/api/v1/me/bills/{billId}/discount-codes/{code}/validation
     * @secure
     */
    validateDiscountCodeForUser: (
      billId: string,
      code: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        DiscountValidationDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/me/bills/${billId}/discount-codes/${code}/validation`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns BillDetailDto including items, payments, and refunds. User can only access their own bills.
     *
     * @tags Bills
     * @name GetBillDetailsById
     * @summary Get bill details by Id
     * @request GET:/api/v1/bills/{billId}
     * @secure
     */
    getBillDetailsById: (
      billId: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        BillDetailDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/bills/${billId}`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns a paginated list of payments (PaymentDto) associated with a given bill ID. Supports search, sorting, and pagination.
     *
     * @tags Payments
     * @name GetBillPayments
     * @summary Get payments for a specific bill
     * @request GET:/api/v1/bills/{billId}/payments
     * @secure
     */
    getBillPayments: (
      billId: string,
      query: {
        searchTerm?: string;
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        sortBy: string;
        sortDirection: string;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        PaymentDtoPaginatedResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/bills/${billId}/payments`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns BillDetailDto including items, payments, and refunds.
     *
     * @tags Bills
     * @name GetBillDetailsByNumber
     * @summary Get bill details by bill number
     * @request GET:/api/v1/bills/by-number/{billNumber}
     * @secure
     */
    getBillDetailsByNumber: (
      billNumber: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        BillDetailDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/bills/by-number/${billNumber}`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Resolves a bill by tracking code (reference) and bill type; returns BillDetailDto.
     *
     * @tags Bills
     * @name GetBillDetailsByTrackingCode
     * @summary Get bill details by tracking code
     * @request GET:/api/v1/bills/by-tracking/{trackingCode}
     * @secure
     */
    getBillDetailsByTrackingCode: (
      trackingCode: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        BillDetailDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/bills/by-tracking/${trackingCode}`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Transitions a draft bill to the issued state.
     *
     * @tags Bills
     * @name IssueBill
     * @summary Issue a bill
     * @request POST:/api/v1/bills/{billId}/issue
     * @secure
     */
    issueBill: (billId: string, data: any, params: RequestParams = {}) =>
      this.request<
        IssueBillResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/bills/${billId}/issue`,
        method: "POST",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Cancels an active bill; returns operation result.
     *
     * @tags Bills
     * @name CancelBill
     * @summary Cancel a bill
     * @request POST:/api/v1/bills/{billId}/cancel
     * @secure
     */
    cancelBill: (
      billId: string,
      data: CancelBillRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        CancelBillResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/bills/${billId}/cancel`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 Returns a list of all distinct claims from registered claim providers.
     *
     * @tags Claims
     * @name GetClaims
     * @summary Get All Available Claims
     * @request GET:/api/v1/claims
     * @secure
     */
    getClaims: (data: any, params: RequestParams = {}) =>
      this.request<
        ClaimDtoIEnumerableApplicationResult,
        | ClaimDtoIEnumerableApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/claims`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name GetFacilities
     * @request GET:/api/v1/facilities
     * @secure
     */
    getFacilities: (
      query?: {
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * @format int32
         * @default 10
         */
        pageSize?: number;
        searchTerm?: string;
        /** @default true */
        onlyActive?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GetFacilitiesResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name GetFacilityDetails
     * @request GET:/api/v1/facilities/{facilityId}
     * @secure
     */
    getFacilityDetails: (
      facilityId: string,
      query?: {
        /** @default true */
        includeCycles?: boolean;
        /** @default true */
        includeFeatures?: boolean;
        /** @default true */
        includePolicies?: boolean;
        /** @default false */
        includeUserRequestHistory?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        FacilityDetailsDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/${facilityId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name GetFacilityCyclesWithUser
     * @request GET:/api/v1/facilities/{facilityId}/cycles
     * @secure
     */
    getFacilityCyclesWithUser: (
      facilityId: string,
      query?: {
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * @format int32
         * @default 10
         */
        pageSize?: number;
        status?: string;
        searchTerm?: string;
        /** @default true */
        onlyActive?: boolean;
        /** @default false */
        onlyEligible?: boolean;
        /** @default false */
        onlyWithUserRequests?: boolean;
        /** @default true */
        includeUserRequestStatus?: boolean;
        /** @default false */
        includeDetailedRequestInfo?: boolean;
        /** @default true */
        includeStatistics?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GetFacilityCyclesWithUserQueryResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/${facilityId}/cycles`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name GetFacilityCycleDetails
     * @request GET:/api/v1/facilities/cycles/{cycleId}
     * @secure
     */
    getFacilityCycleDetails: (
      cycleId: string,
      query?: {
        /** @default true */
        includeFacilityInfo?: boolean;
        /** @default true */
        includeUserRequestHistory?: boolean;
        /** @default true */
        includeEligibilityDetails?: boolean;
        /** @default true */
        includeDependencies?: boolean;
        /** @default true */
        includeStatistics?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        FacilityCycleWithUserDetailDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/cycles/${cycleId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name GetFacilityRequestsByUser
     * @request GET:/api/v1/facilities/requests
     * @secure
     */
    getFacilityRequestsByUser: (
      query?: {
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * @format int32
         * @default 10
         */
        pageSize?: number;
        /** @format uuid */
        facilityId?: string;
        /** @format uuid */
        facilityCycleId?: string;
        status?: string;
        searchTerm?: string;
        /** @format date-time */
        dateFrom?: string;
        /** @format date-time */
        dateTo?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GetFacilityRequestsByUserQueryResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/requests`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name CreateFacilityRequest
     * @request POST:/api/v1/facilities/requests
     * @secure
     */
    createFacilityRequest: (
      data: CreateFacilityRequestCommand,
      params: RequestParams = {},
    ) =>
      this.request<
        CreateFacilityRequestResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/requests`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name GetFacilityRequestDetails
     * @request GET:/api/v1/facilities/requests/{requestId}
     * @secure
     */
    getFacilityRequestDetails: (
      requestId: string,
      query?: {
        /** @default true */
        includeFacility?: boolean;
        /** @default true */
        includeCycle?: boolean;
        /** @default true */
        includePolicySnapshot?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        FacilityRequestDetailsDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/requests/${requestId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name ApproveFacilityRequest
     * @request POST:/api/v1/facilities/requests/{requestId}/approve
     * @secure
     */
    approveFacilityRequest: (
      requestId: string,
      data: ApproveFacilityRequestRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ApproveFacilityRequestResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/requests/${requestId}/approve`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name RejectFacilityRequest
     * @request POST:/api/v1/facilities/requests/{requestId}/reject
     * @secure
     */
    rejectFacilityRequest: (
      requestId: string,
      data: RejectFacilityRequestRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        RejectFacilityRequestResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/requests/${requestId}/reject`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Facilities
     * @name CancelFacilityRequest
     * @request POST:/api/v1/facilities/requests/{requestId}/cancel
     * @secure
     */
    cancelFacilityRequest: (
      requestId: string,
      data: CancelFacilityRequestRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        CancelFacilityRequestResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/facilities/requests/${requestId}/cancel`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Me · Tours
     * @name MeGetToursPaginated
     * @request GET:/api/me/recreation/tours/paginated
     * @secure
     */
    meGetToursPaginated: (
      query: {
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        search?: string;
        isActive?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        TourWithUserReservationDtoPaginatedResultApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/tours/paginated`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Me · Tours
     * @name MeGetTourDetails
     * @request GET:/api/me/recreation/tours/{id}
     * @secure
     */
    meGetTourDetails: (id: string, params: RequestParams = {}) =>
      this.request<
        TourDetailWithUserReservationDtoApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/tours/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns membership information for the currently authenticated user
     *
     * @tags Membership
     * @name GetCurrentMember
     * @summary Get current member info
     * @request GET:/api/v1/membership/me/member
     * @secure
     */
    getCurrentMember: (data: any, params: RequestParams = {}) =>
      this.request<
        ObjectApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/membership/me/member`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Synchronizes the current member from external source and returns MemberDto
     *
     * @tags Membership
     * @name SyncCurrentMember
     * @summary Sync current member
     * @request POST:/api/v1/membership/me/member/sync
     * @secure
     */
    syncCurrentMember: (data: any, params: RequestParams = {}) =>
      this.request<
        ObjectApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/membership/me/member/sync`,
        method: "POST",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns a paginated list of notifications for a specific user with optional filtering.
     *
     * @tags Notifications
     * @name GetUserNotificationsPaginated
     * @summary Get User Notifications (Paginated)
     * @request GET:/api/v1/notifications/user/paginated
     * @secure
     */
    getUserNotificationsPaginated: (
      query: {
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        isRead?: boolean;
        context?: string;
        action?: string;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        NotificationDtoPaginatedResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user/paginated`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns all notifications for a specific user with optional filtering.
     *
     * @tags Notifications
     * @name GetAllUserNotifications
     * @summary Get All User Notifications
     * @request GET:/api/v1/notifications/user
     * @secure
     */
    getAllUserNotifications: (
      data: any,
      query?: {
        isRead?: boolean;
        context?: string;
        action?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        NotificationDtoPaginatedResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Gets the count of unread notifications for a specific user.
     *
     * @tags Notifications
     * @name GetUnreadCount
     * @summary Get Unread Count
     * @request GET:/api/v1/notifications/user/unread-count
     * @secure
     */
    getUnreadCount: (data: any, params: RequestParams = {}) =>
      this.request<
        UnreadCountResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user/unread-count`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Gets the count of unread notifications grouped by context for a specific user.
     *
     * @tags Notifications
     * @name GetUnreadCountByContext
     * @summary Get Unread Count by Context
     * @request GET:/api/v1/notifications/user/unread-count/context
     * @secure
     */
    getUnreadCountByContext: (data: any, params: RequestParams = {}) =>
      this.request<
        UnreadCountResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user/unread-count/context`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Gets the count of unread notifications grouped by action for a specific user.
     *
     * @tags Notifications
     * @name GetUnreadCountByAction
     * @summary Get Unread Count by Action
     * @request GET:/api/v1/notifications/user/unread-count/action
     * @secure
     */
    getUnreadCountByAction: (data: any, params: RequestParams = {}) =>
      this.request<
        UnreadCountResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user/unread-count/action`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Marks a specific notification as read for a user.
     *
     * @tags Notifications
     * @name MarkAsRead
     * @summary Mark Notification as Read
     * @request PUT:/api/v1/notifications/{notificationId}/read
     * @secure
     */
    markAsRead: (
      notificationId: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/${notificationId}/read`,
        method: "PUT",
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Marks all notifications as read for a specific user.
     *
     * @tags Notifications
     * @name MarkAllAsRead
     * @summary Mark All Notifications as Read
     * @request PUT:/api/v1/notifications/user/mark-all-read
     * @secure
     */
    markAllAsRead: (data: any, params: RequestParams = {}) =>
      this.request<
        void,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user/mark-all-read`,
        method: "PUT",
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Marks all notifications of a specific context as read for a user.
     *
     * @tags Notifications
     * @name MarkByContextAsRead
     * @summary Mark Notifications by Context as Read
     * @request PUT:/api/v1/notifications/user/mark-context-read
     * @secure
     */
    markByContextAsRead: (
      data: MarkByContextAsReadRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user/mark-context-read`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Marks all notifications of a specific action as read for a user.
     *
     * @tags Notifications
     * @name MarkByActionAsRead
     * @summary Mark Notifications by Action as Read
     * @request PUT:/api/v1/notifications/user/mark-action-read
     * @secure
     */
    markByActionAsRead: (
      data: MarkByActionAsReadRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/notifications/user/mark-action-read`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Payments
     * @name MeGetPaymentsPaginated
     * @request GET:/api/me/finance/payments/paginated
     * @secure
     */
    meGetPaymentsPaginated: (
      query: {
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        status?: string;
        search?: string;
        /** @format date-time */
        fromDate?: string;
        /** @format date-time */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaymentDtoPaginatedResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/finance/payments/paginated`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Payments
     * @name MeCreatePayment
     * @request POST:/api/me/finance/payments
     * @secure
     */
    meCreatePayment: (data: CreatePaymentCommand, params: RequestParams = {}) =>
      this.request<
        CreatePaymentResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/finance/payments`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Payments
     * @name MePayWithWallet
     * @request POST:/api/me/finance/payments/wallet
     * @secure
     */
    mePayWithWallet: (data: PayWithWalletCommand, params: RequestParams = {}) =>
      this.request<
        PayWithWalletResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/finance/payments/wallet`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Payments
     * @name MeGetPaymentDetail
     * @request GET:/api/me/finance/payments/{paymentId}
     * @secure
     */
    meGetPaymentDetail: (paymentId: string, params: RequestParams = {}) =>
      this.request<
        PaymentDetailDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/finance/payments/${paymentId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Payments
     * @name PaymentCallback
     * @request GET:/api/v1/payments/callback
     */
    paymentCallback: (params: RequestParams = {}) =>
      this.request<
        PaymentCallbackResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/payments/callback`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Payments
     * @name PaymentCallback2
     * @request POST:/api/v1/payments/callback
     * @originalName paymentCallback
     * @duplicate
     */
    paymentCallback2: (params: RequestParams = {}) =>
      this.request<
        PaymentCallbackResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/payments/callback`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Payments
     * @name PaymentSuccess
     * @request GET:/api/v1/payments/success
     */
    paymentSuccess: (params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/payments/success`,
        method: "GET",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Payments
     * @name PaymentFailed
     * @request GET:/api/v1/payments/failed
     */
    paymentFailed: (params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/payments/failed`,
        method: "GET",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Payments
     * @name GetSupportedPaymentGateways
     * @request GET:/api/v1/payments/gateways
     * @secure
     */
    getSupportedPaymentGateways: (params: RequestParams = {}) =>
      this.request<
        PaymentGatewayInfo[],
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/payments/gateways`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name GetActiveOffices
     * @summary Get all active representative offices
     * @request GET:/api/representative-offices
     * @secure
     */
    getActiveOffices: (params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name CreateOffice
     * @summary Create a new representative office
     * @request POST:/api/representative-offices
     * @secure
     */
    createOffice: (data: CreateAgencyRequest, params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name GetAllOffices
     * @summary Get all representative offices (including inactive)
     * @request GET:/api/representative-offices/all
     * @secure
     */
    getAllOffices: (params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices/all`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name GetOfficeById
     * @summary Get representative office by ID
     * @request GET:/api/representative-offices/{id}
     * @secure
     */
    getOfficeById: (id: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name UpdateOffice
     * @summary Update an existing representative office
     * @request PUT:/api/representative-offices/{id}
     * @secure
     */
    updateOffice: (
      id: string,
      data: UpdateAgencyRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name DeleteOffice
     * @summary Delete a representative office
     * @request DELETE:/api/representative-offices/{id}
     * @secure
     */
    deleteOffice: (id: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name GetOfficeByCode
     * @summary Get representative office by code
     * @request GET:/api/representative-offices/by-code/{code}
     * @secure
     */
    getOfficeByCode: (code: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices/by-code/${code}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 This endpoint requires authentication.
     *
     * @tags Representative Offices
     * @name GetOfficeByExternalCode
     * @summary Get representative office by external code
     * @request GET:/api/representative-offices/by-external-code/{externalCode}
     * @secure
     */
    getOfficeByExternalCode: (
      externalCode: string,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/representative-offices/by-external-code/${externalCode}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns all roles with optional filtering and includes.
     *
     * @tags Roles
     * @name GetAllRoles
     * @summary Get All Roles
     * @request GET:/api/v1/roles
     * @secure
     */
    getAllRoles: (
      query: {
        isActive?: boolean;
        isSystemRole?: boolean;
        includeClaims: boolean;
        includeUserCount: boolean;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Creates a new role in the system.
     *
     * @tags Roles
     * @name CreateRole
     * @summary Create Role
     * @request POST:/api/v1/roles
     * @secure
     */
    createRole: (data: CreateRoleRequest, params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns a paginated list of roles with optional search and filtering.
     *
     * @tags Roles
     * @name GetRolesPaginated
     * @summary Get Roles Paginated
     * @request GET:/api/v1/roles/paginated
     * @secure
     */
    getRolesPaginated: (
      query: {
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        searchTerm?: string;
        isActive?: boolean;
        isSystemRole?: boolean;
        sortBy: string;
        sortDirection: string;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles/paginated`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns a role by its unique identifier with claims and user count.
     *
     * @tags Roles
     * @name GetRoleById
     * @summary Get Role By ID
     * @request GET:/api/v1/roles/{id}
     * @secure
     */
    getRoleById: (id: string, data: any, params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles/${id}`,
        method: "GET",
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Updates an existing role's details.
     *
     * @tags Roles
     * @name UpdateRole
     * @summary Update Role
     * @request PUT:/api/v1/roles/{id}
     * @secure
     */
    updateRole: (
      id: string,
      data: UpdateRoleRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Deletes a role or deactivates it if users are assigned (with forceDelete=true).
     *
     * @tags Roles
     * @name DeleteRole
     * @summary Delete Role
     * @request DELETE:/api/v1/roles/{id}
     * @secure
     */
    deleteRole: (
      id: string,
      query: {
        forceDelete: boolean;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles/${id}`,
        method: "DELETE",
        query: query,
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Adds claims to an existing role.
     *
     * @tags Roles
     * @name AddClaimsToRole
     * @summary Add Claims to Role
     * @request POST:/api/v1/roles/{id}/claims
     * @secure
     */
    addClaimsToRole: (
      id: string,
      data: AddClaimsRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles/${id}/claims`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Removes claims from an existing role.
     *
     * @tags Roles
     * @name RemoveClaimsFromRole
     * @summary Remove Claims from Role
     * @request DELETE:/api/v1/roles/{id}/claims
     * @secure
     */
    removeClaimsFromRole: (
      id: string,
      data: RemoveClaimsRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        void,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/roles/${id}/claims`,
        method: "DELETE",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name CreateSection
     * @summary Create a new settings section
     * @request POST:/api/v1/settings/sections
     */
    createSection: (data: CreateSectionCommand, params: RequestParams = {}) =>
      this.request<CreateSectionResponse, ProblemDetails>({
        path: `/api/v1/settings/sections`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name CreateCategory
     * @summary Create a new settings category
     * @request POST:/api/v1/settings/categories
     */
    createCategory: (data: CreateCategoryCommand, params: RequestParams = {}) =>
      this.request<CreateCategoryResponse, ProblemDetails>({
        path: `/api/v1/settings/categories`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name SetSetting
     * @summary Create or update a setting
     * @request POST:/api/v1/settings
     */
    setSetting: (data: SetSettingCommand, params: RequestParams = {}) =>
      this.request<SetSettingResponse, ProblemDetails>({
        path: `/api/v1/settings`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name GetSettings
     * @summary Get settings with filters and pagination
     * @request GET:/api/v1/settings
     */
    getSettings: (
      query: {
        SectionName?: string;
        CategoryName?: string;
        SearchTerm?: string;
        Type?: string;
        OnlyActive: boolean;
        /** @format int32 */
        PageNumber: number;
        /** @format int32 */
        PageSize: number;
        SortBy: string;
        SortDescending: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetSettingsResponse, ProblemDetails>({
        path: `/api/v1/settings`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name BulkUpdateSettings
     * @summary Bulk update multiple settings
     * @request PUT:/api/v1/settings/bulk
     */
    bulkUpdateSettings: (
      data: BulkUpdateSettingsCommand,
      params: RequestParams = {},
    ) =>
      this.request<BulkUpdateSettingsResponse, ProblemDetails>({
        path: `/api/v1/settings/bulk`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name UpdateSetting
     * @summary Update an existing setting value
     * @request PUT:/api/v1/settings/{settingId}
     */
    updateSetting: (
      settingId: string,
      data: UpdateSettingCommand,
      params: RequestParams = {},
    ) =>
      this.request<UpdateSettingResponse, ProblemDetails>({
        path: `/api/v1/settings/${settingId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name GetSettingsBySection
     * @summary Get settings organized by section and category
     * @request GET:/api/v1/settings/organized
     */
    getSettingsBySection: (
      query: {
        SectionName?: string;
        OnlyActive: boolean;
        IncludeEmpty: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetSettingsBySectionResponse, ProblemDetails>({
        path: `/api/v1/settings/organized`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 🌐 🌐 🌐 🌐 🌐 This endpoint is publicly accessible.
     *
     * @tags Settings
     * @name GetSettingByKey
     * @summary Get a specific setting by its key
     * @request GET:/api/v1/settings/{key}
     */
    getSettingByKey: (
      key: string,
      query: {
        SettingKey: string;
        OnlyActive: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetSettingByKeyResponse, ProblemDetails>({
        path: `/api/v1/settings/${key}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Surveys
     * @name GetSurveyOverview
     * @request GET:/api/v1/surveys/{surveyId}/overview
     */
    getSurveyOverview: (surveyId: string, params: RequestParams = {}) =>
      this.request<
        SurveyOverviewResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/overview`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Surveys
     * @name GetSurveyDetails
     * @request GET:/api/v1/surveys/{surveyId}/details
     */
    getSurveyDetails: (surveyId: string, params: RequestParams = {}) =>
      this.request<
        SurveyDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/details`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetSurveyDetailsWithUser
     * @request GET:/api/v1/surveys/{surveyId}/details/user
     * @secure
     */
    getSurveyDetailsWithUser: (surveyId: string, params: RequestParams = {}) =>
      this.request<
        SurveyDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/details/user`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetParticipationStatus
     * @request GET:/api/v1/surveys/{surveyId}/participation
     * @secure
     */
    getParticipationStatus: (surveyId: string, params: RequestParams = {}) =>
      this.request<
        ParticipationStatusResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/participation`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetCurrentQuestion
     * @request GET:/api/v1/surveys/{surveyId}/responses/{responseId}/questions/current
     * @secure
     */
    getCurrentQuestion: (
      surveyId: string,
      responseId: string,
      query?: {
        /** @format int32 */
        repeatIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        CurrentQuestionResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/questions/current`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetQuestionById
     * @request GET:/api/v1/surveys/{surveyId}/responses/{responseId}/questions/{questionId}
     * @secure
     */
    getQuestionById: (
      surveyId: string,
      responseId: string,
      questionId: string,
      query?: {
        /** @format int32 */
        repeatIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        QuestionByIdResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/questions/${questionId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetResponseProgress
     * @request GET:/api/v1/surveys/{surveyId}/responses/{responseId}/progress
     * @secure
     */
    getResponseProgress: (
      surveyId: string,
      responseId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseProgressResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/progress`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name ListQuestionsForNavigation
     * @request GET:/api/v1/surveys/{surveyId}/responses/{responseId}/questions
     * @secure
     */
    listQuestionsForNavigation: (
      surveyId: string,
      responseId: string,
      query?: {
        /** @default false */
        includeBackNavigation?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        QuestionsNavigationResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/questions`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Surveys
     * @name GetActiveSurveys
     * @request GET:/api/v1/surveys/active
     */
    getActiveSurveys: (
      query?: {
        /**
         * @format int32
         * @default 1
         */
        pageNumber?: number;
        /**
         * @format int32
         * @default 20
         */
        pageSize?: number;
        featureKey?: string;
        capabilityKey?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ActiveSurveysResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/active`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetSurveysWithUserLastResponse
     * @request GET:/api/v1/surveys/user/last-responses
     * @secure
     */
    getSurveysWithUserLastResponse: (
      query?: {
        /**
         * @format int32
         * @default 1
         */
        pageNumber?: number;
        /**
         * @format int32
         * @default 20
         */
        pageSize?: number;
        searchTerm?: string;
        state?: string;
        isAcceptingResponses?: boolean;
        sortBy?: string;
        sortDirection?: string;
        /** @default false */
        includeQuestions?: boolean;
        /** @default true */
        includeUserLastResponse?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        SurveysWithUserLastResponseResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/user/last-responses`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetSurveysWithUserResponses
     * @request GET:/api/v1/surveys/user/responses
     * @secure
     */
    getSurveysWithUserResponses: (
      query?: {
        /**
         * @format int32
         * @default 1
         */
        pageNumber?: number;
        /**
         * @format int32
         * @default 20
         */
        pageSize?: number;
        searchTerm?: string;
        state?: string;
        isAcceptingResponses?: boolean;
        userResponseStatus?: string;
        hasUserResponse?: boolean;
        canUserParticipate?: boolean;
        /** @format double */
        minUserCompletionPercentage?: number;
        /** @format double */
        maxUserCompletionPercentage?: number;
        sortBy?: string;
        sortDirection?: string;
        /** @default false */
        includeQuestions?: boolean;
        /** @default true */
        includeUserResponses?: boolean;
        /** @default true */
        includeUserLastResponse?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        SurveysWithUserResponsesResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/user/responses`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Surveys
     * @name GetSurveyQuestions
     * @request GET:/api/v1/surveys/{surveyId}/questions
     */
    getSurveyQuestions: (
      surveyId: string,
      query?: {
        /** @default false */
        includeUserAnswers?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        SurveyQuestionsResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/questions`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Surveys
     * @name GetSurveyQuestionsDetails
     * @request GET:/api/v1/surveys/{surveyId}/questions/details
     */
    getSurveyQuestionsDetails: (
      surveyId: string,
      query?: {
        /** @default false */
        includeUserAnswers?: boolean;
        /** @default false */
        includeStatistics?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        SurveyQuestionsDetailsResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/questions/details`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetSurveyQuestionsWithAnswers
     * @request GET:/api/v1/surveys/{surveyId}/questions/with-answers
     * @secure
     */
    getSurveyQuestionsWithAnswers: (
      surveyId: string,
      query?: {
        /** @format int32 */
        attemptNumber?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        SurveyQuestionsWithAnswersResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/questions/with-answers`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetUserSurveyResponses
     * @request GET:/api/v1/surveys/{surveyId}/user/responses
     * @secure
     */
    getUserSurveyResponses: (
      surveyId: string,
      query?: {
        /** @default false */
        includeAnswers?: boolean;
        /** @default false */
        includeLastAnswersOnly?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        UserSurveyResponsesResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/user/responses`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetResponseDetails
     * @request GET:/api/v1/surveys/responses/{responseId}/details
     * @secure
     */
    getResponseDetails: (
      responseId: string,
      query?: {
        /** @default true */
        includeQuestionDetails?: boolean;
        /** @default true */
        includeSurveyDetails?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseDetailsDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/responses/${responseId}/details`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GetQuestionAnswerDetails
     * @request GET:/api/v1/surveys/responses/{responseId}/questions/{questionId}/answer
     * @secure
     */
    getQuestionAnswerDetails: (
      responseId: string,
      questionId: string,
      query?: {
        /** @default true */
        includeQuestionDetails?: boolean;
        /** @default false */
        includeSurveyDetails?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        QuestionAnswerDetailsDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/responses/${responseId}/questions/${questionId}/answer`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name StartSurveyResponse
     * @request POST:/api/v1/surveys/{surveyId}/responses
     * @secure
     */
    startSurveyResponse: (
      surveyId: string,
      data: StartSurveyResponseRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        StartSurveyResponseResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name AnswerQuestion
     * @request PUT:/api/v1/surveys/{surveyId}/responses/{responseId}/answers/{questionId}
     * @secure
     */
    answerQuestion: (
      surveyId: string,
      responseId: string,
      questionId: string,
      data: AnswerQuestionRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        AnswerQuestionResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/answers/${questionId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GoNextQuestion
     * @request POST:/api/v1/surveys/{surveyId}/responses/{responseId}/navigation/next
     * @secure
     */
    goNextQuestion: (
      surveyId: string,
      responseId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        GoNextQuestionResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/navigation/next`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name GoPreviousQuestion
     * @request POST:/api/v1/surveys/{surveyId}/responses/{responseId}/navigation/prev
     * @secure
     */
    goPreviousQuestion: (
      surveyId: string,
      responseId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        GoPreviousQuestionResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/navigation/prev`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name JumpToQuestion
     * @request POST:/api/v1/surveys/{surveyId}/responses/{responseId}/navigation/jump
     * @secure
     */
    jumpToQuestion: (
      surveyId: string,
      responseId: string,
      data: JumpToQuestionRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        JumpToQuestionResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/navigation/jump`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name SubmitResponse
     * @request POST:/api/v1/surveys/{surveyId}/responses/{responseId}/submit
     * @secure
     */
    submitResponse: (
      surveyId: string,
      responseId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        SubmitResponseResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/submit`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name CancelResponse
     * @request POST:/api/v1/surveys/{surveyId}/responses/{responseId}/cancel
     * @secure
     */
    cancelResponse: (
      surveyId: string,
      responseId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        CancelResponseResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/cancel`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Surveys
     * @name AutoSaveAnswers
     * @request PATCH:/api/v1/surveys/{surveyId}/responses/{responseId}/autosave
     * @secure
     */
    autoSaveAnswers: (
      surveyId: string,
      responseId: string,
      data: AutoSaveAnswersRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        AutoSaveAnswersResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/responses/${responseId}/autosave`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Surveys
     * @name GetSpecificQuestion
     * @request GET:/api/v1/surveys/{surveyId}/questions/{questionIndex}
     */
    getSpecificQuestion: (
      surveyId: string,
      questionIndex: number,
      query?: {
        userNationalNumber?: string;
        /** @format uuid */
        responseId?: string;
        /** @default true */
        includeUserAnswers?: boolean;
        /** @default true */
        includeNavigationInfo?: boolean;
        /** @default false */
        includeStatistics?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GetSpecificQuestionResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/questions/${questionIndex}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🌐 This endpoint is publicly accessible.
     *
     * @tags Surveys
     * @name GetPreviousQuestions
     * @request GET:/api/v1/surveys/{surveyId}/questions/previous
     */
    getPreviousQuestions: (
      surveyId: string,
      query: {
        /** @format int32 */
        currentQuestionIndex: number;
        /**
         * @format int32
         * @default 10
         */
        maxCount?: number;
        userNationalNumber?: string;
        /** @format uuid */
        responseId?: string;
        /** @default true */
        includeUserAnswers?: boolean;
        /** @default true */
        includeNavigationInfo?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GetPreviousQuestionsResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/surveys/${surveyId}/questions/previous`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeGetReservationsPaginated
     * @request GET:/api/me/recreation/reservations/paginated
     * @secure
     */
    meGetReservationsPaginated: (
      query: {
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        status?: ReservationStatus;
        search?: string;
        /** @format date-time */
        fromDate?: string;
        /** @format date-time */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ReservationDtoPaginatedResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/paginated`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeStartReservation
     * @request POST:/api/me/recreation/reservations/start
     * @secure
     */
    meStartReservation: (
      data: StartReservationRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        StartReservationCommandResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/start`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeAddGuestToReservation
     * @request POST:/api/me/recreation/reservations/{reservationId}/guests
     * @secure
     */
    meAddGuestToReservation: (
      reservationId: string,
      data: GuestParticipantDto,
      params: RequestParams = {},
    ) =>
      this.request<
        AddGuestToReservationResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/${reservationId}/guests`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeReactivateReservation
     * @request POST:/api/me/recreation/reservations/{reservationId}/reactivate
     * @secure
     */
    meReactivateReservation: (
      reservationId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        ReactivateReservationResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/${reservationId}/reactivate`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeChangeReservationCapacity
     * @request PUT:/api/me/recreation/reservations/{reservationId}/capacity
     * @secure
     */
    meChangeReservationCapacity: (
      reservationId: string,
      data: ChangeReservationCapacityRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ChangeReservationCapacityCommandResultApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/${reservationId}/capacity`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeRemoveGuestFromReservation
     * @request DELETE:/api/me/recreation/reservations/{reservationId}/guests/{participantId}
     * @secure
     */
    meRemoveGuestFromReservation: (
      reservationId: string,
      participantId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        RemoveGuestFromReservationResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/${reservationId}/guests/${participantId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeFinalizeReservation
     * @request POST:/api/me/recreation/reservations/{reservationId}/finalize
     * @secure
     */
    meFinalizeReservation: (
      reservationId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        FinalizeReservationResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/${reservationId}/finalize`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeGetReservationPricing
     * @request GET:/api/me/recreation/reservations/{reservationId}/pricing
     * @secure
     */
    meGetReservationPricing: (
      reservationId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        ReservationPricingResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/${reservationId}/pricing`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tour Reservations
     * @name MeGetReservationDetail
     * @request GET:/api/me/recreation/reservations/{reservationId}
     * @secure
     */
    meGetReservationDetail: (
      reservationId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        ReservationDetailDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/recreation/reservations/${reservationId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns a paginated list of tours with optional search and filtering.
     *
     * @tags Tours
     * @name GetToursPaginated
     * @summary Get Tours Paginated
     * @request GET:/api/me/v1/tours/paginated
     * @secure
     */
    getToursPaginated: (
      query: {
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        search?: string;
        isActive?: boolean;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        TourWithUserReservationDtoPaginatedResultApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/v1/tours/paginated`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Tours
     * @name GetTourDetails
     * @request GET:/api/me/v1/tours/{id}
     * @secure
     */
    getTourDetails: (id: string, params: RequestParams = {}) =>
      this.request<
        TourDetailWithUserReservationDtoApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/me/v1/tours/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns a paginated list of users with optional search filter.
     *
     * @tags Users
     * @name GetUsersPaginated
     * @summary Get Users Paginated
     * @request GET:/api/v1/users
     * @secure
     */
    getUsersPaginated: (
      query: {
        /** @format int32 */
        pageNumber: number;
        /** @format int32 */
        pageSize: number;
        search?: string;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        UserDtoPaginatedResultApplicationResult,
        {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/users`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Creates a new user with the provided information.
     *
     * @tags Users
     * @name CreateUser
     * @summary Create User
     * @request POST:/api/v1/users
     * @secure
     */
    createUser: (data: CreateUserCommand, params: RequestParams = {}) =>
      this.request<
        GuidApplicationResult,
        | GuidApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Returns full UserDetail DTO with roles, claims, preferences and tokens.
     *
     * @tags Users
     * @name GetUserDetail
     * @summary Get UserDetail Detail
     * @request GET:/api/v1/users/{id}
     * @secure
     */
    getUserDetail: (id: string, data: any, params: RequestParams = {}) =>
      this.request<
        UserDetailDtoApplicationResult,
        | UserDetailDtoApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users/${id}`,
        method: "GET",
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Updates an existing user with the provided information.
     *
     * @tags Users
     * @name UpdateUser
     * @summary Update User
     * @request PUT:/api/v1/users/{id}
     * @secure
     */
    updateUser: (
      id: string,
      data: UpdateUserCommand,
      params: RequestParams = {},
    ) =>
      this.request<
        ApplicationResult,
        | ApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Deletes a user. By default performs soft delete, but can perform hard delete if specified.
     *
     * @tags Users
     * @name DeleteUser
     * @summary Delete User
     * @request DELETE:/api/v1/users/{id}
     * @secure
     */
    deleteUser: (
      id: string,
      query: {
        softDelete: boolean;
        deleteReason?: string;
      },
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        ApplicationResult,
        | ApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users/${id}`,
        method: "DELETE",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Adds the specified claims to a user. Claims are validated against available claim providers.
     *
     * @tags Users
     * @name AddClaimsToUser
     * @summary Add Claims to User
     * @request POST:/api/v1/users/{id}/claims
     * @secure
     */
    addClaimsToUser: (
      id: string,
      data: AddClaimsToUserCommand,
      params: RequestParams = {},
    ) =>
      this.request<
        ApplicationResult,
        | ApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users/${id}/claims`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Removes the specified claims from a user. Claims are soft-deleted by deactivating them.
     *
     * @tags Users
     * @name DeleteClaimsFromUser
     * @summary Delete Claims from User
     * @request DELETE:/api/v1/users/{id}/claims
     * @secure
     */
    deleteClaimsFromUser: (
      id: string,
      data: DeleteClaimsFromUserCommand,
      params: RequestParams = {},
    ) =>
      this.request<
        ApplicationResult,
        | ApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users/${id}/claims`,
        method: "DELETE",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Assigns a role to a user with optional expiration and audit information.
     *
     * @tags Users
     * @name AddRoleToUser
     * @summary Add Role to User
     * @request POST:/api/v1/users/{id}/roles
     * @secure
     */
    addRoleToUser: (
      id: string,
      data: AddRoleToUserRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ApplicationResult,
        | ApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users/${id}/roles`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 🔒 🔒 🔒 🔒 🔒 Removes a role assignment from a user with optional audit information.
     *
     * @tags Users
     * @name RemoveRoleFromUser
     * @summary Remove Role from User
     * @request DELETE:/api/v1/users/{id}/roles/{roleId}
     * @secure
     */
    removeRoleFromUser: (
      id: string,
      roleId: string,
      data: any,
      query?: {
        /** @format uuid */
        removedBy?: string;
        reason?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ApplicationResult,
        | ApplicationResult
        | {
            /** @example "internal_server_error" */
            error?: string;
            /** @example "خطای داخلی سرور رخ داده است" */
            message?: string;
            /** @format date-time */
            timestamp?: string;
          }
      >({
        path: `/api/v1/users/${id}/roles/${roleId}`,
        method: "DELETE",
        query: query,
        body: data,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Wallets
     * @name CreateWalletDeposit
     * @request POST:/api/v1/me/wallets/deposit
     * @secure
     */
    createWalletDeposit: (
      data: CreateWalletDepositRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        CreateWalletDepositResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/me/wallets/deposit`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Wallets
     * @name GetUserWalletBalance
     * @request GET:/api/v1/me/wallets/balance
     * @secure
     */
    getUserWalletBalance: (params: RequestParams = {}) =>
      this.request<
        WalletBalanceResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/me/wallets/balance`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Wallets
     * @name ListUserWalletTransactions
     * @request GET:/api/v1/me/wallets/transactions
     * @secure
     */
    listUserWalletTransactions: (
      query?: {
        /**
         * @format int32
         * @default 1
         */
        pageNumber?: number;
        /**
         * @format int32
         * @default 20
         */
        pageSize?: number;
        transactionType?: string;
        referenceId?: string;
        /** @format date-time */
        fromDate?: string;
        /** @format date-time */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        WalletTransactionsResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/me/wallets/transactions`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Wallets
     * @name ListUserWalletDeposits
     * @request GET:/api/v1/me/wallets/deposits
     * @secure
     */
    listUserWalletDeposits: (
      query?: {
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * @format int32
         * @default 20
         */
        pageSize?: number;
        status?: string;
        /** @format date-time */
        fromDate?: string;
        /** @format date-time */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        WalletDepositsResponseApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/me/wallets/deposits`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 🔒 This endpoint requires authentication.
     *
     * @tags Wallets
     * @name GetWalletDepositDetails
     * @request GET:/api/v1/me/wallets/deposits/{depositId}
     * @secure
     */
    getWalletDepositDetails: (depositId: string, params: RequestParams = {}) =>
      this.request<
        WalletDepositDetailsDtoApplicationResult,
        void | {
          /** @example "internal_server_error" */
          error?: string;
          /** @example "خطای داخلی سرور رخ داده است" */
          message?: string;
          /** @format date-time */
          timestamp?: string;
        }
      >({
        path: `/api/v1/me/wallets/deposits/${depositId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
