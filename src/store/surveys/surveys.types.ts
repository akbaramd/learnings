import {
  SurveyDto,
  SurveyOverviewResponse,
  ActiveSurveysResponse,
  SurveysWithUserLastResponseResponse,
  SurveysWithUserResponsesResponse,
  SurveyQuestionsResponse,
  SurveyQuestionsDetailsResponse,
  SurveyQuestionsWithAnswersResponse,
  UserSurveyResponsesResponse,
  ResponseDetailsDto,
  ResponseDto,
  ResponseProgressResponse,
  CurrentQuestionResponse,
  QuestionByIdResponse,
  QuestionsNavigationResponse,
  QuestionAnswerDetailsDto,
  ParticipationStatusResponse,
  AnswerQuestionResponse,
  GoNextQuestionResponse,
  GoPreviousQuestionResponse,
  JumpToQuestionResponse,
  SubmitResponseResponse,
  CancelResponseResponse,
  AutoSaveAnswersResponse,
  GetSpecificQuestionResponse,
  GetPreviousQuestionsResponse,
  SurveyOverviewResponseApplicationResult,
  SurveyDtoApplicationResult,
  ActiveSurveysResponseApplicationResult,
  SurveysWithUserLastResponseResponseApplicationResult,
  SurveysWithUserResponsesResponseApplicationResult,
  SurveyQuestionsResponseApplicationResult,
  SurveyQuestionsDetailsResponseApplicationResult,
  SurveyQuestionsWithAnswersResponseApplicationResult,
  UserSurveyResponsesResponseApplicationResult,
  ResponseDetailsDtoApplicationResult,
  ResponseProgressResponseApplicationResult,
  CurrentQuestionResponseApplicationResult,
  QuestionByIdResponseApplicationResult,
  QuestionsNavigationResponseApplicationResult,
  QuestionAnswerDetailsDtoApplicationResult,
  ParticipationStatusResponseApplicationResult,
  StartSurveyResponseResponseApplicationResult,
  AnswerQuestionResponseApplicationResult,
  GoNextQuestionResponseApplicationResult,
  GoPreviousQuestionResponseApplicationResult,
  JumpToQuestionResponseApplicationResult,
  SubmitResponseResponseApplicationResult,
  CancelResponseResponseApplicationResult,
  AutoSaveAnswersResponseApplicationResult,
  GetSpecificQuestionResponseApplicationResult,
  GetPreviousQuestionsResponseApplicationResult,
  StartSurveyResponseRequest,
  AnswerQuestionRequest,
  JumpToQuestionRequest,
  AutoSaveAnswersRequest,
} from '@/src/services/Api';

// Re-export types from Api
export type {
  SurveyDto,
  SurveyOverviewResponse,
  ActiveSurveysResponse,
  SurveysWithUserLastResponseResponse,
  SurveysWithUserResponsesResponse,
  SurveyQuestionsResponse,
  SurveyQuestionsDetailsResponse,
  SurveyQuestionsWithAnswersResponse,
  UserSurveyResponsesResponse,
  ResponseDetailsDto,
  ResponseDto,
  ResponseProgressResponse,
  CurrentQuestionResponse,
  QuestionByIdResponse,
  QuestionsNavigationResponse,
  QuestionAnswerDetailsDto,
  ParticipationStatusResponse,
  AnswerQuestionResponse,
  GoNextQuestionResponse,
  GoPreviousQuestionResponse,
  JumpToQuestionResponse,
  SubmitResponseResponse,
  CancelResponseResponse,
  AutoSaveAnswersResponse,
  GetSpecificQuestionResponse,
  GetPreviousQuestionsResponse,
};

// Response wrappers matching BFF pattern
export type GetSurveyOverviewResponse = SurveyOverviewResponseApplicationResult;
export type GetSurveyDetailsResponse = SurveyDtoApplicationResult;
export type GetSurveyDetailsWithUserResponse = SurveyDtoApplicationResult;
export type GetActiveSurveysResponse = ActiveSurveysResponseApplicationResult;
export type GetSurveysWithUserLastResponseResponse = SurveysWithUserLastResponseResponseApplicationResult;
export type GetSurveysWithUserResponsesResponse = SurveysWithUserResponsesResponseApplicationResult;
export type GetSurveyQuestionsResponse = SurveyQuestionsResponseApplicationResult;
export type GetSurveyQuestionsDetailsResponse = SurveyQuestionsDetailsResponseApplicationResult;
export type GetSurveyQuestionsWithAnswersResponse = SurveyQuestionsWithAnswersResponseApplicationResult;
export type GetUserSurveyResponsesResponse = UserSurveyResponsesResponseApplicationResult;
export type GetResponseDetailsResponse = ResponseDetailsDtoApplicationResult;
export type GetResponseProgressResponse = ResponseProgressResponseApplicationResult;
export type GetCurrentQuestionResponse = CurrentQuestionResponseApplicationResult;
export type GetQuestionByIdResponse = QuestionByIdResponseApplicationResult;
export type ListQuestionsForNavigationResponse = QuestionsNavigationResponseApplicationResult;
export type GetQuestionAnswerDetailsResponse = QuestionAnswerDetailsDtoApplicationResult;
export type GetParticipationStatusResponse = ParticipationStatusResponseApplicationResult;
export type StartSurveyResponseResponse = StartSurveyResponseResponseApplicationResult;
export type AnswerQuestionResponseWrapper = AnswerQuestionResponseApplicationResult;
export type GoNextQuestionResponseWrapper = GoNextQuestionResponseApplicationResult;
export type GoPreviousQuestionResponseWrapper = GoPreviousQuestionResponseApplicationResult;
export type JumpToQuestionResponseWrapper = JumpToQuestionResponseApplicationResult;
export type SubmitResponseResponseWrapper = SubmitResponseResponseApplicationResult;
export type CancelResponseResponseWrapper = CancelResponseResponseApplicationResult;
export type AutoSaveAnswersResponseWrapper = AutoSaveAnswersResponseApplicationResult;
export type GetSpecificQuestionResponseWrapper = GetSpecificQuestionResponseApplicationResult;
export type GetPreviousQuestionsResponseWrapper = GetPreviousQuestionsResponseApplicationResult;

