'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetQuestionByIdQuery,
  useAnswerQuestionMutation,
  useGoNextQuestionMutation,
  useGoPreviousQuestionMutation,
  selectQuestionById,
  selectSurveysLoading
} from '@/src/store/surveys';

import type {
  QuestionOptionDto,
  AnswerQuestionRequest,
} from '@/src/services/Api';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Button } from '@/src/components/ui/Button';
import { TextAreaField } from '@/src/components/forms/TextAreaField';
import {
  PiArrowRight,
  PiArrowLeft,
  PiCheckCircle,
  PiQuestion,
  PiWarning,
  PiTextT,
  PiListBullets,
  PiCircle,
  PiSpinner,
} from 'react-icons/pi';

interface QuestionAnswerPageProps {
  params: Promise<{ surveyId: string; responseId: string; questionId: string }>;
}

/* ===================== Skeleton Components ===================== */

function QuestionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 animate-pulse">
      <div className="space-y-2">
        {/* Question Number and Type */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>

        {/* Question Text */}
        <div className="pt-1 space-y-2">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        </div>
      </div>
    </div>
  );
}

function AnswerFormSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

function QuestionPageSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PageHeader
        title="پاسخ به سوالات"
        titleIcon={<PiQuestion className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton={true}
        onBack={() => {}}
      />
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-4 pb-24">
          <QuestionCardSkeleton />
          <AnswerFormSkeleton />
        </div>
      </ScrollableArea>
    </div>
  );
}

/* ===================== Loading Overlay ===================== */

function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 flex flex-col items-center gap-4 min-w-[200px]">
        <PiSpinner className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
        <p className="text-body font-medium text-gray-900 dark:text-gray-100 text-center">
          {message || 'در حال بارگذاری...'}
        </p>
      </div>
    </div>
  );
}

