import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';
import { RootState } from '..';
import {
  GetActiveSurveysRequest,
  GetActiveSurveysResponse,
  GetSurveysWithUserLastResponseRequest,
  GetSurveysWithUserLastResponseResponse,
  GetSurveysWithUserResponsesRequest,
  GetSurveysWithUserResponsesResponse,
  GetSurveyOverviewResponse,
  GetSurveyDetailsResponse,
  GetSurveyDetailsWithUserResponse,
  GetSurveyQuestionsRequest,
  GetSurveyQuestionsResponse,
  GetSurveyQuestionsDetailsRequest,
  GetSurveyQuestionsDetailsResponse,
  GetSurveyQuestionsWithAnswersRequest,
  GetSurveyQuestionsWithAnswersResponse,
  GetUserSurveyResponsesRequest,
  GetUserSurveyResponsesResponse,
  GetResponseDetailsRequest,
  GetResponseDetailsResponse,
  GetResponseProgressRequest,
  GetResponseProgressResponse,
  GetCurrentQuestionRequest,
  GetCurrentQuestionResponse,
  GetQuestionByIdRequest,
  GetQuestionByIdResponse,
  ListQuestionsForNavigationRequest,
  ListQuestionsForNavigationResponse,
  GetQuestionAnswerDetailsRequest,
  GetQuestionAnswerDetailsResponse,
  GetParticipationStatusRequest,
  GetParticipationStatusResponse,
  StartSurveyResponseRequestWrapper,
  StartSurveyResponseResponse,
  AnswerQuestionRequestWrapper,
  AnswerQuestionResponseWrapper,
  GoNextQuestionRequest,
  GoNextQuestionResponseWrapper,
  GoPreviousQuestionRequest,
  GoPreviousQuestionResponseWrapper,
  JumpToQuestionRequestWrapper,
  JumpToQuestionResponseWrapper,
  SubmitResponseRequest,
  SubmitResponseResponseWrapper,
  CancelResponseRequest,
  CancelResponseResponseWrapper,
  AutoSaveAnswersRequestWrapper,
  AutoSaveAnswersResponseWrapper,
  GetSpecificQuestionRequest,
  GetSpecificQuestionResponseWrapper,
  GetPreviousQuestionsRequest,
  GetPreviousQuestionsResponseWrapper,
  PaginationInfo,
  ResponseDto,
} from './surveys.types';
import {
  setActiveSurveys,
  clearActiveSurveys,
  setActiveSurveysPagination,
  setSurveysWithLastResponse,
  clearSurveysWithLastResponse,
  setSurveysWithLastResponsePagination,
  setSurveysWithResponses,
  clearSurveysWithResponses,
  setSurveysWithResponsesPagination,
  setSelectedSurvey,
  clearSelectedSurvey,
  setSelectedSurveyOverview,
  setSurveyQuestions,
  clearSurveyQuestions,
  setSurveyQuestionsDetails,
  clearSurveyQuestionsDetails,
  setSurveyQuestionsWithAnswers,
  clearSurveyQuestionsWithAnswers,
  setUserSurveyResponses,
  clearUserSurveyResponses,
  setCurrentResponse,
  clearCurrentResponse,
  setSelectedResponse,
  clearSelectedResponse,
  setResponseProgress,
  clearResponseProgress,
  setCurrentQuestion,
  clearCurrentQuestion,
  setQuestionById,
  clearQuestionById,
  setQuestionsNavigation,
  clearQuestionsNavigation,
  setQuestionAnswerDetails,
  clearQuestionAnswerDetails,
  setParticipationStatus,
  clearParticipationStatus,
  setLoading,
  setError,
} from './surveys.slice';

