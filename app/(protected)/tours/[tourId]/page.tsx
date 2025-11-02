'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/hooks/useToast';
import { useGetTourDetailQuery, useStartReservationMutation } from '@/src/store/tours/tours.queries';
import { CapacityDetailDto } from '@/src/services/Api';
import { buildImageUrl } from '@/src/config/env';
import Image from 'next/image';
import {
  PiMapPinDuotone,
  PiCalendar,
  PiUsers,
  PiClock,
  PiMoney,
  PiSpinner,
  PiCheckCircle,
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <div className="h-full flex flex-col items-center justify-center" dir="rtl">
        <PageHeader
          title="جزئیات تور"
          showBackButton
          onBack={handleBack}
        />
        <div className="flex-1 flex items-center justify-center">
          <PiSpinner className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="mr-3 text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  if (tourError || !tour) {
    return (
      <div className="h-full flex flex-col items-center justify-center" dir="rtl">
        <PageHeader
          title="تور یافت نشد"
          showBackButton
          onBack={handleBack}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {tourError ? 'خطا در بارگذاری جزئیات تور' : 'تور مورد نظر یافت نشد'}
            </p>
            <Button onClick={handleBack} className="mt-4">
              بازگشت به لیست تورها
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const coverPhoto = tour.photos?.[0]?.url 
    ? buildImageUrl(tour.photos[0].url) 
    : null;

  return (
    <>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9CA3AF #F3F4F6;
          scroll-behavior: smooth;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #047857);
        }
        .dark .custom-scrollbar {
          scrollbar-color: #4B5563 #1F2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 4px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 4px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #047857);
        }
        .capacity-card {
          transition: all 0.2s ease;
          transform: translateY(0);
        }
        .capacity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }
        .capacity-card.selected {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="جزئیات تور"
          titleIcon={<PiMapPinDuotone className="h-5 w-5" />}
          subtitle={tour.title || 'تور'}
          showBackButton
          onBack={handleBack}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Cover Photo */}
            {coverPhoto && (
              <div className="relative h-64 w-full bg-gray-200 dark:bg-gray-700">
                <Image
                  src={coverPhoto}
                  alt={tour.title || 'تور'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <div className="p-4 space-y-6">
              {/* Title and Status */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {tour.title || 'بدون عنوان'}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tour.status === 'RegistrationOpen'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {tour.status === 'RegistrationOpen' ? 'ثبت‌نام باز' : 'ثبت‌نام بسته'}
                  </span>
                  {tour.isFullyBooked && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      تکمیل شده
                    </span>
                  )}
                </div>
              </div>

              {/* Capacity Selection - Moved to Top */}
              {tour.status === 'RegistrationOpen' && !tour.isFullyBooked && capacities.length > 0 && (
                <div className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      انتخاب ظرفیت
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    لطفاً ظرفیت مورد نظر را انتخاب کنید
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                    {capacities.map((capacity: CapacityDetailDto) => {
                      if (!capacity.id) return null;
                      const isSelected = selectedCapacityId === capacity.id;
                      return (
                        <button
                          key={capacity.id}
                          onClick={() => setSelectedCapacityId(capacity.id!)}
                          className={`capacity-card w-full text-right p-5 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 shadow-md selected'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
                          } ${!capacity.isActive ? 'opacity-60' : ''}`}
                          disabled={!capacity.isActive}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                <span className={`text-base font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {capacity.description || 'ظرفیت'}
                                </span>
                                {capacity.isActive ? (
                                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                    ✓ فعال
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    غیرفعال
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 mt-2">
                                {capacity.maxParticipants != null && (
                                  <div className="flex items-center gap-1.5">
                                    <PiUsers className="h-3.5 w-3.5" />
                                    <span>حداکثر: <strong>{formatCurrencyFa(capacity.maxParticipants)}</strong> نفر</span>
                                  </div>
                                )}
                                {capacity.remainingParticipants != null && capacity.remainingParticipants > 0 && (
                                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <PiCheckCircle className="h-3.5 w-3.5" />
                                    <span>باقیمانده: <strong>{formatCurrencyFa(capacity.remainingParticipants)}</strong> نفر</span>
                                  </div>
                                )}
                                {capacity.registrationStart && capacity.registrationEnd && (
                                  <div className="flex items-center gap-1.5">
                                    <PiCalendar className="h-3.5 w-3.5" />
                                    <span className="text-[11px]">
                                      {formatDateFa(capacity.registrationStart).split(' ')[0]} تا {formatDateFa(capacity.registrationEnd).split(' ')[0]}
                                    </span>
                                  </div>
                                )}
                                {capacity.capacityState && (
                                  <div className="text-[11px] opacity-75">
                                    وضعیت: {capacity.capacityState}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                  <PiCheckCircle className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            )}
                            {!isSelected && capacity.isActive && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {capacities.length === 0 && (
                    <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                      ظرفیتی برای این تور تعریف نشده است
                    </div>
                  )}
                </div>
              )}

              {/* Tour Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                  اطلاعات تور
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                      <PiCalendar className="h-4 w-4" />
                      <span className="text-sm font-medium">زمان تور</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDateFa(tour.tourStart)} تا {formatDateFa(tour.tourEnd)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                      <PiClock className="h-4 w-4" />
                      <span className="text-sm font-medium">زمان ثبت‌نام</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDateFa(tour.registrationStart)} تا {formatDateFa(tour.registrationEnd)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                      <PiUsers className="h-4 w-4" />
                      <span className="text-sm font-medium">ظرفیت</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {tour.maxCapacity ? `${formatCurrencyFa(tour.maxCapacity)} نفر` : 'نامشخص'}
                      {tour.remainingCapacity != null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                          ({formatCurrencyFa(tour.remainingCapacity)} باقی‌مانده)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                      <PiMoney className="h-4 w-4" />
                      <span className="text-sm font-medium">قیمت</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {tour.pricing?.[0]?.effectivePriceRials 
                        ? `${formatCurrencyFa(tour.pricing[0].effectivePriceRials)} ریال`
                        : tour.lowestPriceRials
                        ? `${formatCurrencyFa(tour.lowestPriceRials)} ریال`
                        : 'تماس بگیرید'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button - Sticky at Bottom */}
              {tour.status === 'RegistrationOpen' && !tour.isFullyBooked && capacities.length > 0 && (
                <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10">
                  <Button
                    onClick={handleStartReservation}
                    disabled={isStarting || !selectedCapacityId || selectedCapacityId.trim() === ''}
                    className={`w-full transition-all duration-200 ${
                      selectedCapacityId && !isStarting
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                        : ''
                    }`}
                    size="lg"
                  >
                    {isStarting ? (
                      <>
                        <PiSpinner className="h-5 w-5 animate-spin" />
                        <span>در حال شروع رزرو...</span>
                      </>
                    ) : (
                      <>
                        <PiCheckCircle className="h-5 w-5" />
                        <span>شروع رزرو</span>
                      </>
                    )}
                  </Button>
                  {!selectedCapacityId && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                      لطفاً یک ظرفیت انتخاب کنید
                    </p>
                  )}
                </div>
              )}

              {/* No Capacity Available */}
              {tour.status === 'RegistrationOpen' && !tour.isFullyBooked && capacities.length === 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    در حال حاضر ظرفیتی برای این تور تعریف نشده است. لطفاً با پشتیبانی تماس بگیرید.
                  </p>
                </div>
              )}

              {tour.isFullyBooked && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    متأسفانه ظرفیت این تور تکمیل شده است.
                  </p>
                </div>
              )}

              {tour.status !== 'RegistrationOpen' && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {tour.status === 'RegistrationClosed' 
                      ? 'ثبت‌نام این تور بسته است.'
                      : tour.status === 'Completed'
                      ? 'این تور به اتمام رسیده است.'
                      : 'این تور در حال حاضر قابل رزرو نیست.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