// Request types
export interface GetActiveSurveysRequest {
  pageNumber?: number;
  pageSize?: number;
  featureKey?: string;
  capabilityKey?: string;
}

export interface GetSurveysWithUserLastResponseRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  state?: string;
  isAcceptingResponses?: boolean;
  sortBy?: string;
  sortDirection?: string;
  includeQuestions?: boolean;
  includeUserLastResponse?: boolean;
}

export interface GetSurveysWithUserResponsesRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  state?: string;
  isAcceptingResponses?: boolean;
  userResponseStatus?: string;
  hasUserResponse?: boolean;
  canUserParticipate?: boolean;
  minUserCompletionPercentage?: number;
  maxUserCompletionPercentage?: number;
  sortBy?: string;
  sortDirection?: string;
  includeQuestions?: boolean;
  includeUserResponses?: boolean;
  includeUserLastResponse?: boolean;
}

export interface GetSurveyQuestionsRequest {
  surveyId: string;
  includeUserAnswers?: boolean;
}

export interface GetSurveyQuestionsDetailsRequest {
  surveyId: string;
  includeUserAnswers?: boolean;
  includeStatistics?: boolean;
}

export interface GetSurveyQuestionsWithAnswersRequest {
  surveyId: string;
  attemptNumber?: number;
}

export interface GetUserSurveyResponsesRequest {
  surveyId: string;
  includeAnswers?: boolean;
  includeLastAnswersOnly?: boolean;
}

export interface GetResponseDetailsRequest {
  responseId: string;
  includeQuestionDetails?: boolean;
  includeSurveyDetails?: boolean;
}

export interface GetResponseProgressRequest {
  surveyId: string;
  responseId: string;
}

export interface GetCurrentQuestionRequest {
  surveyId: string;
  responseId: string;
  repeatIndex?: number;
}

export interface GetQuestionByIdRequest {
  surveyId: string;
  responseId: string;
  questionId: string;
  repeatIndex?: number;
}

export interface ListQuestionsForNavigationRequest {
  surveyId: string;
  responseId: string;
  includeBackNavigation?: boolean;
}

export interface GetQuestionAnswerDetailsRequest {
  responseId: string;
  questionId: string;
  includeQuestionDetails?: boolean;
  includeSurveyDetails?: boolean;
}

export interface GetParticipationStatusRequest {
  surveyId: string;
}

export interface StartSurveyResponseRequestWrapper {
  surveyId: string;
  data: StartSurveyResponseRequest;
}

export interface AnswerQuestionRequestWrapper {
  surveyId: string;
  responseId: string;
  questionId: string;
  data: AnswerQuestionRequest;
}

export interface GoNextQuestionRequest {
  surveyId: string;
  responseId: string;
}

export interface GoPreviousQuestionRequest {
  surveyId: string;
  responseId: string;
}

export interface JumpToQuestionRequestWrapper {
  surveyId: string;
  responseId: string;
  data: JumpToQuestionRequest;
}

export interface SubmitResponseRequest {
  surveyId: string;
  responseId: string;
}

export interface CancelResponseRequest {
  surveyId: string;
  responseId: string;
}

export interface AutoSaveAnswersRequestWrapper {
  surveyId: string;
  responseId: string;
  data: AutoSaveAnswersRequest;
}

export interface GetSpecificQuestionRequest {
  surveyId: string;
  questionIndex: number;
  userNationalNumber?: string;
  responseId?: string;
  includeUserAnswers?: boolean;
  includeNavigationInfo?: boolean;
  includeStatistics?: boolean;
}

export interface GetPreviousQuestionsRequest {
  surveyId: string;
  currentQuestionIndex: number;
  maxCount?: number;
  userNationalNumber?: string;
  responseId?: string;
  includeUserAnswers?: boolean;
  includeNavigationInfo?: boolean;
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

// Surveys state
export interface SurveysState {
  // Surveys list
  activeSurveys: SurveyDto[];
  activeSurveysPagination: PaginationInfo | null;
  
  surveysWithLastResponse: SurveyDto[];
  surveysWithLastResponsePagination: PaginationInfo | null;
  
  surveysWithResponses: SurveyDto[];
  surveysWithResponsesPagination: PaginationInfo | null;

  // Selected survey
  selectedSurvey: SurveyDto | null;
  selectedSurveyOverview: SurveyOverviewResponse | null;
  
  // Survey questions
  surveyQuestions: SurveyQuestionsResponse | null;
  surveyQuestionsDetails: SurveyQuestionsDetailsResponse | null;
  surveyQuestionsWithAnswers: SurveyQuestionsWithAnswersResponse | null;

  // User responses
  userSurveyResponses: UserSurveyResponsesResponse | null;
  currentResponse: ResponseDto | null;
  selectedResponse: ResponseDetailsDto | null;
  responseProgress: ResponseProgressResponse | null;

  // Current question and navigation
  currentQuestion: CurrentQuestionResponse | null;
  questionById: QuestionByIdResponse | null;
  questionsNavigation: QuestionsNavigationResponse | null;
  questionAnswerDetails: QuestionAnswerDetailsDto | null;

  // Participation
  participationStatus: ParticipationStatusResponse | null;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

