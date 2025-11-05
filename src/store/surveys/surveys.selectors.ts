import { createSelector } from '@reduxjs/toolkit';
import type { SurveysState } from './surveys.types';
import { RootState } from '..';

// Base selectors
const selectSurveysState = (state: RootState): SurveysState => state.surveys;

// Active surveys selectors
export const selectActiveSurveys = createSelector(
  [selectSurveysState],
  (state) => state.activeSurveys
);

export const selectActiveSurveysPagination = createSelector(
  [selectSurveysState],
  (state) => state.activeSurveysPagination
);

export const selectActiveSurveysWithPagination = createSelector(
  [selectActiveSurveys, selectActiveSurveysPagination],
  (surveys, pagination) => ({
    surveys,
    pagination,
  })
);

// Surveys with last response selectors
export const selectSurveysWithLastResponse = createSelector(
  [selectSurveysState],
  (state) => state.surveysWithLastResponse
);

export const selectSurveysWithLastResponsePagination = createSelector(
  [selectSurveysState],
  (state) => state.surveysWithLastResponsePagination
);

export const selectSurveysWithLastResponseWithPagination = createSelector(
  [selectSurveysWithLastResponse, selectSurveysWithLastResponsePagination],
  (surveys, pagination) => ({
    surveys,
    pagination,
  })
);

// Surveys with responses selectors
export const selectSurveysWithResponses = createSelector(
  [selectSurveysState],
  (state) => state.surveysWithResponses
);

export const selectSurveysWithResponsesPagination = createSelector(
  [selectSurveysState],
  (state) => state.surveysWithResponsesPagination
);

export const selectSurveysWithResponsesWithPagination = createSelector(
  [selectSurveysWithResponses, selectSurveysWithResponsesPagination],
  (surveys, pagination) => ({
    surveys,
    pagination,
  })
);

// Selected survey selectors
export const selectSelectedSurvey = createSelector(
  [selectSurveysState],
  (state) => state.selectedSurvey
);

export const selectSelectedSurveyOverview = createSelector(
  [selectSurveysState],
  (state) => state.selectedSurveyOverview
);

export const selectSurveyById = createSelector(
  [
    selectActiveSurveys,
    selectSurveysWithLastResponse,
    selectSurveysWithResponses,
    (state: RootState, surveyId: string) => surveyId,
  ],
  (activeSurveys, surveysWithLastResponse, surveysWithResponses, surveyId) => {
    const allSurveys = [
      ...activeSurveys,
      ...surveysWithLastResponse,
      ...surveysWithResponses,
    ];
    return allSurveys.find((s) => s.id === surveyId) || null;
  }
);

// Survey questions selectors
export const selectSurveyQuestions = createSelector(
  [selectSurveysState],
  (state) => state.surveyQuestions
);

export const selectSurveyQuestionsDetails = createSelector(
  [selectSurveysState],
  (state) => state.surveyQuestionsDetails
);

export const selectSurveyQuestionsWithAnswers = createSelector(
  [selectSurveysState],
  (state) => state.surveyQuestionsWithAnswers
);

// User responses selectors
export const selectUserSurveyResponses = createSelector(
  [selectSurveysState],
  (state) => state.userSurveyResponses
);

export const selectCurrentResponse = createSelector(
  [selectSurveysState],
  (state) => state.currentResponse
);

export const selectSelectedResponse = createSelector(
  [selectSurveysState],
  (state) => state.selectedResponse
);

export const selectResponseProgress = createSelector(
  [selectSurveysState],
  (state) => state.responseProgress
);

// Current question and navigation selectors
export const selectCurrentQuestion = createSelector(
  [selectSurveysState],
  (state) => state.currentQuestion
);

export const selectQuestionById = createSelector(
  [selectSurveysState],
  (state) => state.questionById
);

export const selectQuestionsNavigation = createSelector(
  [selectSurveysState],
  (state) => state.questionsNavigation
);

export const selectQuestionAnswerDetails = createSelector(
  [selectSurveysState],
  (state) => state.questionAnswerDetails
);

// Participation status selectors
export const selectParticipationStatus = createSelector(
  [selectSurveysState],
  (state) => state.participationStatus
);

// Loading and error selectors
export const selectSurveysLoading = createSelector(
  [selectSurveysState],
  (state) => state.isLoading
);

export const selectSurveysError = createSelector(
  [selectSurveysState],
  (state) => state.error
);

export const selectLastFetched = createSelector(
  [selectSurveysState],
  (state) => state.lastFetched
);

// Combined selectors
export const selectSelectedSurveyWithOverview = createSelector(
  [selectSelectedSurvey, selectSelectedSurveyOverview],
  (survey, overview) => ({
    survey,
    overview,
  })
);

export const selectSurveyResponseState = createSelector(
  [
    selectCurrentResponse,
    selectSelectedResponse,
    selectResponseProgress,
    selectCurrentQuestion,
    selectQuestionsNavigation,
  ],
  (currentResponse, selectedResponse, responseProgress, currentQuestion, questionsNavigation) => ({
    currentResponse,
    selectedResponse,
    responseProgress,
    currentQuestion,
    questionsNavigation,
  })
);

