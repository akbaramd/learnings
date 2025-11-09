'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetFacilityDetailsQuery,
  useLazyGetFacilityCyclesQuery,
  selectSelectedFacility,
  selectFacilitiesLoading,
  type FacilityCycleWithUserDto,
} from '@/src/store/facilities';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  PiMoney,
  PiArrowRight,
  PiCalendar,
  PiCheckCircle,
  PiClock,
  PiFileText,
} from 'react-icons/pi';

interface FacilityDetailPageProps {
  params: Promise<{ facilityId: string }>;
}

function formatCurrencyFa(amount: number | null | undefined): string {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '0';
  }
}

export default function FacilityDetailPage({ params }: FacilityDetailPageProps) {
  const router = useRouter();
  const [facilityIdFromParams, setFacilityIdFromParams] = useState<string>('');

  // Redux selectors
  const isLoading = useSelector(selectFacilitiesLoading);
  const facility = useSelector(selectSelectedFacility);

  // Query hooks
  const [getFacilityDetails, { isLoading: isDetailsLoading }] = useLazyGetFacilityDetailsQuery();
  const [getFacilityCycles, { data: cyclesData, isLoading: isCyclesLoading }] = useLazyGetFacilityCyclesQuery();

  // Get facility ID from params
  useEffect(() => {
    params.then(({ facilityId }) => {
      setFacilityIdFromParams(facilityId);
    });
  }, [params]);

  // Fetch facility details and cycles
  useEffect(() => {
    if (facilityIdFromParams) {
      getFacilityDetails(facilityIdFromParams);
      // Fetch only active cycles to keep page manageable
      // User can view all cycles via "View All" button
      getFacilityCycles({
        facilityId: facilityIdFromParams,
        page: 1,
        pageSize: 5, // Show only first 5 active cycles
        onlyActive: true, // Only show active cycles
        includeUserRequestStatus: true,
        includeStatistics: true,
      });
    }
  }, [facilityIdFromParams, getFacilityDetails, getFacilityCycles]);

  const handleBack = () => {
    if (document.referrer && document.referrer.includes('/facilities')) {
      router.back();
    } else {
      router.push('/facilities');
    }
  };

  const handleViewCycles = () => {
    if (facilityIdFromParams) {
      router.push(`/facilities/${facilityIdFromParams}/cycles`);
    }
  };

  const handleCycleClick = (cycle: FacilityCycleWithUserDto) => {
    // If user has a request for this cycle, navigate to request details
    if (cycle.lastRequest?.id) {
      router.push(`/facilities/requests/${cycle.lastRequest.id}`);
    } else if (cycle.id) {
      // Otherwise, navigate to request creation page
      router.push(`/facilities/cycles/${cycle.id}/request`);
    }
  };

  // Access cycles from response
  // cyclesData is GetFacilityCyclesResponse (ApplicationResult wrapper)
  // cyclesData.data is GetFacilityCyclesWithUserQueryResponse (has items array)
  // So: cyclesData?.data?.items
  const cycles: FacilityCycleWithUserDto[] = cyclesData?.data?.items || [];

  if ((isLoading || isDetailsLoading) && !facility) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="در حال بارگذاری..."
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">در حال بارگذاری...</p>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="تسهیلات یافت نشد"
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">تسهیلات مورد نظر یافت نشد</p>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  // Smart logic for guide message
  const activeCycle = cycles.find(cycle => cycle.isActive === true);
  const upcomingCycle = cycles.find(cycle => cycle.hasStarted === false);
  const hasAnyCycles = cycles.length > 0;
  
  const getGuideMessage = () => {
    if (activeCycle) {
      return {
        title: `برای دوره "${activeCycle.name || 'فعال'}" درخواست دهید`,
        description: 'یکی از دوره‌های فعال زیر را انتخاب کنید و برای آن درخواست ثبت کنید. اگر قبلاً درخواست داده‌اید، می‌توانید وضعیت آن را مشاهده کنید.',
        icon: <PiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
        bgClass: 'bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20',
        borderClass: 'border-emerald-200 dark:border-emerald-800',
      };
    } else if (upcomingCycle) {
      return {
        title: 'منتظر باشید تا دوره فعال شروع شود',
        description: `دوره "${upcomingCycle.name || 'آینده'}" در آینده شروع خواهد شد. لطفاً منتظر بمانید تا دوره فعال شود.`,
        icon: <PiClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
        bgClass: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
        borderClass: 'border-yellow-200 dark:border-yellow-800',
      };
    } else if (hasAnyCycles) {
      return {
        title: 'در حال حاضر دوره فعالی وجود ندارد',
        description: 'همه دوره‌های این تسهیلات به پایان رسیده‌اند. لطفاً منتظر دوره‌های جدید باشید.',
        icon: <PiClock className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        bgClass: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-900/20',
        borderClass: 'border-gray-200 dark:border-gray-700',
      };
    } else {
      return {
        title: 'در حال حاضر دوره‌ای موجود نیست',
        description: 'برای این تسهیلات هنوز دوره‌ای تعریف نشده است. لطفاً بعداً بررسی کنید.',
        icon: <PiCalendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        bgClass: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-900/20',
        borderClass: 'border-gray-200 dark:border-gray-700',
      };
    }
  };
  
  const guideMessage = getGuideMessage();

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title={facility.name || 'جزئیات تسهیلات'}
        titleIcon={<PiMoney className="h-5 w-5 text-primary" />}
        showBackButton={true}
        onBack={handleBack}
        rightActions={[
          {
            icon: <PiArrowRight className="h-4 w-4" />,
            onClick: handleViewCycles,
            label: 'مشاهده دوره‌ها',
            'aria-label': 'مشاهده دوره‌ها',
          },
        ]}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-3">
          {/* Call to Action / Guide Section - Smart */}
          <Card variant="default" radius="lg" padding="md" className={`${guideMessage.bgClass} border ${guideMessage.borderClass}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {guideMessage.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {guideMessage.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {guideMessage.description}
                </p>
              </div>
            </div>
          </Card>



          {/* Basic Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              اطلاعات کلی
            </h3>
            <div className="space-y-2">
              {facility.code && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">کد تسهیلات</div>
                  <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                    {facility.code}
                  </div>
                </div>
              )}
              {facility.description && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">توضیحات</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {facility.description}
                  </div>
                </div>
              )}
              {facility.isAcceptingApplications && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    پذیرش درخواست
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Cycles */}
          <Card variant="default" radius="lg" padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <PiCalendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                دوره‌های فعال
              </h3>
              {cyclesData?.data?.totalCount && cyclesData.data.totalCount > cycles.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewCycles}
                >
                  مشاهده همه ({cyclesData.data.totalCount})
                </Button>
              )}
            </div>
            
            {isCyclesLoading ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری دوره‌ها...</p>
              </div>
            ) : cycles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <PiCalendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">دوره‌ای موجود نیست</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cycles.map((cycle, index) => {
                  const isActive = cycle.isActive === true;
                  const hasRequest = !!cycle.lastRequest?.id;
                  const canClick = isActive && !!cycle.id;
                  const hasStarted = cycle.hasStarted === true;
                  const hasEnded = cycle.hasEnded === true;
                  
                  // Subtle alternating backgrounds for visual separation
                  const bgClass = index % 2 === 0 
                    ? 'bg-white dark:bg-gray-900' 
                    : 'bg-gray-50/50 dark:bg-gray-900/50';
                  
                  // Subtle accent colors based on state (using background tints)
                  const accentClass = !isActive
                    ? 'ring-1 ring-gray-200 dark:ring-gray-800'
                    : hasRequest
                    ? 'ring-1 ring-blue-100 dark:ring-blue-900/30'
                    : 'ring-1 ring-emerald-50 dark:ring-emerald-900/20';
                  
                  return (
                    <Card
                      key={cycle.id}
                      variant="default"
                      radius="lg"
                      padding="lg"
                      className={`
                        transition-all duration-200
                        ${bgClass}
                        ${accentClass}
                        ${!isActive ? 'opacity-70' : ''}
                        ${canClick ? 'hover:ring-2 hover:ring-emerald-200 dark:hover:ring-emerald-800' : ''}
                      `}
                    >
                      {/* Header Section */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <h4 className={`text-base font-semibold ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                              {cycle.name || 'بدون نام'}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isActive && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                  <PiCheckCircle className="h-3.5 w-3.5" />
                                  فعال
                                </span>
                              )}
                              {!isActive && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  غیرفعال
                                </span>
                              )}
                              {hasRequest && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                  <PiFileText className="h-3.5 w-3.5" />
                                  دارای درخواست
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dates Section */}
                          {cycle.startDate && cycle.endDate && (
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mb-3">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <PiClock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="font-medium">شروع:</span>
                                  <span className="text-gray-900 dark:text-gray-100">{new Date(cycle.startDate).toLocaleDateString('fa-IR')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <PiClock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="font-medium">پایان:</span>
                                  <span className="text-gray-900 dark:text-gray-100">{new Date(cycle.endDate).toLocaleDateString('fa-IR')}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Financial Terms Section */}
                          {((cycle.financialTerms?.priceOptions && cycle.financialTerms.priceOptions.length > 0) || cycle.financialTerms?.interestRatePercentage !== undefined) && (
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mb-3">
                              <div className="space-y-3">
                                {/* Price Options */}
                                {cycle.financialTerms?.priceOptions && cycle.financialTerms.priceOptions.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                      مبلغ‌های قابل درخواست:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {cycle.financialTerms.priceOptions.map((option, idx) => (
                                        <div
                                          key={option?.id || idx}
                                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                                            isActive 
                                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                          }`}
                                        >
                                          {formatCurrencyFa(option?.amountRials)} ریال
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Interest Rate */}
                                {cycle.financialTerms?.interestRatePercentage !== undefined && (
                                  <div className="flex items-center gap-2.5 text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">نرخ سود:</span>
                                    <span className={`font-semibold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-500'}`}>
                                      {cycle.financialTerms.interestRatePercentage}%
                                    </span>
                                    {cycle.financialTerms.paymentMonths && (
                                      <>
                                        <span className="text-gray-400 dark:text-gray-600">•</span>
                                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                                          بازپرداخت: <span className="font-medium">{formatCurrencyFa(cycle.financialTerms.paymentMonths)}</span> ماه
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Quota Section */}
                          {cycle.quota !== undefined && (
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ظرفیت:</span>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {formatCurrencyFa(cycle.usedQuota || 0)}
                                  </span>
                                  <span className="text-gray-400 dark:text-gray-600">/</span>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatCurrencyFa(cycle.quota)}
                                  </span>
                                  {cycle.availableQuota !== undefined && cycle.availableQuota > 0 && (
                                    <span className={`mr-2 text-xs font-medium px-2 py-0.5 rounded ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                      {formatCurrencyFa(cycle.availableQuota)} باقیمانده
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Request Status Section */}
                          {hasRequest && cycle.lastRequest && (
                            <div className="border-t border-blue-200 dark:border-blue-800 pt-3 mb-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-md p-3 -mx-3 border-l-2 border-l-blue-400 dark:border-l-blue-600">
                              <div className="flex items-center gap-2 mb-2">
                                <PiFileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">وضعیت درخواست شما</span>
                              </div>
                              <div className="space-y-1.5 bg-white/80 dark:bg-gray-800/50 rounded-md p-2.5 border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-blue-700 dark:text-blue-300">وضعیت:</span>
                                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                                    {cycle.lastRequest.statusText || cycle.lastRequest.status || 'نامشخص'}
                                  </span>
                                </div>
                                {cycle.lastRequest.requestedAmountRials && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-700 dark:text-blue-300">مبلغ:</span>
                                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                                      {formatCurrencyFa(cycle.lastRequest.requestedAmountRials)} ریال
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* CTA Button */}
                          {canClick && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
                              <Button
                                variant="solid"
                                size="md"
                                block
                                onClick={() => handleCycleClick(cycle)}
                                className="font-medium"
                                rightIcon={<PiArrowRight className="h-4 w-4" />}
                              >
                                {hasRequest ? 'مشاهده درخواست' : 'ثبت درخواست جدید'}
                              </Button>
                            </div>
                          )}

                          {!canClick && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
                              <div className="text-center py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  {!hasStarted
                                    ? 'این دوره هنوز شروع نشده است'
                                    : hasEnded
                                    ? 'این دوره به پایان رسیده است'
                                    : 'این دوره در حال حاضر غیرفعال است'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </ScrollableArea>
    </div>
  );
}

