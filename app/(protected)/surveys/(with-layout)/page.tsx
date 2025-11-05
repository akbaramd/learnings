'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  useLazyGetSurveysWithUserLastResponseQuery,
  useStartSurveyResponseMutation,
  selectSurveysWithLastResponse,
  selectSurveysWithLastResponsePagination,
  selectSurveysLoading,
  type SurveyDto,
} from '@/src/store/surveys';
import {
  PiClipboardText,
  PiArrowClockwise,
  PiFunnelSimple,
  PiX,
  PiCheckCircle,
  PiCalendar,
  PiClock,
  PiArrowRight,
  PiPlay,
} from 'react-icons/pi';
import { useSurveysPageHeader } from './SurveysPageHeaderContext';

// Utility functions
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'نامشخص';
  try {
    return new Date(dateString).toLocaleDateString('fa-IR');
  } catch {
    return 'نامشخص';
  }
}

export default function SurveysPage() {
  const router = useRouter();
  const { setHeaderState } = useSurveysPageHeader();

  // UI State (local)
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const [isAcceptingFilter, setIsAcceptingFilter] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  
  // Redux State (from store)
  const allSurveys = useSelector(selectSurveysWithLastResponse);
  const pagination = useSelector(selectSurveysWithLastResponsePagination);
  const isLoading = useSelector(selectSurveysLoading);
  
  const pageSize = 20;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Query hook
  const [getSurveys] = useLazyGetSurveysWithUserLastResponseQuery();
  const [startSurveyResponse, { isLoading: isStartingResponse }] = useStartSurveyResponseMutation();

  // Derived values
  const normalizedSearch = useMemo(() => search.trim(), [search]);
  
  // Track which survey is being started
  const [startingSurveyId, setStartingSurveyId] = useState<string | null>(null);
  
  // Derived pagination info
  const paginationInfo = useMemo(() => {
    if (!pagination) return null;
    return {
      pageNumber: pagination.pageNumber || currentPage,
      totalPages: pagination.totalPages || 1,
      hasNextPage: pagination.hasNextPage || false,
    };
  }, [pagination, currentPage]);

  // Stable handlers
  const handleSurveyClick = useCallback((survey: SurveyDto) => {
    if (survey.id) {
      router.push(`/surveys/${survey.id}`);
    }
  }, [router]);

  const handleStartSurvey = useCallback(async (survey: SurveyDto) => {
    if (!survey.id || isStartingResponse || startingSurveyId) return;
    
    try {
      setStartingSurveyId(survey.id);
      const result = await startSurveyResponse({
        surveyId: survey.id,
        data: {
          forceNewAttempt: false,
          resumeActiveIfAny: true,
        },
      });

      if (result.data?.isSuccess && result.data?.data?.responseId) {
        // Redirect to response page to load questions
        router.push(`/surveys/${survey.id}/responses/${result.data.data.responseId}`);
      } else {
        console.error('Failed to start survey response:', result.data?.message || 'Unknown error');
        setStartingSurveyId(null);
      }
    } catch (error) {
      console.error('Failed to start survey response:', error);
      setStartingSurveyId(null);
    }
  }, [startSurveyResponse, router, isStartingResponse, startingSurveyId]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    try {
      await getSurveys({
        pageNumber: currentPage,
        pageSize,
        searchTerm: normalizedSearch || undefined,
        state: stateFilter,
        isAcceptingResponses: isAcceptingFilter,
      });
    } catch (err) {
      console.error('Failed to refresh surveys:', err);
    }
  }, [getSurveys, currentPage, pageSize, normalizedSearch, stateFilter, isAcceptingFilter, isLoading]);

  const onBack = useCallback(() => {
    if (document.referrer && document.referrer.includes('/dashboard')) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const onToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Set header state
  useEffect(() => {
    setHeaderState({
      title: 'نظرسنجی‌ها',
      titleIcon: <PiClipboardText className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      showBackButton: true,
      onBack,
      rightActions: [
        {
          icon: <PiFunnelSimple className="h-4 w-4" />,
          onClick: onToggleFilters,
          label: 'فیلتر',
          'aria-label': 'فیلتر',
        },
        {
          icon: <PiArrowClockwise className="h-4 w-4" />,
          onClick: handleRefresh,
          label: 'تازه‌سازی',
          'aria-label': 'تازه‌سازی',
        },
      ],
    });
  }, [setHeaderState, onBack, onToggleFilters, handleRefresh]);

  // Track filter key to detect changes and reset page
  const filterKey = useMemo(
    () => `${normalizedSearch || ''}-${stateFilter || ''}-${isAcceptingFilter ?? ''}`,
    [normalizedSearch, stateFilter, isAcceptingFilter]
  );
  const prevFilterKeyRef = useRef<string>(filterKey);
  
  // Reset page when filters change (using startTransition to avoid warning)
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      // Use setTimeout to defer state update (avoids React warning)
      setTimeout(() => setCurrentPage(1), 0);
    }
  }, [filterKey]);

  // Fetch surveys when page/filters change
  useEffect(() => {
    getSurveys({
      pageNumber: currentPage,
      pageSize,
      searchTerm: normalizedSearch || undefined,
      state: stateFilter,
      isAcceptingResponses: isAcceptingFilter,
    });
  }, [currentPage, normalizedSearch, stateFilter, isAcceptingFilter, getSurveys, pageSize]);


  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !paginationInfo) return;
    
    const hasMore = paginationInfo.hasNextPage;
    if (!hasMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [paginationInfo, isLoading]);

  const handleLoadMore = useCallback(() => {
    if (!paginationInfo || isLoading) return;
    const hasMore = paginationInfo.hasNextPage;
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo, isLoading]);

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Search & Filters Card */}
      {showFilters && (
        <div className="flex-shrink-0 mb-4">
          <Card variant="default" radius="lg" padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">جستجو و فیلتر</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="p-1"
                aria-label="بستن فیلتر"
              >
                <PiX className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                جستجو
              </label>
              <div className="flex gap-2">
                <InputField
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی عنوان نظرسنجی..."
                  className="flex-1"
                />
                {normalizedSearch && (
                  <Button
                    onClick={() => setSearch('')}
                    variant="secondary"
                    title="پاک کردن جستجو"
                    size="sm"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={stateFilter === undefined ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStateFilter(undefined)}
                  >
                    همه
                  </Button>
                  <Button
                    variant={stateFilter === 'Active' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStateFilter('Active')}
                  >
                    فعال
                  </Button>
                  <Button
                    variant={stateFilter === 'Scheduled' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStateFilter('Scheduled')}
                  >
                    زمان‌بندی شده
                  </Button>
                  <Button
                    variant={stateFilter === 'Closed' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStateFilter('Closed')}
                  >
                    بسته
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  پذیرش پاسخ
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={isAcceptingFilter === undefined ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setIsAcceptingFilter(undefined)}
                  >
                    همه
                  </Button>
                  <Button
                    variant={isAcceptingFilter === true ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setIsAcceptingFilter(true)}
                  >
                    در حال پذیرش
                  </Button>
                  <Button
                    variant={isAcceptingFilter === false ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setIsAcceptingFilter(false)}
                  >
                    غیرفعال
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Scrollable Content */}
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="pb-2">
          {isLoading && allSurveys.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <PiArrowClockwise className="h-6 w-6 animate-spin text-gray-400" />
              <span className="mr-2 text-gray-500">در حال بارگذاری...</span>
            </div>
          ) : allSurveys && allSurveys.length > 0 ? (
            <>
              {normalizedSearch && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearch('')}
                      className="text-xs"
                    >
                      پاک کردن جستجو
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {allSurveys.map((survey) => {
                  const isActive = survey.isActive === true;
                  const isAccepting = survey.isAcceptingResponses === true;
                  const hasUserResponse = survey.hasUserResponse === true;
                  const userCompletionPercentage = survey.userCompletionPercentage || 0;
                  
                  return (
                    <Card
                      key={survey.id}
                      variant="default"
                      radius="lg"
                      padding="md"
                      hover={true}
                      clickable={true}
                      onClick={() => handleSurveyClick(survey)}
                    >
                      <div className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <PiClipboardText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                              <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {survey.title || 'بدون عنوان'}
                              </div>
                              {survey.stateText && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {survey.stateText}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                <PiCheckCircle className="h-3 w-3 inline ml-1" />
                                فعال
                              </span>
                            )}
                            {isAccepting && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                پذیرش پاسخ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {survey.description && (
                        <div className="px-4 pb-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {survey.description}
                          </p>
                        </div>
                      )}

                      {/* Survey Info */}
                      <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {survey.startAt && (
                            <div className="flex items-center gap-2">
                              <PiCalendar className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">شروع:</span>
                              <span className="text-xs text-gray-900 dark:text-gray-100">{formatDate(survey.startAt)}</span>
                            </div>
                          )}
                          {survey.endAt && (
                            <div className="flex items-center gap-2">
                              <PiClock className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">پایان:</span>
                              <span className="text-xs text-gray-900 dark:text-gray-100">{formatDate(survey.endAt)}</span>
                            </div>
                          )}
                          {survey.totalQuestions !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">سوالات:</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{survey.totalQuestions}</span>
                            </div>
                          )}
                          {hasUserResponse && userCompletionPercentage > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">پیشرفت:</span>
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {Math.round(userCompletionPercentage)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {survey.id && (
                        <div className="px-4 pb-3 space-y-2">
                          {/* Start Survey Button - Show if survey is active, accepting, and user can participate */}
                          {isActive && isAccepting && survey.canUserParticipate === true && (
                            <Button
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartSurvey(survey);
                              }}
                              variant="primary"
                              disabled={startingSurveyId === survey.id || isStartingResponse}
                              rightIcon={startingSurveyId === survey.id ? <PiArrowClockwise className="h-4 w-4 animate-spin" /> : <PiPlay className="h-4 w-4" />}
                            >
                              {startingSurveyId === survey.id 
                                ? 'در حال شروع...' 
                                : hasUserResponse 
                                  ? 'ادامه پاسخ' 
                                  : 'شروع نظرسنجی'
                              }
                            </Button>
                          )}
                          
                          {/* View Details Button - Always show */}
                          <Button
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/surveys/${survey.id}`);
                            }}
                            variant={isActive && isAccepting && survey.canUserParticipate === true ? "secondary" : "primary"}
                            rightIcon={<PiArrowRight className="h-4 w-4" />}
                          >
                            مشاهده جزئیات
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Load More Trigger & Button */}
              {paginationInfo && paginationInfo.hasNextPage && (
                <div ref={loadMoreRef} className="mt-4 flex flex-col items-center gap-3">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <PiArrowClockwise className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">در حال بارگذاری...</span>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="min-w-[120px]"
                    >
                      بارگذاری بیشتر
                    </Button>
                  )}
                </div>
              )}

              {paginationInfo && !paginationInfo.hasNextPage && allSurveys.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    تمام نظرسنجی‌ها نمایش داده شد
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiClipboardText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {normalizedSearch ? 'نتیجه‌ای یافت نشد' : 'نظرسنجی‌ای یافت نشد'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {normalizedSearch
                  ? 'لطفاً عنوان نظرسنجی دیگری را جستجو کنید'
                  : 'هیچ نظرسنجی‌ای با فیلترهای انتخابی پیدا نشد'
                }
              </p>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}

