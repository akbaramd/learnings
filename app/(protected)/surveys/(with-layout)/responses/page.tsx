'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  useLazyGetSurveysWithUserResponsesQuery,
  type SurveyDto,
  type ResponseDto,
} from '@/src/store/surveys';
import {
  PiFileText,
  PiArrowClockwise,
  PiFunnelSimple,
  PiX,
  PiCheckCircle,
  PiClock,
  PiArrowRight,
  PiClipboardText,
} from 'react-icons/pi';
import { useSurveysPageHeader } from '../SurveysPageHeaderContext';

// Utility functions removed - no longer needed

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'نامشخص';
  try {
    return new Date(dateString).toLocaleDateString('fa-IR');
  } catch {
    return 'نامشخص';
  }
}

export default function ResponsesPage() {
  const router = useRouter();
  const { setHeaderState } = useSurveysPageHeader();

  // State
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const [responseStatusFilter, setResponseStatusFilter] = useState<string | undefined>(undefined);
  const [allSurveys, setAllSurveys] = useState<SurveyDto[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{
    pageNumber: number;
    totalPages: number;
    hasNextPage: boolean;
  } | null>(null);
  const pageSize = 20;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Query hook
  const [getSurveysWithResponses] = useLazyGetSurveysWithUserResponsesQuery();

  // Derived values
  const normalizedSearch = useMemo(() => search.trim(), [search]);

  // Stable handlers
  const handleSurveyClick = useCallback((survey: SurveyDto) => {
    if (survey.id) {
      router.push(`/surveys/${survey.id}`);
    }
  }, [router]);

  const handleResponseClick = useCallback((survey: SurveyDto, response: ResponseDto) => {
    if (survey.id && response.id) {
      router.push(`/surveys/${survey.id}/responses/${response.id}`);
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const result = await getSurveysWithResponses({
        pageNumber: 1,
        pageSize,
        searchTerm: normalizedSearch || undefined,
        state: stateFilter,
        userResponseStatus: responseStatusFilter,
        includeUserResponses: true,
        includeUserLastResponse: true,
      });
      
      if (result.data?.isSuccess && result.data?.data) {
        const items = result.data.data.surveys || [];
        const pageInfo = result.data.data;
        const pageSizeFromApi = pageInfo.pageSize || pageSize;
        const totalCount = pageInfo.totalCount || 0;
        const totalPages = pageSizeFromApi > 0 
          ? Math.max(1, Math.ceil(totalCount / pageSizeFromApi))
          : 1;
        
        setPagination({
          pageNumber: pageInfo.pageNumber || 1,
          totalPages,
          hasNextPage: (pageInfo.pageNumber || 1) < totalPages,
        });
        
        setAllSurveys(items);
        setCurrentPage(1);
      } else {
        console.error('Failed to refresh responses:', result.data?.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Failed to refresh responses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getSurveysWithResponses, pageSize, normalizedSearch, stateFilter, responseStatusFilter, isLoading]);

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
      title: 'پاسخ‌های نظرسنجی',
      titleIcon: <PiFileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
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

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearch, stateFilter, responseStatusFilter]);

  // Fetch data when filters/search change or page changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getSurveysWithResponses({
          pageNumber: currentPage,
          pageSize,
          searchTerm: normalizedSearch || undefined,
          state: stateFilter,
          userResponseStatus: responseStatusFilter,
          includeUserResponses: true,
          includeUserLastResponse: true,
        });
        
        if (result.data?.isSuccess && result.data?.data) {
          const items = result.data.data.surveys || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalCount = pageInfo.totalCount || 0;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil(totalCount / pageSizeFromApi))
            : 1;
          
          setPagination({
            pageNumber: pageInfo.pageNumber || currentPage,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || currentPage) < totalPages,
          });
          
          if (currentPage === 1) {
            setAllSurveys(items);
          } else {
            setAllSurveys(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const newItems = items.filter(s => s.id && !existingIds.has(s.id));
              if (newItems.length === 0) return prev;
              return [...prev, ...newItems];
            });
          }
        } else {
          console.error('Failed to fetch responses:', result.data?.message || 'Unknown error');
          if (currentPage === 1) {
            setAllSurveys([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch responses:', err);
        if (currentPage === 1) {
          setAllSurveys([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, normalizedSearch, stateFilter, responseStatusFilter, getSurveysWithResponses, pageSize]);


  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !pagination) return;
    
    const hasMore = pagination.hasNextPage;
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
  }, [pagination, isLoading]);

  const handleLoadMore = useCallback(() => {
    if (!pagination || isLoading) return;
    const hasMore = pagination.hasNextPage;
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination, isLoading]);

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
                  وضعیت نظرسنجی
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
                  وضعیت پاسخ
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={responseStatusFilter === undefined ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setResponseStatusFilter(undefined)}
                  >
                    همه
                  </Button>
                  <Button
                    variant={responseStatusFilter === 'Submitted' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setResponseStatusFilter('Submitted')}
                  >
                    ارسال شده
                  </Button>
                  <Button
                    variant={responseStatusFilter === 'InProgress' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setResponseStatusFilter('InProgress')}
                  >
                    در حال تکمیل
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

              <div className="space-y-3">
                {allSurveys.map((survey) => {
                  const responses = survey.userResponses || [];
                  const latestResponse = survey.userLastResponse;
                  const hasUserResponse = survey.hasUserResponse === true;
                  
                  // Show survey if it has user response (either in userResponses array or userLastResponse)
                  if (!hasUserResponse || (!latestResponse && responses.length === 0)) {
                    return null;
                  }

                  return (
                    <Card
                      key={survey.id}
                      variant="default"
                      radius="lg"
                      padding="md"
                    >
                      {/* Survey Header */}
                      <div className="pb-3 border-b border-gray-200 dark:border-gray-800 mb-3">
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
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSurveyClick(survey)}
                            rightIcon={<PiArrowRight className="h-3 w-3" />}
                          >
                            مشاهده نظرسنجی
                          </Button>
                        </div>
                      </div>

                      {/* Responses List */}
                      <div className="space-y-2">
                        {(latestResponse ? [latestResponse] : responses.length > 0 ? responses.slice(0, 3) : []).map((response) => {
                          const isSubmitted = response.isSubmitted === true;
                          const isActive = response.isActive === true;
                          const completionPercentage = response.completionPercentage || 0;
                          
                          return (
                            <Card
                              key={response.id}
                              variant="default"
                              radius="md"
                              padding="md"
                              hover={true}
                              clickable={true}
                              onClick={() => handleResponseClick(survey, response)}
                              className="border-l-2 border-l-blue-400 dark:border-l-blue-600"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      تلاش شماره {response.attemptNumber || 1}
                                    </span>
                                    {isSubmitted && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                        <PiCheckCircle className="h-3 w-3 inline ml-1" />
                                        ارسال شده
                                      </span>
                                    )}
                                    {isActive && !isSubmitted && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                        در حال تکمیل
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    {response.submittedAt && (
                                      <div className="flex items-center gap-1">
                                        <PiClock className="h-3 w-3" />
                                        <span>ارسال: {formatDate(response.submittedAt)}</span>
                                      </div>
                                    )}
                                    {completionPercentage > 0 && (
                                      <span>پیشرفت: {Math.round(completionPercentage)}%</span>
                                    )}
                                  </div>
                                </div>
                                <PiArrowRight className="h-5 w-5 text-gray-400" />
                              </div>
                            </Card>
                          );
                        })}
                        
                        {(responses.length > 1 || (latestResponse && responses.length > 0)) && survey.id && (
                          <Button
                            variant="secondary"
                            size="sm"
                            block
                            onClick={() => {
                              if (latestResponse?.id) {
                                router.push(`/surveys/${survey.id}/responses/${latestResponse.id}`);
                              } else if (responses.length > 0 && responses[0]?.id) {
                                router.push(`/surveys/${survey.id}/responses/${responses[0].id}`);
                              }
                            }}
                            rightIcon={<PiArrowRight className="h-3 w-3" />}
                          >
                            مشاهده همه پاسخ‌ها ({responses.length || (latestResponse ? 1 : 0)})
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Load More Trigger & Button */}
              {pagination && pagination.hasNextPage && (
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

              {pagination && !pagination.hasNextPage && allSurveys.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    تمام پاسخ‌ها نمایش داده شد
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiFileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {normalizedSearch ? 'نتیجه‌ای یافت نشد' : 'پاسخی یافت نشد'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {normalizedSearch
                  ? 'لطفاً عنوان نظرسنجی دیگری را جستجو کنید'
                  : 'هیچ پاسخی با فیلترهای انتخابی پیدا نشد'
                }
              </p>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}

