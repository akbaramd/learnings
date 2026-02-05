'use client';

import React, { useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { InputField } from '@/src/components/forms/InputField';
import { ShamsiDateRangePicker } from '@/src/components/forms/ShamsiDateRangePicker';
import { useToast } from '@/src/hooks/useToast';
import { toJalaali } from 'jalaali-js';
import {
  PiBuildingsDuotone,
  PiDoor,
  PiCalendar,
  PiUsers,
  PiNote,
  PiSpinner,
  PiCheckCircle,
  PiArrowRight,
  PiXCircle,
} from 'react-icons/pi';
import {
  useGetAccommodationDetailQuery,
  useCreateReservationMutation,
  useGetRoomReservationsInDateRangeQuery,
  useGetUserReservationsQuery,
} from '@/src/store/accommodations';
import type { CreateReservationRequest } from '@/src/store/accommodations/accommodations.types';

type Props = {
  params: Promise<{ accommodationId: string }>;
};

export default function ReservePage({ params }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { accommodationId } = use(params);

  const { data: detailRes, isLoading: isLoadingAcc } = useGetAccommodationDetailQuery(accommodationId, {
    skip: !accommodationId,
  });

  const [createReservation, { isLoading: isSubmitting }] = useCreateReservationMutation();

  const acc = detailRes?.data;
  const activeRooms = useMemo(() => {
    if (!acc?.rooms) return [];
    return acc.rooms.filter((r: any) => r?.isActive && r?.canAccommodateGuests !== false);
  }, [acc?.rooms]);

  const [formData, setFormData] = useState<CreateReservationRequest>({
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateReservationRequest, string>>>({});

  // Check room availability for selected dates (all reservations)
  const { data: roomReservationsData } = useGetRoomReservationsInDateRangeQuery(
    {
      roomId: formData.roomId,
      startDate: formData.checkInDate ? new Date(formData.checkInDate).toISOString() : new Date().toISOString(),
      endDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      onlyActive: true,
    },
    {
      skip: !formData.roomId || !formData.checkInDate || !formData.checkOutDate,
    }
  );

  // Get user's reservations for this room to check for overlaps
  const { data: userReservationsData } = useGetUserReservationsQuery(
    {
      roomId: formData.roomId,
      onlyActive: true,
    },
    {
      skip: !formData.roomId,
    }
  );

  // Get status text in Persian
  const getStatusText = (status: string | null | undefined): string => {
    if (!status) return 'نامشخص';
    const statusMap: Record<string, string> = {
      'Pending': 'در حال ویرایش',
      '0': 'در حال ویرایش',
      'Submitted': 'ارسال شده',
      '1': 'ارسال شده',
      'Confirmed': 'تأیید شده',
      '2': 'تأیید شده',
      'Paying': 'در حال پرداخت',
      '3': 'در حال پرداخت',
      'Paid': 'پرداخت شده',
      '4': 'پرداخت شده',
      'Canceled': 'لغو شده',
      '5': 'لغو شده',
      'Rejected': 'رد شده',
      '6': 'رد شده',
      'Expired': 'منقضی شده',
      '7': 'منقضی شده',
    };
    return statusMap[status] || status;
  };

  // Find overlapping user reservation
  const overlappingUserReservation = useMemo(() => {
    if (!formData.roomId || !formData.checkInDate || !formData.checkOutDate) return null;
    if (!userReservationsData?.data?.reservations) return null;
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    
    // Find user's reservation that overlaps with selected dates
    const overlap = userReservationsData.data.reservations.find((reservation: any) => {
      if (!reservation.checkInDate || !reservation.checkOutDate) return false;
      
      const resCheckIn = new Date(reservation.checkInDate);
      const resCheckOut = new Date(reservation.checkOutDate);
      
      // Check for overlap: new check-in is before existing check-out AND new check-out is after existing check-in
      return checkIn < resCheckOut && checkOut > resCheckIn;
    });
    
    return overlap || null;
  }, [formData.roomId, formData.checkInDate, formData.checkOutDate, userReservationsData]);

  // Check if room is available for selected dates (all reservations)
  const isRoomAvailable = useMemo(() => {
    if (!formData.roomId || !formData.checkInDate || !formData.checkOutDate) return true;
    const data = roomReservationsData?.data;
    if (!data) return true;
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    
    // Check using bookedDates array (if available)
    if (data.bookedDates && data.bookedDates.length > 0) {
      const selectedDates: string[] = [];
      const currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        selectedDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Check if any selected date is in booked dates
      const hasOverlap = selectedDates.some(date => data.bookedDates?.includes(date));
      return !hasOverlap;
    }
    
    // Fallback: Check using reservations array
    if (data.reservations && data.reservations.length > 0) {
      const hasOverlap = data.reservations.some((reservation: any) => {
        if (!reservation.checkInDate || !reservation.checkOutDate) return false;
        
        const resCheckIn = new Date(reservation.checkInDate);
        const resCheckOut = new Date(reservation.checkOutDate);
        
        // Check for overlap: new check-in is before existing check-out AND new check-out is after existing check-in
        return checkIn < resCheckOut && checkOut > resCheckIn;
      });
      
      return !hasOverlap;
    }
    
    // Fallback: Check using bookedDateRanges
    if (data.bookedDateRanges && data.bookedDateRanges.length > 0) {
      const hasOverlap = data.bookedDateRanges.some((range: any) => {
        if (!range.startDate || !range.endDate) return false;
        
        const rangeStart = new Date(range.startDate);
        const rangeEnd = new Date(range.endDate);
        
        return checkIn < rangeEnd && checkOut > rangeStart;
      });
      
      return !hasOverlap;
    }
    
    return true;
  }, [formData.roomId, formData.checkInDate, formData.checkOutDate, roomReservationsData]);

  const handleChange = (field: keyof CreateReservationRequest, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // If check-in date changed, validate check-out date
      if (field === 'checkInDate' && typeof value === 'string' && value) {
        const checkIn = new Date(value);
        if (prev.checkOutDate) {
          const checkOut = new Date(prev.checkOutDate);
          // If check-out is before or equal to new check-in, clear it
          if (checkOut <= checkIn) {
            updated.checkOutDate = '';
          }
        }
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateReservationRequest, string>> = {};

    if (!formData.roomId) {
      newErrors.roomId = 'لطفاً اتاق را انتخاب کنید';
    }

    if (!formData.checkInDate) {
      newErrors.checkInDate = 'لطفاً تاریخ ورود را وارد کنید';
    } else {
      const checkIn = new Date(formData.checkInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkIn < today) {
        newErrors.checkInDate = 'تاریخ ورود نمی‌تواند در گذشته باشد';
      }
    }

    if (!formData.checkOutDate) {
      newErrors.checkOutDate = 'لطفاً تاریخ خروج را وارد کنید';
    } else if (formData.checkInDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      if (checkOut <= checkIn) {
        newErrors.checkOutDate = 'تاریخ خروج باید بعد از تاریخ ورود باشد';
      }
    }

    // Check room availability
    if (formData.roomId && formData.checkInDate && formData.checkOutDate && !isRoomAvailable) {
      if (overlappingUserReservation) {
        newErrors.checkInDate = 'شما قبلاً این اتاق را در این بازه رزرو کرده‌اید';
        newErrors.checkOutDate = 'لطفاً تاریخ‌هایی انتخاب کنید که با رزرو قبلی همپوشانی نداشته باشد';
      } else {
        newErrors.checkInDate = 'این اتاق در بازه تاریخ انتخابی رزرو شده است';
        newErrors.checkOutDate = 'لطفاً تاریخ دیگری انتخاب کنید یا اتاق دیگری را امتحان کنید';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0] || 'لطفاً تمام فیلدهای الزامی را به درستی پر کنید';
      toast({
        title: 'لطفاً فرم را تکمیل کنید',
        description: firstError,
        variant: 'error',
      });
      return;
    }

    try {
      const result = await createReservation(formData).unwrap();

      // Log the result for debugging
      console.log('[Reserve Page] Create reservation result:', {
        isSuccess: result?.isSuccess,
        hasData: !!result?.data,
        reservationId: result?.data?.id,
        trackingCode: result?.data?.trackingCode,
        fullData: result?.data,
      });

      if (result?.data?.id) {
        const reservationId = result.data.id;
        
        toast({
          title: 'رزرو ایجاد شد',
          description: `رزرو شما با کد ${result.data.trackingCode || reservationId} ایجاد شد. در حال هدایت به صفحه رزرو...`,
          variant: 'success',
        });

        // Navigate to reservation detail page with the returned ID
        // Use replace to avoid adding to history stack
        router.replace(`/hotels/reservations/${reservationId}`);
      } else {
        console.error('[Reserve Page] No reservation ID in response:', result);
        throw new Error(result?.message || 'خطا در ایجاد رزرو - شناسه رزرو دریافت نشد');
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در ایجاد رزرو. لطفاً دوباره تلاش کنید.';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleBack = () => {
    router.push(`/hotels/${accommodationId}`);
  };

  const selectedRoom = activeRooms.find((r: any) => r?.id === formData.roomId);
  const minCheckOutDate = formData.checkInDate
    ? new Date(new Date(formData.checkInDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : '';

  // Convert Gregorian date to Shamsi for display
  const formatShamsiDate = (gregorianDate: string): string => {
    if (!gregorianDate) return '—';
    try {
      const date = new Date(gregorianDate + 'T12:00:00');
      if (isNaN(date.getTime())) return '—';
      const jalaali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
      return `${jalaali.jy}/${String(jalaali.jm).padStart(2, '0')}/${String(jalaali.jd).padStart(2, '0')}`;
    } catch {
      return '—';
    }
  };

  if (isLoadingAcc) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader title="رزرو اقامتگاه" showBackButton onBack={handleBack} />
        <ScrollableArea className="flex-1" hideScrollbar>
          <div className="flex justify-center items-center py-12">
            <PiSpinner className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="mr-2 text-xs text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  if (!acc) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader title="اقامتگاه یافت نشد" showBackButton onBack={handleBack} />
        <ScrollableArea className="flex-1" hideScrollbar>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">اقامتگاه یافت نشد</p>
              <Button onClick={handleBack} size="sm">
                بازگشت
              </Button>
            </div>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  if (activeRooms.length === 0) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader title="رزرو اقامتگاه" showBackButton onBack={handleBack} />
        <ScrollableArea className="flex-1" hideScrollbar>
          <div className="p-4">
            <Card variant="default" radius="lg" padding="md">
              <div className="text-center py-8">
                <PiXCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  اتاق فعالی برای رزرو وجود ندارد
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  در حال حاضر هیچ اتاق فعالی برای این اقامتگاه موجود نیست.
                </p>
                <Button onClick={handleBack} size="sm" variant="outline">
                  بازگشت
                </Button>
              </div>
            </Card>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="رزرو اقامتگاه"
        titleIcon={<PiBuildingsDuotone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
          {/* Accommodation Info */}
          <Card variant="default" radius="lg" padding="md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 grid place-items-center flex-shrink-0">
                <PiBuildingsDuotone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {acc.name || 'اقامتگاه'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {acc.typeText || 'اقامتگاه'}
                </p>
              </div>
            </div>
          </Card>

          {/* Room Selection */}
          <Card variant="default" radius="lg" padding="md">
            <label className="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">
              <PiDoor className="inline h-4 w-4 ml-1" />
              انتخاب اتاق <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.roomId}
              onChange={(e) => handleChange('roomId', e.target.value)}
              className={[
                'w-full px-3 py-2.5 rounded-lg border text-sm',
                'bg-white dark:bg-gray-800',
                'border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
                'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                errors.roomId ? 'border-red-500 dark:border-red-400' : '',
              ].join(' ')}
              disabled={isSubmitting}
            >
              <option value="">-- انتخاب اتاق --</option>
              {activeRooms.map((room: any) => (
                <option key={room?.id} value={room?.id}>
                  {room?.number || 'اتاق'} - {room?.roomTypeText || room?.roomType || 'اتاق'} (ظرفیت:{' '}
                  {room?.capacity || '—'} نفر)
                </option>
              ))}
            </select>
            {errors.roomId && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.roomId}</p>
            )}
          </Card>

          {/* Date Range */}
          <Card variant="default" radius="lg" padding="md">
            <ShamsiDateRangePicker
              label="تاریخ ورود و خروج"
              checkInDate={formData.checkInDate}
              checkOutDate={formData.checkOutDate}
              onChange={(checkIn, checkOut) => {
                handleChange('checkInDate', checkIn);
                handleChange('checkOutDate', checkOut);
              }}
              minDate={new Date().toISOString().split('T')[0]}
              required
              disabled={isSubmitting}
              error={errors.checkInDate || errors.checkOutDate}
            />
            {formData.roomId && formData.checkInDate && formData.checkOutDate && !isRoomAvailable && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                {overlappingUserReservation ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                      ⚠️ شما این اتاق را قبلاً در این بازه رزرو کرده‌اید:
                    </p>
                    <div className="text-xs text-red-600 dark:text-red-400 space-y-1 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                      <p>
                        <span className="font-semibold">کد رزرو:</span> {overlappingUserReservation.trackingCode || '—'}
                      </p>
                      <p>
                        <span className="font-semibold">وضعیت:</span> {getStatusText(overlappingUserReservation.status)}
                      </p>
                      <p>
                        <span className="font-semibold">تاریخ ورود:</span> {formatShamsiDate(overlappingUserReservation.checkInDate || '')}
                      </p>
                      <p>
                        <span className="font-semibold">تاریخ خروج:</span> {formatShamsiDate(overlappingUserReservation.checkOutDate || '')}
                      </p>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium mt-2">
                      لطفاً تاریخ دیگری انتخاب کنید که با رزرو قبلی همپوشانی نداشته باشد.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                    ⚠️ این اتاق در بازه تاریخ انتخابی رزرو شده است. لطفاً تاریخ دیگری انتخاب کنید.
                  </p>
                )}
              </div>
            )}
            {formData.roomId && formData.checkInDate && formData.checkOutDate && isRoomAvailable && (
              <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                  ✓ این اتاق در بازه تاریخ انتخابی در دسترس است و آماده رزرو می‌باشد.
                </p>
              </div>
            )}
          </Card>


          {/* Notes */}
          <Card variant="default" radius="lg" padding="md">
            <label className="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">
              <PiNote className="inline h-4 w-4 ml-1" />
              توضیحات (اختیاری)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className={[
                'w-full px-3 py-2.5 rounded-lg border text-sm resize-none',
                'bg-white dark:bg-gray-800',
                'border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
                'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
              ].join(' ')}
              placeholder="توضیحات اضافی (اختیاری)..."
            />
          </Card>

          {/* Summary */}
          {formData.checkInDate && formData.checkOutDate && (
            <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-cyan-900/10 border-2 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">خلاصه رزرو</h3>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white">
                  <span className="text-lg font-bold">
                    {Math.ceil(
                      (new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </span>
                  <span className="text-xs">شب</span>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-emerald-200 dark:border-emerald-700">
                  <span className="text-gray-600 dark:text-gray-400">اتاق:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedRoom?.number || '—'} ({selectedRoom?.roomTypeText || '—'})
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-emerald-200 dark:border-emerald-700">
                  <span className="text-gray-600 dark:text-gray-400">تاریخ ورود:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatShamsiDate(formData.checkInDate)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">تاریخ خروج:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatShamsiDate(formData.checkOutDate)}</span>
                </div>
              </div>
            </Card>
          )}
        </form>
      </ScrollableArea>

      {/* Sticky Submit Button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 border-t border-gray-200 dark:border-gray-700 z-10">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            انصراف
          </Button>
          <Button
            type="submit"
            className="flex-1"
            onClick={handleSubmit}
            loading={isSubmitting}
            loadingText="در حال ایجاد رزرو..."
            disabled={isSubmitting || !formData.roomId || !formData.checkInDate || !formData.checkOutDate || !isRoomAvailable}
            leftIcon={!isSubmitting ? <PiCheckCircle className="h-4 w-4" /> : undefined}
          >
            ایجاد رزرو
          </Button>
        </div>
      </div>
    </div>
  );
}
