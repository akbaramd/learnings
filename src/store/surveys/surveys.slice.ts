import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  SurveysState,
  PaginationInfo,
  SurveyDto,
  SurveyOverviewResponse,
  SurveyQuestionsResponse,
  SurveyQuestionsDetailsResponse,
  SurveyQuestionsWithAnswersResponse,
  UserSurveyResponsesResponse,
  ResponseDto,
  ResponseDetailsDto,
  ResponseProgressResponse,
  CurrentQuestionResponse,
  QuestionByIdResponse,
  QuestionsNavigationResponse,
  QuestionAnswerDetailsDto,
  ParticipationStatusResponse,
} from './surveys.types';

const initialState: SurveysState = {
  activeSurveys: [],
  activeSurveysPagination: null,
  surveysWithLastResponse: [],
  surveysWithLastResponsePagination: null,
  surveysWithResponses: [],
  surveysWithResponsesPagination: null,
  selectedSurvey: null,
  selectedSurveyOverview: null,
  surveyQuestions: null,
  surveyQuestionsDetails: null,
  surveyQuestionsWithAnswers: null,
  userSurveyResponses: null,
  currentResponse: null,
  selectedResponse: null,
  responseProgress: null,
  currentQuestion: null,
  questionById: null,
  questionsNavigation: null,
  questionAnswerDetails: null,
  participationStatus: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

const surveysSlice = createSlice({
  name: 'surveys',
  initialState,
  reducers: {
    // Active surveys management
    setActiveSurveys: (state, action: PayloadAction<SurveyDto[]>) => {
      state.activeSurveys = action.payload;
    },

    clearActiveSurveys: (state) => {
      state.activeSurveys = [];
      state.activeSurveysPagination = null;
    },

    setActiveSurveysPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.activeSurveysPagination = action.payload;
    },

    // Surveys with last response management
    setSurveysWithLastResponse: (state, action: PayloadAction<SurveyDto[]>) => {
      state.surveysWithLastResponse = action.payload;
    },

    clearSurveysWithLastResponse: (state) => {
      state.surveysWithLastResponse = [];
      state.surveysWithLastResponsePagination = null;
    },

    setSurveysWithLastResponsePagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.surveysWithLastResponsePagination = action.payload;
    },

    // Surveys with responses management
    setSurveysWithResponses: (state, action: PayloadAction<SurveyDto[]>) => {
      state.surveysWithResponses = action.payload;
    },

    clearSurveysWithResponses: (state) => {
      state.surveysWithResponses = [];
      state.surveysWithResponsesPagination = null;
    },

    setSurveysWithResponsesPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.surveysWithResponsesPagination = action.payload;
    },

    // Selected survey management
    setSelectedSurvey: (state, action: PayloadAction<SurveyDto | null>) => {
      state.selectedSurvey = action.payload;
    },

    clearSelectedSurvey: (state) => {
      state.selectedSurvey = null;
      state.selectedSurveyOverview = null;
    },

    setSelectedSurveyOverview: (state, action: PayloadAction<SurveyOverviewResponse | null>) => {
      state.selectedSurveyOverview = action.payload;
    },

    // Survey questions management
    setSurveyQuestions: (state, action: PayloadAction<SurveyQuestionsResponse | null>) => {
      state.surveyQuestions = action.payload;
    },

    clearSurveyQuestions: (state) => {
      state.surveyQuestions = null;
    },

    setSurveyQuestionsDetails: (state, action: PayloadAction<SurveyQuestionsDetailsResponse | null>) => {
      state.surveyQuestionsDetails = action.payload;
    },

    clearSurveyQuestionsDetails: (state) => {
      state.surveyQuestionsDetails = null;
    },

    setSurveyQuestionsWithAnswers: (state, action: PayloadAction<SurveyQuestionsWithAnswersResponse | null>) => {
      state.surveyQuestionsWithAnswers = action.payload;
    },

    clearSurveyQuestionsWithAnswers: (state) => {
      state.surveyQuestionsWithAnswers = null;
    },

    // User responses management
    setUserSurveyResponses: (state, action: PayloadAction<UserSurveyResponsesResponse | null>) => {
      state.userSurveyResponses = action.payload;
    },

    clearUserSurveyResponses: (state) => {
      state.userSurveyResponses = null;
    },

    setCurrentResponse: (state, action: PayloadAction<ResponseDto | null>) => {
      state.currentResponse = action.payload;
    },

    clearCurrentResponse: (state) => {
      state.currentResponse = null;
    },

    setSelectedResponse: (state, action: PayloadAction<ResponseDetailsDto | null>) => {
      state.selectedResponse = action.payload;
    },

    clearSelectedResponse: (state) => {
      state.selectedResponse = null;
    },

    setResponseProgress: (state, action: PayloadAction<ResponseProgressResponse | null>) => {
      state.responseProgress = action.payload;
    },

    clearResponseProgress: (state) => {
      state.responseProgress = null;
    },

    // Current question and navigation management
    setCurrentQuestion: (state, action: PayloadAction<CurrentQuestionResponse | null>) => {
      state.currentQuestion = action.payload;
    },

    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },

    setQuestionById: (state, action: PayloadAction<QuestionByIdResponse | null>) => {
      state.questionById = action.payload;
    },

    clearQuestionById: (state) => {
      state.questionById = null;
    },

    setQuestionsNavigation: (state, action: PayloadAction<QuestionsNavigationResponse | null>) => {
      state.questionsNavigation = action.payload;
    },

    clearQuestionsNavigation: (state) => {
      state.questionsNavigation = null;
    },

    setQuestionAnswerDetails: (state, action: PayloadAction<QuestionAnswerDetailsDto | null>) => {
      state.questionAnswerDetails = action.payload;
    },

    clearQuestionAnswerDetails: (state) => {
      state.questionAnswerDetails = null;
    },

    // Participation status management
    setParticipationStatus: (state, action: PayloadAction<ParticipationStatusResponse | null>) => {
      state.participationStatus = action.payload;
    },

    clearParticipationStatus: (state) => {
      state.participationStatus = null;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setLastFetched: (state, action: PayloadAction<string>) => {
      state.lastFetched = action.payload;
    },

    // Reset entire state
    resetSurveysState: () => initialState,
  },
});

export const {
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
  clearError,
  setLastFetched,
  resetSurveysState,
} = surveysSlice.actions;

export const surveysReducer = surveysSlice.reducer;
export default surveysSlice;