/** Error handler for Surveys API */
export const handleSurveysApiError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as Record<string, unknown>;
    if ('response' in apiError && apiError.response) {
      const response = apiError.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (Array.isArray(data.errors) && data.errors[0]) return String(data.errors[0]);
        if (data.message) return String(data.message);
      }
    }
    if (apiError?.data && typeof apiError.data === 'object') {
      const data = apiError.data as Record<string, unknown>;
      if (Array.isArray(data.errors) && data.errors[0]) return String(data.errors[0]);
      if (data.message) return String(data.message);
    }
    if (apiError.message) return String(apiError.message);
  }
  return 'Unexpected error';
};

export const surveysApi = createApi({
  reducerPath: 'surveysApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Surveys', 'SurveyDetails', 'SurveyQuestions', 'SurveyResponses', 'SurveyParticipation'],
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // Get Survey Overview
    getSurveyOverview: builder.query<GetSurveyOverviewResponse, string>({
      query: (surveyId) => `/surveys/${surveyId}/overview`,
      providesTags: (result, error, surveyId) => [{ type: 'Surveys', id: surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedSurveyOverview(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Survey Details
    getSurveyDetails: builder.query<GetSurveyDetailsResponse, string>({
      query: (surveyId) => `/surveys/${surveyId}/details`,
      providesTags: (result, error, surveyId) => [{ type: 'SurveyDetails', id: surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedSurvey());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedSurvey(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Survey Details With User
    getSurveyDetailsWithUser: builder.query<GetSurveyDetailsWithUserResponse, string>({
      query: (surveyId) => `/surveys/${surveyId}/details/user`,
      providesTags: (result, error, surveyId) => [{ type: 'SurveyDetails', id: surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedSurvey());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedSurvey(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Participation Status
    getParticipationStatus: builder.query<GetParticipationStatusResponse, GetParticipationStatusRequest>({
      query: (request) => `/surveys/${request.surveyId}/participation`,
      providesTags: (result, error, request) => [{ type: 'SurveyParticipation', id: request.surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setParticipationStatus(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Active Surveys
    getActiveSurveys: builder.query<GetActiveSurveysResponse, GetActiveSurveysRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.pageNumber) {
          searchParams.append('pageNumber', request.pageNumber.toString());
        }
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.featureKey) {
          searchParams.append('featureKey', request.featureKey);
        }
        if (request.capabilityKey) {
          searchParams.append('capabilityKey', request.capabilityKey);
        }
        return {
          url: `/surveys/active?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Surveys'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearActiveSurveys());
            dispatch(setActiveSurveys(payload.surveys || []));
            
            const pageSize = payload.pageSize || arg.pageSize || 20;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            const pageNumber = payload.pageNumber || arg.pageNumber || 1;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: payload.hasPreviousPage || pageNumber > 1,
              hasNextPage: payload.hasNextPage || pageNumber < totalPages,
            };
            dispatch(setActiveSurveysPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Surveys With User Last Response
    getSurveysWithUserLastResponse: builder.query<
      GetSurveysWithUserLastResponseResponse,
      GetSurveysWithUserLastResponseRequest
    >({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.pageNumber) {
          searchParams.append('pageNumber', request.pageNumber.toString());
        }
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        if (request.state) {
          searchParams.append('state', request.state);
        }
        if (request.isAcceptingResponses !== undefined) {
          searchParams.append('isAcceptingResponses', request.isAcceptingResponses.toString());
        }
        if (request.sortBy) {
          searchParams.append('sortBy', request.sortBy);
        }
        if (request.sortDirection) {
          searchParams.append('sortDirection', request.sortDirection);
        }
        if (request.includeQuestions !== undefined) {
          searchParams.append('includeQuestions', request.includeQuestions.toString());
        }
        if (request.includeUserLastResponse !== undefined) {
          searchParams.append('includeUserLastResponse', request.includeUserLastResponse.toString());
        }
        return {
          url: `/surveys/user/last-responses?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Surveys'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            const pageNumber = payload.pageNumber || arg.pageNumber || 1;
            const isFirstPage = pageNumber === 1;
            
            // Clear only on first page, append for subsequent pages
            if (isFirstPage) {
              dispatch(clearSurveysWithLastResponse());
            }
            
            const newSurveys = payload.surveys || [];
            if (isFirstPage) {
              dispatch(setSurveysWithLastResponse(newSurveys));
            } else {
              // Append new surveys, avoiding duplicates
              const state = getState() as RootState;
              const existingSurveys = state.surveys.surveysWithLastResponse || [];
              const existingIds = new Set(existingSurveys.map(s => s.id));
              const uniqueNewSurveys = newSurveys.filter(s => s.id && !existingIds.has(s.id));
              dispatch(setSurveysWithLastResponse([...existingSurveys, ...uniqueNewSurveys]));
            }
            
            const pageSize = payload.pageSize || arg.pageSize || 20;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: payload.hasPreviousPage || pageNumber > 1,
              hasNextPage: payload.hasNextPage || pageNumber < totalPages,
            };
            dispatch(setSurveysWithLastResponsePagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Surveys With User Responses
    getSurveysWithUserResponses: builder.query<
      GetSurveysWithUserResponsesResponse,
      GetSurveysWithUserResponsesRequest
    >({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.pageNumber) {
          searchParams.append('pageNumber', request.pageNumber.toString());
        }
        if (request.pageSize) {
          searchParams.append('pageSize', request.pageSize.toString());
        }
        if (request.searchTerm) {
          searchParams.append('searchTerm', request.searchTerm);
        }
        if (request.state) {
          searchParams.append('state', request.state);
        }
        if (request.isAcceptingResponses !== undefined) {
          searchParams.append('isAcceptingResponses', request.isAcceptingResponses.toString());
        }
        if (request.userResponseStatus) {
          searchParams.append('userResponseStatus', request.userResponseStatus);
        }
        if (request.hasUserResponse !== undefined) {
          searchParams.append('hasUserResponse', request.hasUserResponse.toString());
        }
        if (request.canUserParticipate !== undefined) {
          searchParams.append('canUserParticipate', request.canUserParticipate.toString());
        }
        if (request.minUserCompletionPercentage !== undefined) {
          searchParams.append('minUserCompletionPercentage', request.minUserCompletionPercentage.toString());
        }
        if (request.maxUserCompletionPercentage !== undefined) {
          searchParams.append('maxUserCompletionPercentage', request.maxUserCompletionPercentage.toString());
        }
        if (request.sortBy) {
          searchParams.append('sortBy', request.sortBy);
        }
        if (request.sortDirection) {
          searchParams.append('sortDirection', request.sortDirection);
        }
        if (request.includeQuestions !== undefined) {
          searchParams.append('includeQuestions', request.includeQuestions.toString());
        }
        if (request.includeUserResponses !== undefined) {
          searchParams.append('includeUserResponses', request.includeUserResponses.toString());
        }
        if (request.includeUserLastResponse !== undefined) {
          searchParams.append('includeUserLastResponse', request.includeUserLastResponse.toString());
        }
        return {
          url: `/surveys/user/responses?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Surveys'],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          const payload = data?.data;
          if (payload) {
            dispatch(clearSurveysWithResponses());
            dispatch(setSurveysWithResponses(payload.surveys || []));
            
            const pageSize = payload.pageSize || arg.pageSize || 20;
            const totalCount = payload.totalCount || 0;
            const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
            const pageNumber = payload.pageNumber || arg.pageNumber || 1;
            
            const pagination: PaginationInfo = {
              pageNumber,
              pageSize,
              totalPages,
              totalCount,
              hasPreviousPage: payload.hasPreviousPage || pageNumber > 1,
              hasNextPage: payload.hasNextPage || pageNumber < totalPages,
            };
            dispatch(setSurveysWithResponsesPagination(pagination));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Survey Questions
    getSurveyQuestions: builder.query<GetSurveyQuestionsResponse, GetSurveyQuestionsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeUserAnswers !== undefined) {
          searchParams.append('includeUserAnswers', request.includeUserAnswers.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/questions?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyQuestions', id: request.surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSurveyQuestions(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Survey Questions Details
    getSurveyQuestionsDetails: builder.query<
      GetSurveyQuestionsDetailsResponse,
      GetSurveyQuestionsDetailsRequest
    >({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeUserAnswers !== undefined) {
          searchParams.append('includeUserAnswers', request.includeUserAnswers.toString());
        }
        if (request.includeStatistics !== undefined) {
          searchParams.append('includeStatistics', request.includeStatistics.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/questions/details?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyQuestions', id: request.surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSurveyQuestionsDetails(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Survey Questions With Answers
    getSurveyQuestionsWithAnswers: builder.query<
      GetSurveyQuestionsWithAnswersResponse,
      GetSurveyQuestionsWithAnswersRequest
    >({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.attemptNumber !== undefined) {
          searchParams.append('attemptNumber', request.attemptNumber.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/questions/with-answers?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyQuestions', id: request.surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSurveyQuestionsWithAnswers(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get User Survey Responses
    getUserSurveyResponses: builder.query<
      GetUserSurveyResponsesResponse,
      GetUserSurveyResponsesRequest
    >({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeAnswers !== undefined) {
          searchParams.append('includeAnswers', request.includeAnswers.toString());
        }
        if (request.includeLastAnswersOnly !== undefined) {
          searchParams.append('includeLastAnswersOnly', request.includeLastAnswersOnly.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/user/responses?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyResponses', id: request.surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setUserSurveyResponses(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Response Details
    getResponseDetails: builder.query<GetResponseDetailsResponse, GetResponseDetailsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeQuestionDetails !== undefined) {
          searchParams.append('includeQuestionDetails', request.includeQuestionDetails.toString());
        }
        if (request.includeSurveyDetails !== undefined) {
          searchParams.append('includeSurveyDetails', request.includeSurveyDetails.toString());
        }
        return {
          url: `/surveys/responses/${request.responseId}/details?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyResponses', id: request.responseId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedResponse());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedResponse(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Response Progress
    getResponseProgress: builder.query<GetResponseProgressResponse, GetResponseProgressRequest>({
      query: (request) => `/surveys/${request.surveyId}/responses/${request.responseId}/progress`,
      providesTags: (result, error, request) => [{ type: 'SurveyResponses', id: request.responseId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setResponseProgress(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Current Question
    getCurrentQuestion: builder.query<GetCurrentQuestionResponse, GetCurrentQuestionRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.repeatIndex !== undefined) {
          searchParams.append('repeatIndex', request.repeatIndex.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/responses/${request.responseId}/questions/current?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setCurrentQuestion(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Question By ID
    getQuestionById: builder.query<GetQuestionByIdResponse, GetQuestionByIdRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.repeatIndex !== undefined) {
          searchParams.append('repeatIndex', request.repeatIndex.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/responses/${request.responseId}/questions/${request.questionId}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setQuestionById(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // List Questions For Navigation
    listQuestionsForNavigation: builder.query<
      ListQuestionsForNavigationResponse,
      ListQuestionsForNavigationRequest
    >({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeBackNavigation !== undefined) {
          searchParams.append('includeBackNavigation', request.includeBackNavigation.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/responses/${request.responseId}/questions?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setQuestionsNavigation(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Question Answer Details
    getQuestionAnswerDetails: builder.query<
      GetQuestionAnswerDetailsResponse,
      GetQuestionAnswerDetailsRequest
    >({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeQuestionDetails !== undefined) {
          searchParams.append('includeQuestionDetails', request.includeQuestionDetails.toString());
        }
        if (request.includeSurveyDetails !== undefined) {
          searchParams.append('includeSurveyDetails', request.includeSurveyDetails.toString());
        }
        return {
          url: `/surveys/responses/${request.responseId}/questions/${request.questionId}/answer?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setQuestionAnswerDetails(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Start Survey Response
    startSurveyResponse: builder.mutation<StartSurveyResponseResponse, StartSurveyResponseRequestWrapper>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses`,
        method: 'POST',
        body: request.data,
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.surveyId },
        { type: 'SurveyParticipation', id: request.surveyId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data?.responseId) {
            dispatch(setCurrentResponse({ id: data.data.responseId } as ResponseDto));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Answer Question
    answerQuestion: builder.mutation<AnswerQuestionResponseWrapper, AnswerQuestionRequestWrapper>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses/${request.responseId}/answers/${request.questionId}`,
        method: 'PUT',
        body: request.data,
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Go Next Question
    goNextQuestion: builder.mutation<GoNextQuestionResponseWrapper, GoNextQuestionRequest>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses/${request.responseId}/navigation/next`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Go Previous Question
    goPreviousQuestion: builder.mutation<GoPreviousQuestionResponseWrapper, GoPreviousQuestionRequest>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses/${request.responseId}/navigation/prev`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Jump To Question
    jumpToQuestion: builder.mutation<JumpToQuestionResponseWrapper, JumpToQuestionRequestWrapper>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses/${request.responseId}/navigation/jump`,
        method: 'POST',
        body: request.data,
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Submit Response
    submitResponse: builder.mutation<SubmitResponseResponseWrapper, SubmitResponseRequest>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses/${request.responseId}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
        { type: 'SurveyParticipation', id: request.surveyId },
        'Surveys',
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Cancel Response
    cancelResponse: builder.mutation<CancelResponseResponseWrapper, CancelResponseRequest>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses/${request.responseId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
        { type: 'SurveyParticipation', id: request.surveyId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Auto Save Answers
    autoSaveAnswers: builder.mutation<AutoSaveAnswersResponseWrapper, AutoSaveAnswersRequestWrapper>({
      query: (request) => ({
        url: `/surveys/${request.surveyId}/responses/${request.responseId}/autosave`,
        method: 'PATCH',
        body: request.data,
      }),
      invalidatesTags: (result, error, request) => [
        { type: 'SurveyResponses', id: request.responseId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          // Auto-save should not show loading state
          await queryFulfilled;
        } catch (error: unknown) {
          // Silent fail for auto-save
          console.error('Auto-save failed:', error);
        }
      },
    }),

    // Get Specific Question
    getSpecificQuestion: builder.query<GetSpecificQuestionResponseWrapper, GetSpecificQuestionRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.userNationalNumber) {
          searchParams.append('userNationalNumber', request.userNationalNumber);
        }
        if (request.responseId) {
          searchParams.append('responseId', request.responseId);
        }
        if (request.includeUserAnswers !== undefined) {
          searchParams.append('includeUserAnswers', request.includeUserAnswers.toString());
        }
        if (request.includeNavigationInfo !== undefined) {
          searchParams.append('includeNavigationInfo', request.includeNavigationInfo.toString());
        }
        if (request.includeStatistics !== undefined) {
          searchParams.append('includeStatistics', request.includeStatistics.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/questions/${request.questionIndex}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyQuestions', id: request.surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Previous Questions
    getPreviousQuestions: builder.query<GetPreviousQuestionsResponseWrapper, GetPreviousQuestionsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        searchParams.append('currentQuestionIndex', request.currentQuestionIndex.toString());
        if (request.maxCount !== undefined) {
          searchParams.append('maxCount', request.maxCount.toString());
        }
        if (request.userNationalNumber) {
          searchParams.append('userNationalNumber', request.userNationalNumber);
        }
        if (request.responseId) {
          searchParams.append('responseId', request.responseId);
        }
        if (request.includeUserAnswers !== undefined) {
          searchParams.append('includeUserAnswers', request.includeUserAnswers.toString());
        }
        if (request.includeNavigationInfo !== undefined) {
          searchParams.append('includeNavigationInfo', request.includeNavigationInfo.toString());
        }
        return {
          url: `/surveys/${request.surveyId}/questions/previous?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyQuestions', id: request.surveyId }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Public/Anonymous endpoints
    // Get Public Survey Details
    getPublicSurveyDetails: builder.query<GetSurveyDetailsResponse, string>({
      query: (surveyId) => `/public/surveys/${surveyId}/details`,
      providesTags: (result, error, surveyId) => [{ type: 'SurveyDetails', id: `public-${surveyId}` }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          dispatch(clearSelectedSurvey());
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSelectedSurvey(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get Public Survey Questions
    getPublicSurveyQuestions: builder.query<GetSurveyQuestionsResponse, GetSurveyQuestionsRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        if (request.includeUserAnswers !== undefined) {
          searchParams.append('includeUserAnswers', request.includeUserAnswers.toString());
        }
        return {
          url: `/public/surveys/${request.surveyId}/questions?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, request) => [{ type: 'SurveyQuestions', id: `public-${request.surveyId}` }],
      keepUnusedDataFor: 300,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setSurveyQuestions(data.data));
            dispatch(setError(null));
          }
        } catch (error: unknown) {
          const errorMessage = handleSurveysApiError(error);
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
  }),
});

export const {
  useGetSurveyOverviewQuery,
  useLazyGetSurveyOverviewQuery,
  useGetSurveyDetailsQuery,
  useLazyGetSurveyDetailsQuery,
  useGetSurveyDetailsWithUserQuery,
  useLazyGetSurveyDetailsWithUserQuery,
  useGetParticipationStatusQuery,
  useLazyGetParticipationStatusQuery,
  useGetActiveSurveysQuery,
  useLazyGetActiveSurveysQuery,
  useGetSurveysWithUserLastResponseQuery,
  useLazyGetSurveysWithUserLastResponseQuery,
  useGetSurveysWithUserResponsesQuery,
  useLazyGetSurveysWithUserResponsesQuery,
  useGetSurveyQuestionsQuery,
  useLazyGetSurveyQuestionsQuery,
  useGetSurveyQuestionsDetailsQuery,
  useLazyGetSurveyQuestionsDetailsQuery,
  useGetSurveyQuestionsWithAnswersQuery,
  useLazyGetSurveyQuestionsWithAnswersQuery,
  useGetUserSurveyResponsesQuery,
  useLazyGetUserSurveyResponsesQuery,
  useGetResponseDetailsQuery,
  useLazyGetResponseDetailsQuery,
  useGetResponseProgressQuery,
  useLazyGetResponseProgressQuery,
  useGetCurrentQuestionQuery,
  useLazyGetCurrentQuestionQuery,
  useGetQuestionByIdQuery,
  useLazyGetQuestionByIdQuery,
  useListQuestionsForNavigationQuery,
  useLazyListQuestionsForNavigationQuery,
  useGetQuestionAnswerDetailsQuery,
  useLazyGetQuestionAnswerDetailsQuery,
  useStartSurveyResponseMutation,
  useAnswerQuestionMutation,
  useGoNextQuestionMutation,
  useGoPreviousQuestionMutation,
  useJumpToQuestionMutation,
  useSubmitResponseMutation,
  useCancelResponseMutation,
  useAutoSaveAnswersMutation,
  useGetSpecificQuestionQuery,
  useLazyGetSpecificQuestionQuery,
  useGetPreviousQuestionsQuery,
  useLazyGetPreviousQuestionsQuery,
  useGetPublicSurveyDetailsQuery,
  useLazyGetPublicSurveyDetailsQuery,
  useGetPublicSurveyQuestionsQuery,
  useLazyGetPublicSurveyQuestionsQuery,
} = surveysApi;

export default surveysApi;