export default function QuestionAnswerPage({ params }: QuestionAnswerPageProps) {
  const router = useRouter();
  const [surveyIdFromParams, setSurveyIdFromParams] = useState<string>('');
  const [responseIdFromParams, setResponseIdFromParams] = useState<string>('');
  const [questionIdFromParams, setQuestionIdFromParams] = useState<string>('');

  // Form state
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationMessage, setNavigationMessage] = useState<string>('');

  // Redux selectors
  const isLoading = useSelector(selectSurveysLoading);
  const question = useSelector(selectQuestionById);

  // Query hooks
  const [getQuestionById, { isLoading: isQuestionLoading, isFetching: isQuestionFetching }] = useLazyGetQuestionByIdQuery();
  const [answerQuestion, { isLoading: isAnswering }] = useAnswerQuestionMutation();
  const [goNextQuestion, { isLoading: isNavigatingNext }] = useGoNextQuestionMutation();
  const [goPreviousQuestion, { isLoading: isNavigatingPrev }] = useGoPreviousQuestionMutation();

  // Get params from URL
  useEffect(() => {
    params.then(({ surveyId, responseId, questionId }) => {
      setSurveyIdFromParams(surveyId);
      setResponseIdFromParams(responseId);
      setQuestionIdFromParams(questionId);
    });
  }, [params]);

  // Fetch question data
  useEffect(() => {
    if (surveyIdFromParams && responseIdFromParams && questionIdFromParams) {
      getQuestionById({
        surveyId: surveyIdFromParams,
        responseId: responseIdFromParams,
        questionId: questionIdFromParams,
      });
    }
  }, [surveyIdFromParams, responseIdFromParams, questionIdFromParams, getQuestionById]);
    
  // Initialize form with existing answer from question response
  useEffect(() => {
    if (!question) return;
    
    // QuestionByIdResponse has flat structure with textAnswer and selectedOptionIds
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      // Reset navigation state when question loads
      setIsNavigating(false);
      setNavigationMessage('');
      
      if (question.textAnswer) {
        setTextAnswer(question.textAnswer);
      } else {
        setTextAnswer('');
      }
      
      if (question.selectedOptionIds && question.selectedOptionIds.length > 0) {
        setSelectedOptionIds([...question.selectedOptionIds]);
      } else {
        setSelectedOptionIds([]);
      }
    }, 0);
  }, [question]);

  // Get question kind - determine if it's text, single-select, or multi-select
  // QuestionByIdResponse has flat structure
  const isTextQuestion = !question?.options || question.options.length === 0;
  // Note: QuestionByIdResponse doesn't have specification field, so we'll check options length for multi-select
  // For now, assume single-select if options exist (can be enhanced later)
  const isMultiSelect = false; // TODO: Get from API if available
  const isRequired = question?.isRequired === true;
  const options = question?.options || [];
  const isLastQuestion = question?.isLastQuestion === true;

  // Handle option selection (single or multi)
  const handleOptionToggle = useCallback((optionId: string) => {
    if (!optionId) return;
    
    if (isMultiSelect) {
      setSelectedOptionIds((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    } else {
      // Single select
      setSelectedOptionIds([optionId]);
    }
    setValidationError(null);
  }, [isMultiSelect]);

  // Validate answer before submission
  const validateAnswer = useCallback((): boolean => {
    if (isRequired) {
      if (isTextQuestion) {
        if (!textAnswer || textAnswer.trim().length === 0) {
          setValidationError('این سوال الزامی است. لطفاً پاسخ را وارد کنید.');
          return false;
        }
      } else {
        // Option-based question
        if (selectedOptionIds.length === 0) {
          setValidationError('این سوال الزامی است. لطفاً یکی از گزینه‌ها را انتخاب کنید.');
          return false;
        }
      }
    }
    setValidationError(null);
    return true;
  }, [isRequired, isTextQuestion, textAnswer, selectedOptionIds]);

  // Save answer and navigate to next question
  const handleSaveAndNext = useCallback(async () => {
    if (!validateAnswer()) {
      return;
    }

    if (!surveyIdFromParams || !responseIdFromParams || !questionIdFromParams) {
      return;
    }

    try {
      setIsNavigating(true);
      setNavigationMessage('در حال ذخیره پاسخ...');

      // First, save the answer
      const answerRequest: AnswerQuestionRequest = {
        textAnswer: isTextQuestion ? textAnswer.trim() || null : null,
        selectedOptionIds: !isTextQuestion && selectedOptionIds.length > 0 ? selectedOptionIds : null,
        allowBackNavigation: question?.allowBackNavigation,
      };

      const answerResult = await answerQuestion({
        surveyId: surveyIdFromParams,
        responseId: responseIdFromParams,
        questionId: questionIdFromParams,
        data: answerRequest,
      });

      if (answerResult.data?.isSuccess) {
        setNavigationMessage('در حال انتقال به سوال بعدی...');
        
        // Then navigate to next question
        const nextResult = await goNextQuestion({
          surveyId: surveyIdFromParams,
          responseId: responseIdFromParams,
        });

        if (nextResult.data?.isSuccess) {
          // Check if this is the last question
          if (isLastQuestion) {
            setNavigationMessage('در حال انتقال به صفحه نهایی...');
            // Last question completed, redirect to done/review page
            router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/done`);
          } else {
            // After navigation, get the current question to find next question ID
            // The API returns currentQuestionId after navigation
            const currentQuestionId = nextResult.data?.data?.currentQuestionId;
            
            if (currentQuestionId && currentQuestionId !== questionIdFromParams) {
              setNavigationMessage('در حال بارگذاری سوال...');
              // Navigate to next question
              router.push(
                `/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/questions/${currentQuestionId}/answer`
              );
            } else {
              // Fallback: redirect to done page if no next question ID
              setNavigationMessage('در حال انتقال به صفحه نهایی...');
              router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/done`);
            }
          }
        } else {
          setIsNavigating(false);
          setNavigationMessage('');
          setValidationError(nextResult.data?.message || 'خطا در انتقال به سوال بعدی');
        }
      } else {
        setIsNavigating(false);
        setNavigationMessage('');
        setValidationError(answerResult.data?.message || 'خطا در ذخیره پاسخ');
      }
    } catch (error) {
      console.error('Failed to save answer:', error);
      setIsNavigating(false);
      setNavigationMessage('');
      setValidationError('خطا در ذخیره پاسخ. لطفاً دوباره تلاش کنید.');
    }
  }, [
    validateAnswer,
    surveyIdFromParams,
    responseIdFromParams,
    questionIdFromParams,
    isTextQuestion,
    textAnswer,
    selectedOptionIds,
    question,
    answerQuestion,
    goNextQuestion,
    isLastQuestion,
    router,
  ]);


  // Navigate to previous question
  const handlePrevious = useCallback(async () => {
    if (!surveyIdFromParams || !responseIdFromParams) {
      return;
    }

    try {
      setIsNavigating(true);
      setNavigationMessage('در حال انتقال به سوال قبلی...');

      const result = await goPreviousQuestion({
        surveyId: surveyIdFromParams,
        responseId: responseIdFromParams,
      });

      if (result.data?.isSuccess) {
        const previousQuestionId = result.data?.data?.currentQuestionId;
        if (previousQuestionId && previousQuestionId !== questionIdFromParams) {
          setNavigationMessage('در حال بارگذاری سوال...');
          router.push(
            `/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/questions/${previousQuestionId}/answer`
          );
        } else {
          // No previous question, go back
          setIsNavigating(false);
          setNavigationMessage('');
          router.back();
        }
      } else {
        setIsNavigating(false);
        setNavigationMessage('');
        router.back();
      }
    } catch (error) {
      console.error('Failed to navigate to previous question:', error);
      setIsNavigating(false);
      setNavigationMessage('');
      router.back();
    }
  }, [surveyIdFromParams, responseIdFromParams, questionIdFromParams, goPreviousQuestion, router]);

  const handleBack = () => {
    router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}`);
  };

  // Show skeleton while loading initial question
  if ((isLoading || isQuestionLoading) && !question) {
    return <QuestionPageSkeleton />;
  }

  if (!question) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="سوال یافت نشد"
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex justify-center items-center py-12">
            <p className="text-body text-gray-500 dark:text-gray-400">سوال مورد نظر یافت نشد</p>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  // QuestionByIdResponse has flat structure with questionDescription field
  const questionText = question.questionText || 'سوال بدون عنوان';
  const questionDescription = question.questionDescription || null;
  const questionNumber = question.currentQuestionNumber || question.order || 0;
  const totalQuestions = question.totalQuestions || 0;
  const hasPrevious = question.allowBackNavigation === true && !question.isFirstQuestion;

  // Get question type info
  const getQuestionTypeInfo = () => {
    if (isTextQuestion) {
      return {
        icon: <PiTextT className="h-4 w-4" />,
        text: 'متنی',
        color: 'text-purple-600 dark:text-purple-400',
      };
    }
    if (isMultiSelect) {
      return {
        icon: <PiListBullets className="h-4 w-4" />,
        text: 'چند گزینه‌ای',
        color: 'text-indigo-600 dark:text-indigo-400',
      };
    }
    return {
      icon: <PiCircle className="h-4 w-4" />,
      text: 'تک گزینه‌ای',
      color: 'text-blue-600 dark:text-blue-400',
    };
  };

  const questionTypeInfo = getQuestionTypeInfo();

  // Show skeleton while fetching new question during navigation
  const showSkeleton = isQuestionFetching && !question;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PageHeader
        title="پاسخ به سوالات"
        titleIcon={<PiQuestion className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      {/* Loading Overlay for Navigation */}
      {(isNavigating || isNavigatingNext || isNavigatingPrev) && (
        <LoadingOverlay message={navigationMessage || 'در حال انتقال...'} />
      )}

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-4 pb-24">
          {/* Question Info Card - Show skeleton if fetching */}
          {showSkeleton ? (
            <QuestionCardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="space-y-2">
              {/* Question Number and Type */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-caption text-gray-600 dark:text-gray-400">سوال</span>
                  <span className="text-body font-semibold text-gray-900 dark:text-gray-100">
                    {questionNumber}
                  </span>
                  {totalQuestions > 0 && (
                    <>
                      <span className="text-caption text-gray-500 dark:text-gray-500">از</span>
                      <span className="text-body font-semibold text-gray-900 dark:text-gray-100">
                        {totalQuestions}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 ${questionTypeInfo.color}`}>
                    {questionTypeInfo.icon}
                    <span className="text-caption font-medium">{questionTypeInfo.text}</span>
                  </div>
                  {isRequired && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <PiWarning className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-caption font-semibold text-red-600 dark:text-red-400">
                        الزامی
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Question Text and Description */}
              <div className="pt-1">
                <label className="block text-caption text-gray-500 dark:text-gray-400 mb-1.5">
                  عنوان سوال:
                </label>
                <h3 className="text-heading-3 text-gray-900 dark:text-gray-100">
                  {questionText}
                </h3>
                
                {/* Question Description - Directly below title, no separator */}
                {questionDescription && questionDescription.trim() && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {questionDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Answer Form Card - Show skeleton if fetching */}
          {showSkeleton ? (
            <AnswerFormSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="space-y-4">
              {/* Text Answer Input */}
              {isTextQuestion && (
                <div>
                  <label className="block text-caption text-gray-500 dark:text-gray-400 mb-2">
                    پاسخ شما:
                  </label>
                  <TextAreaField
                    value={textAnswer}
                    onChange={(e) => {
                      setTextAnswer(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="پاسخ خود را وارد کنید..."
                    required={isRequired}
                    rows={6}
                    status={validationError ? 'danger' : 'default'}
                  />
                </div>
              )}

              {/* Options Answer (Radio/Checkbox) */}
              {!isTextQuestion && (
                <div className="space-y-2">
                  <label className="block text-label text-gray-700 dark:text-gray-300 mb-3">
                    انتخاب گزینه
                    {isRequired && <span className="text-red-600 dark:text-red-400 mr-1">*</span>}
                  </label>
                  <div className="space-y-2">
                    {options.map((option: QuestionOptionDto) => {
                      if (!option.id || !option.isActive) return null;
                      const isSelected = selectedOptionIds.includes(option.id);
                      
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleOptionToggle(option.id!)}
                          className={`
                            w-full text-right p-3 rounded-lg border transition-all
                            ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-400'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`
                                  flex-shrink-0 w-5 h-5 rounded flex items-center justify-center
                                  ${
                                    isMultiSelect
                                      ? isSelected
                                        ? 'bg-emerald-600 dark:bg-emerald-500 border-2 border-emerald-600 dark:border-emerald-500'
                                        : 'border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800'
                                      : isSelected
                                        ? 'border-2 border-emerald-600 dark:border-emerald-500 bg-white dark:bg-gray-800'
                                        : 'border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800'
                                  }
                                `}
                              >
                                {isSelected && (
                                  <>
                                    {isMultiSelect ? (
                                      <PiCheckCircle className="h-3.5 w-3.5 text-white" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                                    )}
                                  </>
                                )}
                              </div>
                              <span
                                className={`
                                  text-body font-medium truncate
                                  ${isSelected
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-gray-900 dark:text-gray-100'
                                  }
                                `}
                              >
                                {option.text || 'گزینه بدون عنوان'}
                              </span>
                            </div>
                            {isSelected && (
                              <PiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <PiWarning className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-body text-red-600 dark:text-red-400">{validationError}</p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </ScrollableArea>

      {/* Sticky Navigation Buttons - Bottom of page */}
      <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="solid"
            size="md"
            className="flex-1"
            onClick={handleSaveAndNext}
            loading={isAnswering || isNavigatingNext}
            loadingText="در حال ذخیره..."
            disabled={isNavigatingPrev}
            rightIcon={!isAnswering && !isNavigatingNext ? <PiArrowRight className="h-4 w-4" /> : undefined}
          >
            {isLastQuestion ? 'ذخیره و اتمام' : 'ذخیره و بعدی'}
          </Button>

          {hasPrevious && (
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={handlePrevious}
              loading={isNavigatingPrev}
              loadingText="در حال بارگذاری..."
              disabled={isAnswering || isNavigatingNext}
              leftIcon={!isNavigatingPrev ? <PiArrowLeft className="h-4 w-4" /> : undefined}
            >
              قبلی
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

