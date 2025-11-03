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
  PiBuilding,
  PiArrowRight,
  PiCalendar,
  PiCheckCircle,
  PiClock,
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
      // Fetch all cycles (both active and inactive)
      getFacilityCycles({
        facilityId: facilityIdFromParams,
        page: 1,
        pageSize: 100, // Get all cycles
        onlyActive: false, // Get all cycles to show inactive ones too
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

  const handleCycleClick = (cycleId: string) => {
    if (cycleId) {
      // Navigate to request creation page
      router.push(`/facilities/cycles/${cycleId}/request`);
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

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title={facility.name || 'جزئیات تسهیلات'}
        titleIcon={<PiBuilding className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
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
        <div className="p-2 space-y-2">
          {/* Basic Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              اطلاعات کلی
            </h3>
            <div className="space-y-3">
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
              <div className="flex items-center gap-2">
             
                {facility.isAcceptingApplications && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    پذیرش درخواست
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Bank Info */}
          {facility.bankInfo && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                اطلاعات بانکی
              </h3>
              <div className="space-y-3">
                {facility.bankInfo.bankName && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">نام بانک</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {facility.bankInfo.bankName}
                    </div>
                  </div>
                )}
                {facility.bankInfo.bankAccountNumber && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">شماره حساب</div>
                    <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                      {facility.bankInfo.bankAccountNumber}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Cycles */}
          <Card variant="default" radius="lg" padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <PiCalendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                دوره‌های تسهیلات
              </h3>
              {cycles.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleViewCycles}
                >
                  مشاهده همه
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
              <div className="space-y-2">
                {cycles.map((cycle) => {
                  const isActive = cycle.isActive === true;
                  const canClick = isActive && !!cycle.id;
                  
                  return (
                    <Card
                      key={cycle.id}
                      variant="default"
                      radius="md"
                      padding="md"
                      clickable={canClick}
                      onClick={canClick ? () => handleCycleClick(cycle.id!) : undefined}
                      className={`
                        transition-all
                        ${canClick 
                          ? 'hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer' 
                          : 'opacity-50 grayscale cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className={`text-base font-semibold ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'}`}>
                              {cycle.name || 'بدون نام'}
                            </h4>
                            {isActive && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                <PiCheckCircle className="h-3 w-3" />
                                فعال
                              </span>
                            )}
                            {!isActive && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                غیرفعال
                              </span>
                            )}
                          </div>
                        
                          {/* Cycle Dates */}
                          {cycle.startDate && cycle.endDate && (
                            <div className={`flex items-center gap-4 text-xs mb-2 ${isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                              <div className="flex items-center gap-1">
                                <PiClock className="h-3 w-3" />
                                <span>شروع: {new Date(cycle.startDate).toLocaleDateString('fa-IR')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <PiClock className="h-3 w-3" />
                                <span>پایان: {new Date(cycle.endDate).toLocaleDateString('fa-IR')}</span>
                              </div>
                            </div>
                          )}

                          {/* Financial Terms */}
                          {cycle.financialTerms?.priceOptions && cycle.financialTerms.priceOptions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cycle.financialTerms.priceOptions.map((option, idx) => (
                                <div
                                  key={option?.id || idx}
                                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    isActive 
                                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-600'
                                  }`}
                                >
                                  {formatCurrencyFa(option?.amountRials)} ریال
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Interest Rate */}
                          {cycle.financialTerms?.interestRatePercentage !== undefined && (
                            <div className={`mt-2 text-xs ${isActive ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                              <span className="font-medium">نرخ سود:</span> {cycle.financialTerms.interestRatePercentage}%
                              {cycle.financialTerms.paymentMonths && (
                                <span className="mr-2">• بازپرداخت: {formatCurrencyFa(cycle.financialTerms.paymentMonths)} ماه</span>
                              )}
                            </div>
                          )}

                          {/* Quota Info */}
                          {cycle.quota !== undefined && (
                            <div className={`mt-2 text-xs ${isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                              <span className="font-medium">ظرفیت:</span> {formatCurrencyFa(cycle.usedQuota || 0)} / {formatCurrencyFa(cycle.quota)}
                              {cycle.availableQuota !== undefined && cycle.availableQuota > 0 && (
                                <span className={`mr-2 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-600'}`}>
                                  ({formatCurrencyFa(cycle.availableQuota)} باقیمانده)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Status */}
                          {cycle.statusText && (
                            <div className={`mt-2 text-xs ${isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                              <span className="font-medium">وضعیت:</span> {cycle.statusText}
                            </div>
                          )}
                        </div>
                        
                        {canClick && (
                          <PiArrowRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
                        )}
                        {!canClick && (
                          <div className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0 mt-1 px-2">
                            غیرقابل استفاده
                          </div>
                        )}
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

