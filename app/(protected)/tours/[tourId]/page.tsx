'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/hooks/useToast';
import { useGetTourDetailQuery, useStartReservationMutation } from '@/src/store/tours/tours.queries';
import { CapacityDetailDto } from '@/src/services/Api';
import {
  PiMapPinDuotone,
  PiCalendar,
  PiUsers,
  PiClock,
  PiMoney,
  PiSpinner,
  PiCheckCircle,
  PiArrowRight,
  PiStar,
  PiShieldCheck,
} from 'react-icons/pi';

function formatCurrencyFa(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) return '۰';
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch {
    return String(amount ?? 0);
  }
}

function formatDateFa(date: string | null | undefined) {
  if (!date) return 'نامشخص';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'نامشخص';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return 'نامشخص';
  }
}

interface TourDetailsPageProps {
  params: Promise<{ tourId: string }>;
}

export default function TourDetailsPage({ params }: TourDetailsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { tourId } = use(params);
  const { data: tourDetailData, isLoading: isLoadingTour, error: tourError } = useGetTourDetailQuery(tourId, {
    skip: !tourId,
  });
  const [startReservation, { isLoading: isStarting }] = useStartReservationMutation();
  const [selectedCapacityId, setSelectedCapacityId] = useState<string>('');

  const tour = tourDetailData?.data;
  const capacities: CapacityDetailDto[] = tour?.capacities || [];

  const handleBack = () => {
    router.push('/tours');
  };

  const handleStartReservation = async () => {
    if (!tour) {
      toast({
        title: 'خطا',
        description: 'اطلاعات تور یافت نشد',
        variant: 'error',
      });
      return;
    }

    if (!tour.id) {
      toast({
        title: 'خطا',
        description: 'شناسه تور معتبر نیست',
        variant: 'error',
      });
      return;
    }

    try {
      if (!selectedCapacityId || selectedCapacityId.trim() === '') {
        toast({
          title: 'خطا',
          description: 'لطفاً ظرفیت مورد نظر را انتخاب کنید',
          variant: 'error',
        });
        return;
      }

      const result = await startReservation({
        tourId: tour.id,
        capacityId: selectedCapacityId.trim(),
      }).unwrap();
      
      if (result?.data?.reservationId) {
        toast({
          title: 'موفق',
          description: 'رزرو با موفقیت ایجاد شد',
          variant: 'success',
        });
        router.push(`/tours/reservations/${result.data.reservationId}`);
      } else {
        toast({
          title: 'خطا',
          description: result?.message || 'خطا در ایجاد رزرو',
          variant: 'error',
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'خطا در شروع رزرو';
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data as { message?: string; errors?: string[] };
        errorMessage = errorData?.message || errorData?.errors?.[0] || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  if (isLoadingTour) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="جزئیات تور"
          showBackButton
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1" hideScrollbar={true}>
          <div className="flex justify-center items-center py-12">
            <PiSpinner className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="mr-2 text-xs text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  if (tourError || !tour) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="تور یافت نشد"
          showBackButton
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1" hideScrollbar={true}>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">
                {tourError ? 'خطا در بارگذاری جزئیات تور' : 'تور مورد نظر یافت نشد'}
              </p>
              <Button onClick={handleBack} size="sm">
                بازگشت به لیست تورها
              </Button>
            </div>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title={tour.title || 'جزئیات تور'}
        titleIcon={<PiMapPinDuotone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-3 pb-20">
          {/* Tour Information - All in one card at top */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">
              اطلاعات تور
            </h3>

            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span
                className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                  tour.isRegistrationOpen
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {tour.isRegistrationOpen ? 'ثبت‌نام باز' : 'ثبت‌نام بسته'}
              </span>
              {tour.isFullyBooked && (
                <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  تکمیل شده
                </span>
              )}
              {tour.isNearlyFull && !tour.isFullyBooked && tour.isRegistrationOpen && (
                <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  ⚠️ کم‌ظرفیت
                </span>
              )}
            </div>

            {/* Tour Description */}
            {tour.description && (
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">توضیحات</div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {tour.description}
                </p>
              </div>
            )}

            {/* Tour Details */}
            <div className="space-y-2">
              {tour.tourStart && tour.tourEnd && (
                <div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">زمان تور</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-gray-100">
                    <PiCalendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{formatDateFa(tour.tourStart)} تا {formatDateFa(tour.tourEnd)}</span>
                  </div>
                </div>
              )}

              {tour.registrationStart && tour.registrationEnd && (
                <div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">زمان ثبت‌نام</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-gray-100">
                    <PiClock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{formatDateFa(tour.registrationStart)} تا {formatDateFa(tour.registrationEnd)}</span>
                  </div>
                </div>
              )}

              {tour.maxCapacity && (
                <div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">ظرفیت</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-gray-100">
                    <PiUsers className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {formatCurrencyFa(tour.maxCapacity)} نفر
                      {tour.remainingCapacity != null && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1">
                          ({formatCurrencyFa(tour.remainingCapacity)} باقی‌مانده)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {(tour.pricing?.[0]?.effectivePriceRials || tour.lowestPriceRials) && (
                <div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">قیمت</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-gray-100">
                    <PiMoney className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {tour.pricing?.[0]?.effectivePriceRials 
                        ? `${formatCurrencyFa(tour.pricing[0].effectivePriceRials)} ریال`
                        : tour.lowestPriceRials
                        ? `${formatCurrencyFa(tour.lowestPriceRials)} ریال`
                        : 'تماس بگیرید'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Required Capabilities and Features */}
          {((Array.isArray(tour.requiredCapabilities) && tour.requiredCapabilities.length > 0) ||
            (Array.isArray(tour.requiredFeatures) && tour.requiredFeatures.length > 0)) && (
            <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-0.5">
                  <PiShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    برای رزرو این تور باید قابلیت‌ها و ویژگی‌های زیر را داشته باشید
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {/* Required Capabilities */}
                {Array.isArray(tour.requiredCapabilities) && tour.requiredCapabilities.length > 0 && (
                  <div>
                    <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                      <PiStar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      قابلیت‌های مورد نیاز
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tour.requiredCapabilities.map((cap) => {
                        const capabilityName = cap?.name || 'قابلیت';
                        const capabilityId = cap?.capabilityId || '';
                        
                        return (
                          <span
                            key={capabilityId || capabilityName}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          >
                            {capabilityName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Required Features */}
                {Array.isArray(tour.requiredFeatures) && tour.requiredFeatures.length > 0 && (
                  <div>
                    <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                      <PiStar className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                      ویژگی‌های مورد نیاز
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tour.requiredFeatures.map((feat) => {
                        const featureName = feat?.name || 'ویژگی';
                        const featureId = feat?.featureId || '';
                        
                        return (
                          <span
                            key={featureId || featureName}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          >
                            {featureName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Capacities Selection - At bottom */}
          {tour.isRegistrationOpen && !tour.isFullyBooked && capacities.length > 0 && (
            <Card variant="default" radius="lg" padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <PiUsers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  انتخاب ظرفیت
                </h3>
              </div>
              
              {/* Message to inform users they must select a capacity */}
              <p className="text-caption text-gray-600 dark:text-gray-400 mb-4">
                لطفاً یکی از ظرفیت‌های زیر را انتخاب کنید
              </p>
              
              <div className="space-y-2">
                {capacities.map((capacity: CapacityDetailDto, index) => {
                  if (!capacity.id) return null;
                  const isSelected = selectedCapacityId === capacity.id;
                  const isCapacityAvailable = capacity.isRegistrationOpen && capacity.isActive && !capacity.isFullyBooked;
                  
                  const bgClass = index % 2 === 0 
                    ? 'bg-white dark:bg-gray-900' 
                    : 'bg-gray-50/50 dark:bg-gray-900/50';
                  
                  const accentClass = !isCapacityAvailable
                    ? 'ring-1 ring-gray-200 dark:ring-gray-800'
                    : isSelected
                    ? 'ring-2 ring-emerald-400 dark:ring-emerald-600'
                    : 'ring-1 ring-emerald-50 dark:ring-emerald-900/20';
                  
                  return (
                    <Card
                      key={capacity.id}
                      variant="default"
                      radius="lg"
                      padding="md"
                      clickable={isCapacityAvailable}
                      className={`
                        transition-all duration-200
                        ${bgClass}
                        ${accentClass}
                        ${!isCapacityAvailable ? 'opacity-70' : ''}
                        ${isCapacityAvailable ? 'hover:ring-2 hover:ring-emerald-300 dark:hover:ring-emerald-700 cursor-pointer' : 'cursor-not-allowed'}
                      `}
                      onClick={() => {
                        if (isCapacityAvailable) {
                          setSelectedCapacityId(capacity.id!);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className={`text-xs font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-100'}`}>
                              {capacity.description || 'ظرفیت'}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {capacity.isRegistrationOpen && capacity.isActive && !capacity.isFullyBooked ? (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                  <PiCheckCircle className="h-3 w-3" />
                                  قابل رزرو
                                </span>
                              ) : capacity.isFullyBooked ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  تکمیل شده
                                </span>
                              ) : !capacity.isRegistrationOpen ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                                  ثبت‌نام بسته
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  غیرفعال
                                </span>
                              )}
                              {capacity.isNearlyFull && !capacity.isFullyBooked && capacity.isRegistrationOpen && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                  ⚠️ کم‌ظرفیت
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                            {capacity.maxParticipants != null && (
                              <div className="flex items-center gap-1.5">
                                <PiUsers className="h-3 w-3" />
                                <span>حداکثر: <strong>{formatCurrencyFa(capacity.maxParticipants)}</strong> نفر</span>
                              </div>
                            )}
                            {capacity.remainingParticipants != null && capacity.remainingParticipants > 0 && (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <PiCheckCircle className="h-3 w-3" />
                                <span>باقیمانده: <strong>{formatCurrencyFa(capacity.remainingParticipants)}</strong> نفر</span>
                              </div>
                            )}
                            {capacity.registrationStart && capacity.registrationEnd && (
                              <div className="flex items-center gap-1.5">
                                <PiCalendar className="h-3 w-3" />
                                <span>
                                  {formatDateFa(capacity.registrationStart)} تا {formatDateFa(capacity.registrationEnd)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                              <PiCheckCircle className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        {!isSelected && isCapacityAvailable && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {/* No Capacity Available */}
          {tour.isRegistrationOpen && !tour.isFullyBooked && capacities.length === 0 && (
            <Card variant="default" radius="lg" padding="md" className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                در حال حاضر ظرفیتی برای این تور تعریف نشده است. لطفاً با پشتیبانی تماس بگیرید.
              </p>
            </Card>
          )}

          {/* Fully Booked */}
          {tour.isFullyBooked && (
            <Card variant="default" radius="lg" padding="md" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-sm">🚫</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">
                    ظرفیت تکمیل شده
                  </p>
                  <p className="text-[11px] text-red-700 dark:text-red-300">
                    متأسفانه ظرفیت این تور به طور کامل تکمیل شده و امکان ثبت‌نام جدید وجود ندارد.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Registration Closed */}
          {!tour.isRegistrationOpen && (
            <Card variant="default" radius="lg" padding="md" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-sm">ℹ️</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    ثبت‌نام بسته است
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    {tour.status === 'RegistrationClosed' 
                      ? 'ثبت‌نام این تور بسته است. لطفاً در زمان‌های ثبت‌نام بعدی مراجعه کنید.'
                      : tour.status === 'Completed'
                      ? 'این تور به اتمام رسیده است.'
                      : 'این تور در حال حاضر قابل رزرو نیست.'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </ScrollableArea>

      {/* Sticky Action Button at Bottom */}
      {tour.isRegistrationOpen && !tour.isFullyBooked && capacities.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 border-t border-gray-200 dark:border-gray-700 z-10">
          <Button
            onClick={handleStartReservation}
            disabled={isStarting || !selectedCapacityId || selectedCapacityId.trim() === ''}
            variant="solid"
            size="md"
            block
            className="font-medium"
            loading={isStarting}
            loadingText="در حال شروع رزرو..."
            leftIcon={!isStarting ? <PiCheckCircle className="h-4 w-4" /> : undefined}
            rightIcon={!isStarting ? <PiArrowRight className="h-4 w-4" /> : undefined}
          >
            شروع رزرو
          </Button>
       
        </div>
      )}
    </div>
  );
}
