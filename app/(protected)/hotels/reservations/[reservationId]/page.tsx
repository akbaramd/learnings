'use client';

import React, { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { IconButton } from '@/src/components/ui/IconButton';
import { InputField } from '@/src/components/forms/InputField';
import { useToast } from '@/src/hooks/useToast';
import { toJalaali } from 'jalaali-js';
import {
  PiCalendar,
  PiUsers,
  PiNote,
  PiSpinner,
  PiCheckCircle,
  PiXCircle,
  PiPlus,
  PiTrash,
  PiCurrencyDollar,
  PiArrowRight,
  PiHouse,
  PiClock,
  PiWarningCircle,
  PiReceipt,
  PiCopy,
} from 'react-icons/pi';
import {
  useGetReservationDetailQuery,
  useGetReservationPricingQuery,
  useAddGuestToReservationMutation,
  useRemoveGuestFromReservationMutation,
  usePayReservationMutation,
  useSubmitReservationMutation,
  useCancelReservationMutation,
  useRejectReservationMutation,
  useRevertReservationMutation,
  useDeleteReservationMutation,
} from '@/src/store/accommodations';
import type { AddGuestBody } from '@/src/store/accommodations/accommodations.types';

/* ---- Iranian National ID (Melli) utilities ---- */
const Melli = {
  normalize(raw: string): string {
    return (raw || '').replace(/\D/g, '').slice(0, 10);
  },
  format(code: string): string {
    const normalized = this.normalize(code);
    if (normalized.length <= 3) return normalized;
    if (normalized.length <= 6) return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  },
  validate(codeInput: string):
    | { ok: true }
    | { ok: false; reason: 'length' | 'repeating' | 'checksum' } {
    const code = (codeInput || '').replace(/\D/g, '');
    if (code.length !== 10) return { ok: false, reason: 'length' };
    if (/^(\d)\1{9}$/.test(code)) return { ok: false, reason: 'repeating' };

    const check = Number(code[9]);
    const sum =
      code
        .slice(0, 9)
        .split('')
        .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0) % 11;

    const valid = (sum < 2 && check === sum) || (sum >= 2 && check === 11 - sum);
    return valid ? { ok: true } : { ok: false, reason: 'checksum' };
  },
} as const;

const getNationalCodeError = (reason: 'length' | 'repeating' | 'checksum'): string => {
  switch (reason) {
    case 'length':
      return 'کد ملی باید ۱۰ رقم باشد';
    case 'repeating':
      return 'کد ملی نمی‌تواند همه ارقام یکسان باشد';
    case 'checksum':
      return 'کد ملی نامعتبر است';
    default:
      return 'کد ملی نامعتبر است';
  }
};

// Helper functions
function formatCurrencyFa(amount: number | null | undefined): string {
  try {
    if (amount == null || typeof amount !== 'number' || isNaN(amount)) return '۰';
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch {
    return String(amount ?? 0);
  }
}

function formatDateFa(date: string | null | undefined): string {
  if (!date) return 'نامشخص';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'نامشخص';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return 'نامشخص';
  }
}

/** Statuses that mean "waiting for backend" – show loading and poll every 3s */
function isAwaitingStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return (
    s === 'awaitingbill' ||
    s === 'awaitingmemberapproval' ||
    s === '8' ||
    s === '9'
  );
}

function getStatusBadge(status: string | null | undefined) {
  // برچسب‌های وضعیت با معنی روشن برای کاربر
  switch (status) {
    case 'AwaitingMemberApproval': case 'awaitingmemberapproval':
    case '9':
      return {
        icon: PiSpinner,
        text: 'منتظر تأیید عضویت',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-800',
      };
    case 'AwaitingBill': case 'awaitingbill':
    case '8':
      return {
        icon: PiSpinner,
        text: 'منتظر صدور فاکتور',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-800',
      };
    case 'Pending': case 'pending':
    case '0':
      return {
        icon: PiClock,
        text: 'منتظر تکمیل',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
      };
    case 'Submitted': case 'submitted':
    case '1':
      return {
        icon: PiClock,
        text: 'منتظر بررسی',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'Confirmed': case 'confirmed':
    case '2':
      return {
        icon: PiCheckCircle,
        text: 'آماده پرداخت',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-800',
      };
    case 'Paying': case 'paying':
    case '3':
      return {
        icon: PiClock,
        text: 'منتظر پرداخت',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'Paid': case 'paid':
    case '4':
      return {
        icon: PiCheckCircle,
        text: 'تکمیل شده',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-800',
      };
    case 'Canceled': case 'canceled':
    case '5':
      return {
        icon: PiXCircle,
        text: 'لغو شده',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'Rejected': case 'rejected':
    case '6':
      return {
        icon: PiXCircle,
        text: 'رد شده',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'Expired': case 'expired':
    case '7':
      return {
        icon: PiWarningCircle,
        text: 'منقضی شده',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    default:
      return {
        icon: PiClock,
        text: status || 'نامشخص',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
      };
  }
}

function copyToClipboard(text: string, toast: (opts: { title: string; description: string; variant: 'success' | 'error'; duration: number }) => void) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    toast({
      title: 'کپی شد',
      description: 'کد پیگیری کپی شد',
      variant: 'success',
      duration: 2000,
    });
  }).catch(() => {
    toast({
      title: 'خطا',
      description: 'کپی ناموفق بود',
      variant: 'error',
      duration: 2500,
    });
  });
}

type Props = {
  params: Promise<{ reservationId: string }>;
};

export default function ReservationDetailPage({ params }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { reservationId } = use(params);

  const { data: detailRes, isLoading: isLoadingDetail, isFetching: isFetchingDetail, refetch: refetchDetail } = useGetReservationDetailQuery(reservationId, {
    skip: !reservationId,
  });

  const { data: pricingRes, isLoading: isLoadingPricing, refetch: refetchPricing } = useGetReservationPricingQuery(reservationId, {
    skip: !reservationId,
  });

  const [addGuest, { isLoading: isAddingGuest }] = useAddGuestToReservationMutation();
  const [removeGuest, { isLoading: isRemovingGuest }] = useRemoveGuestFromReservationMutation();
  const [payReservation, { isLoading: isPaying }] = usePayReservationMutation();
  const [submitReservation, { isLoading: isSubmitting }] = useSubmitReservationMutation();
  const [cancelReservation, { isLoading: isCanceling }] = useCancelReservationMutation();
  const [rejectReservation, { isLoading: isRejecting }] = useRejectReservationMutation();
  const [revertReservation, { isLoading: isReverting }] = useRevertReservationMutation();
  const [deleteReservation, { isLoading: isDeleting }] = useDeleteReservationMutation();

  const reservation = detailRes?.data;
  const pricing = pricingRes?.data;
  const status = reservation?.status || null;
  const badge = getStatusBadge(status);
  const awaitingStatus = isAwaitingStatus(status);

  // When status is awaiting (e.g. AwaitingBill, AwaitingMemberApproval), poll detail every 3s to detect status change
  useEffect(() => {
    if (!reservationId || !awaitingStatus) return;
    const interval = setInterval(() => {
      refetchDetail();
      refetchPricing();
    }, 3000);
    return () => clearInterval(interval);
  }, [reservationId, awaitingStatus, refetchDetail, refetchPricing]);
  const StatusIcon = badge.icon;

  // Check if status allows adding/deleting guests
  // Pending (0) = can add/delete, Submitted (1) and others = cannot
  const canModifyGuests = status === 'Pending' || status === 'pending' || status === '0';
  const canAddGuest = (reservation?.canAddGuest ?? false) && canModifyGuests;
  
  // Check if can submit reservation (only in Pending status with at least one guest)
  const canSubmit = (status === 'Pending' || status === 'pending' || status === '0') && 
                    reservation?.guests && 
                    reservation.guests.length > 0;
  
  // Check if can cancel reservation (Pending or Submitted status)
  const canCancel = (status === 'Pending' || status === 'pending' || status === '0' || status === 'Submitted' || status === 'submitted' || status === '1');
  
  // Check if can reject reservation (Confirmed status - user can reject and not pay)
  const canReject = (status === 'Confirmed' || status === 'confirmed' || status === '2');
  
  // Check if can revert reservation (Submitted status - revert to Pending for editing)
  const canRevert = (status === 'Submitted' || status === 'submitted' || status === '1');
  
  // Check if can delete reservation (Rejected or Canceled status)
  const canDelete = (status === 'Rejected' || status === 'rejected' || status === '6' || status === 'Canceled' || status === 'canceled' || status === '5');

  // Relationship type options (enum values as strings)
  const relationshipOptions = [
    { value: 'Spouse', label: 'همسر' },
    { value: 'Son', label: 'پسر' },
    { value: 'Daughter', label: 'دختر' },
    { value: 'DaughterInLaw', label: 'عروس' },
    { value: 'SonInLaw', label: 'داماد' },
    { value: 'Relative', label: 'فامیل' },
    { value: 'Friend', label: 'دوست' },
  ];

  const [guestForm, setGuestForm] = useState<{
    fullName: string;
    nationalNumber: string;
    relationshipType: string;
    age: string;
  }>({
    fullName: '',
    nationalNumber: '',
    relationshipType: '',
    age: '',
  });

  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    nationalNumber?: string;
    age?: string;
  }>({});

  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    const errors: typeof formErrors = {};

    // Validate full name
    if (!guestForm.fullName || guestForm.fullName.trim() === '') {
      errors.fullName = 'نام و نام خانوادگی الزامی است';
    }

    // Validate national code (required)
    if (!guestForm.nationalNumber || guestForm.nationalNumber.trim() === '') {
      errors.nationalNumber = 'کد ملی الزامی است';
    } else {
      // Normalize and validate national code
      const normalizedCode = Melli.normalize(guestForm.nationalNumber);
      const validation = Melli.validate(normalizedCode);
      if (!validation.ok) {
        errors.nationalNumber = getNationalCodeError(validation.reason);
      }
    }

    // Validate age if provided
    if (guestForm.age && guestForm.age.trim() !== '') {
      const ageNum = parseInt(guestForm.age);
      if (isNaN(ageNum)) {
        errors.age = 'سن باید یک عدد معتبر باشد';
      } else if (ageNum < 0) {
        errors.age = 'سن نمی‌تواند منفی باشد';
      } else if (ageNum > 150) {
        errors.age = 'سن نمی‌تواند بیشتر از ۱۵۰ باشد';
      }
    }

    // Set errors and return if any validation failed
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: 'خطا',
        description: 'لطفاً اطلاعات فرم را بررسی کنید',
        variant: 'error',
      });
      return;
    }

    // Clear errors
    setFormErrors({});

    try {
      // Normalize national code before sending
      const normalizedNationalCode = Melli.normalize(guestForm.nationalNumber || '');

      // Prepare guest data - send relationshipType only if selected
      const guestData: AddGuestBody = {
        fullName: (guestForm.fullName || '').trim() || null,
        nationalNumber: normalizedNationalCode || null,
        relationshipType: guestForm.relationshipType && guestForm.relationshipType.trim() !== '' 
          ? guestForm.relationshipType 
          : null,
        // Convert age string to number if provided
        ...(guestForm.age && guestForm.age.trim() !== '' 
          ? { age: parseInt(guestForm.age) || undefined }
          : {}),
      };

      await addGuest({
        reservationId,
        guest: guestData,
      }).unwrap();

      toast({
        title: 'مهمان اضافه شد',
        description: 'اطلاعات مهمان با موفقیت ثبت شد. می‌توانید مهمان دیگری اضافه کنید یا رزرو را ارسال کنید.',
        variant: 'success',
      });

      // Reset form and close modal
      setGuestForm({ fullName: '', nationalNumber: '', relationshipType: '', age: '' });
      setFormErrors({});
      setShowAddGuestModal(false);
      
      // Reload reservation data
      refetchDetail();
      refetchPricing();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در اضافه کردن مهمان';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    try {
      await removeGuest({
        reservationId,
        guestId,
      }).unwrap();

      toast({
        title: 'مهمان با موفقیت حذف شد',
        variant: 'success',
      });

      refetchDetail();
      refetchPricing();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در حذف مهمان';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await submitReservation(reservationId).unwrap();

      if (result.isSuccess && result.data) {
      toast({
        title: 'رزرو ارسال شد',
        description: 'رزرو شما برای بررسی ارسال شد. پس از تأیید اپراتور، می‌توانید پرداخت را انجام دهید.',
        variant: 'success',
      });

        // Refetch reservation details to get updated status
        await refetchDetail();
        await refetchPricing();
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در ارسال رزرو';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در ارسال رزرو';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handlePay = async () => {
    try {
      const result = await payReservation(reservationId).unwrap();

      if (result.isSuccess && result.data) {
      toast({
        title: 'در حال هدایت به پرداخت',
        description: 'لطفاً صبر کنید...',
        variant: 'success',
      });

        // Refetch reservation details to get updated status and billId
        await refetchDetail();
        await refetchPricing();

        // If billId is available, navigate to bill page
        if (result.data.billId) {
          router.push(`/bills/${encodeURIComponent(result.data.trackingCode || '')}?billType=HotelReservation`);
        }
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در آغاز پرداخت';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در آغاز پرداخت';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleGoToBill = () => {
    if (!reservation?.trackingCode) return;
    router.push(`/bills/${encodeURIComponent(reservation.trackingCode)}?billType=HotelReservation`);
  };

  const handleCancel = async () => {
    if (!confirm('آیا از لغو این رزرو اطمینان دارید؟')) {
      return;
    }

    try {
      const result = await cancelReservation({
        reservationId,
        reason: 'لغو توسط کاربر',
      }).unwrap();

      if (result.isSuccess && result.data) {
        toast({
          title: 'موفق',
          description: 'رزرو با موفقیت لغو شد',
          variant: 'success',
        });

        await refetchDetail();
        await refetchPricing();
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در لغو رزرو';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در لغو رزرو';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleRevert = async () => {
    if (!confirm('آیا از بازگشت این رزرو به وضعیت «منتظر تکمیل» اطمینان دارید؟')) {
      return;
    }

    try {
      const result = await revertReservation(reservationId).unwrap();

      if (result.isSuccess && result.data) {
        toast({
          title: 'موفق',
          description: 'رزرو با موفقیت به وضعیت «منتظر تکمیل» بازگشت. همراه‌ها را بررسی کنید و دوباره ارسال کنید.',
          variant: 'success',
        });

        await refetchDetail();
        await refetchPricing();
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در بازگشت رزرو';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در بازگشت رزرو';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف دائمی این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست.')) {
      return;
    }

    try {
      const result = await deleteReservation(reservationId).unwrap();

      if (result.isSuccess) {
        toast({
          title: 'موفق',
          description: 'رزرو با موفقیت حذف شد',
          variant: 'success',
        });

        // Navigate back to reservations list
        router.push('/hotels/reservations');
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در حذف رزرو';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در حذف رزرو';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleReject = async () => {
    if (!confirm('آیا از رد این رزرو اطمینان دارید؟ با رد کردن رزرو، امکان پرداخت وجود نخواهد داشت.')) {
      return;
    }

    try {
      const result = await rejectReservation({
        reservationId,
        reason: 'رد توسط کاربر - عدم تمایل به پرداخت',
      }).unwrap();

      if (result.isSuccess && result.data) {
        toast({
          title: 'موفق',
          description: 'رزرو با موفقیت رد شد',
          variant: 'success',
        });

        await refetchDetail();
        await refetchPricing();
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در رد رزرو';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[0] ||
        error?.message ||
        'خطا در رد رزرو';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const formatShamsiDate = (gregorianDate: string | null | undefined): string => {
    if (!gregorianDate) return '—';
    try {
      // Handle ISO date strings (with or without time)
      let date: Date;
      if (gregorianDate.includes('T')) {
        // Already has time component
        date = new Date(gregorianDate);
      } else {
        // Just date, add time to avoid timezone issues
        date = new Date(gregorianDate + 'T12:00:00');
      }
      
      if (isNaN(date.getTime())) {
        console.warn('[Reservation Detail] Invalid date:', gregorianDate);
        return '—';
      }
      
      const jalaali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
      return `${jalaali.jy}/${String(jalaali.jm).padStart(2, '0')}/${String(jalaali.jd).padStart(2, '0')}`;
    } catch (error) {
      console.error('[Reservation Detail] Date formatting error:', error, 'Input:', gregorianDate);
      return '—';
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return '—';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  // Loading Skeleton
  if (isLoadingDetail) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader title="جزئیات رزرو" showBackButton onBack={() => router.push('/hotels/reservations')} />
        <ScrollableArea className="flex-1" hideScrollbar>
          <div className="p-4 space-y-4 animate-pulse">
            {/* Reservation Info Skeleton */}
            <div className="bg-surface rounded-lg p-4">
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mt-3" />
            </div>
            {/* Pricing Skeleton */}
            <div className="bg-surface rounded-lg p-5">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mt-4" />
              </div>
            </div>
            {/* Guests Skeleton */}
            <div className="bg-surface rounded-lg p-5">
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  // Error State with Retry
  if (!reservation) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader title="خطا در بارگذاری" showBackButton onBack={() => router.push('/hotels/reservations')} />
        <ScrollableArea className="flex-1" hideScrollbar>
          <div className="flex justify-center items-center py-12 px-4">
            <div className="text-center max-w-md">
              <PiWarningCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                رزرو یافت نشد
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                متأسفانه امکان بارگذاری اطلاعات رزرو وجود ندارد. لطفاً دوباره تلاش کنید.
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => refetchDetail()} 
                  variant="outline"
                  size="md"
                  leftIcon={<PiSpinner className="h-4 w-4" />}
                >
                  تلاش دوباره
                </Button>
                <Button 
                  onClick={() => router.push('/hotels/reservations')} 
                  size="md"
                >
                  بازگشت به لیست
                </Button>
              </div>
            </div>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9CA3AF #F3F4F6;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F3F4F6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9CA3AF;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
        .dark .custom-scrollbar {
          scrollbar-color: #4B5563 #1F2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="جزئیات رزرو"
        titleIcon={<PiHouse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle={reservation.trackingCode ? `${reservation.trackingCode.slice(0, 12)}...` : undefined}
        showBackButton
        onBack={() => router.push('/hotels/reservations')}
      />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Reservation Info Card */}
            <div className="bg-surface rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {reservation.accommodation?.name && (
                    <h2 className="text-heading-3 text-on-surface">
                      {reservation.accommodation.name}
                    </h2>
                  )}
                  {reservation.room?.roomTypeText && (
                    <p className="text-body text-muted mt-1">{reservation.room.roomTypeText}</p>
              )}
            </div>
              </div>
              
              {/* Reservation Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption mb-3">
                <div>
                  <span className="text-muted">تاریخ ورود: </span>
                  <span className="text-on-surface font-medium">
                  {reservation.checkInDate ? formatShamsiDate(reservation.checkInDate) : '—'}
                </span>
              </div> {/* checkInDate */}
                <div>
                  <span className="text-muted">تاریخ خروج: </span>
                  <span className="text-on-surface font-medium">
                  {reservation.checkOutDate ? formatShamsiDate(reservation.checkOutDate) : '—'}
                </span>
                </div>
                <div>
                  <span className="text-muted">تعداد شب: </span>
                  <span className="text-on-surface font-medium">{reservation.nights || 0} شب</span>
                </div>
                <div>
                  <span className="text-muted">تعداد مهمان: </span>
                  <span className="text-on-surface font-medium">{reservation.guestCount || 0} نفر</span>
                </div>
                {reservation.trackingCode && (
                  <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                    <span className="text-muted">کد پیگیری: </span>
                    <span className="text-on-surface font-medium font-mono text-caption">
                      {reservation.trackingCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(reservation.trackingCode || '', toast)}
                      className="p-1 rounded hover:bg-ghost-hover transition"
                      aria-label="کپی کد پیگیری"
                      title="کپی کد پیگیری"
                    >
                      <PiCopy className="h-3.5 w-3.5 text-muted hover:text-secondary" />
                    </button>
                  </div>
                )}
              </div>

              {/* Status Badge with Description */}
              <div className="border-t border-subtle pt-3 mt-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-lg ${badge.bg} ${badge.border} border inline-flex items-center gap-2 w-fit`}>
                      <StatusIcon className={`h-4 w-4 shrink-0 ${badge.color} ${isAwaitingStatus(status) ? 'animate-spin' : ''}`} />
                      <span className={`text-caption font-semibold ${badge.color}`}>{badge.text}</span>
                    </div>
                    {isAwaitingStatus(status) && (
                      <span className="text-caption text-muted inline-flex items-center gap-1.5">
                        {isFetchingDetail ? (
                          <>
                            <PiSpinner className="h-3.5 w-3.5 animate-spin" />
                            در حال به‌روزرسانی...
                          </>
                        ) : (
                          <>بررسی خودکار هر ۳ ثانیه</>
                        )}
                      </span>
                    )}
                  </div>
                  {/* توضیح راهنما زیر هر وضعیت */}
                  {status === 'AwaitingMemberApproval' || status === 'awaitingmemberapproval' || status === '9' ? (
                    <p className="text-caption text-muted">
                      در حال بررسی اعتبار عضویت شما. لطفاً چند لحظه صبر کنید؛ وضعیت به‌طور خودکار به‌روز می‌شود.
                    </p>
                  ) : status === 'AwaitingBill' || status === 'awaitingbill' || status === '8' ? (
                    <p className="text-caption text-muted">
                      در حال صدور صورت‌حساب. لطفاً چند لحظه صبر کنید؛ پس از آماده شدن فاکتور می‌توانید پرداخت کنید.
                    </p>
                  ) : status === 'Pending' || status === 'pending' || status === '0' ? (
                    <p className="text-caption text-muted">
                      همراه‌های خود را اضافه کنید و پس از تکمیل روی «ارسال رزرو» کلیک کنید.
                    </p>
                  ) : status === 'Submitted' || status === 'submitted' || status === '1' ? (
                    <p className="text-caption text-muted">
                      رزرو شما برای کارشناس ارسال شده است. پس از تأیید، می‌توانید پرداخت را انجام دهید.
                    </p>
                  ) : status === 'Confirmed' || status === 'confirmed' || status === '2' ? (
                    <p className="text-caption text-muted">
                      رزرو شما تأیید شده است. برای تکمیل، روی دکمه «پرداخت» کلیک کنید.
                    </p>
                  ) : status === 'Paying' || status === 'paying' || status === '3' ? (
                    <p className="text-caption text-muted">
                      برای تکمیل پرداخت روی دکمه زیر کلیک کنید. مهلت شما ۲۴ ساعت است.
                    </p>
                  ) : status === 'Paid' || status === 'paid' || status === '4' ? (
                    <p className="text-caption text-muted">
                      رزرو شما با موفقیت تکمیل شد. اطلاعات رزرو را در این صفحه مشاهده می‌کنید.
                    </p>
                  ) : status === 'Canceled' || status === 'canceled' || status === '5' ? (
                    <div className="text-caption text-muted space-y-1">
                      <p>این رزرو لغو شده است.</p>
                      {reservation.cancellationReason && (
                        <p>دلیل لغو: {reservation.cancellationReason}</p>
                      )}
                      <p className="text-xs">در صورت تمایل می‌توانید این رزرو را از لیست حذف کنید.</p>
                    </div>
                  ) : status === 'Rejected' || status === 'rejected' || status === '6' ? (
                    <div className="text-caption text-muted space-y-1">
                      <p>این رزرو رد شده است.</p>
                      {reservation.rejectionReason && (
                        <p>دلیل رد: {reservation.rejectionReason}</p>
                      )}
                      <p className="text-xs">در صورت تمایل می‌توانید این رزرو را از لیست حذف کنید.</p>
                    </div>
                  ) : status === 'Expired' || status === 'expired' || status === '7' ? (
                    <p className="text-caption text-muted">
                      مهلت پرداخت این رزرو به پایان رسیده است. برای رزرو مجدد، یک رزرو جدید ایجاد کنید.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

          {/* Pricing */}
          {pricing && (
              <div className="bg-surface rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <PiCurrencyDollar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-heading-3 text-on-surface">قیمت‌گذاری</h2>
              </div>
                <div className="space-y-2 text-body">
                {pricing.dailyPrices && pricing.dailyPrices.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {pricing.dailyPrices.map((daily, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-subtle">
                          <span className="text-muted">{formatShamsiDate(daily.date || '')}</span>
                          <span className="text-on-surface font-semibold">{formatCurrency(daily.amountRials)}</span>
                      </div>
                    ))}
                  </div>
                )}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-primary">
                    <span className="text-body font-bold text-on-surface">جمع کل:</span>
                    <span className="text-heading-3 font-bold text-primary">{formatCurrency(pricing.totalAmountRials)}</span>
                  </div>
                </div>
              </div>
          )}

          {/* Guests */}
            <div className="bg-surface rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading-3 text-on-surface flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  مهمان‌ها
                </h2>
                {canAddGuest && (
                  <IconButton
                  onClick={() => setShowAddGuestModal(true)}
                    variant="solid"
                    color="primary"
                    aria-label="افزودن مهمان"
                >
                    <PiPlus />
                  </IconButton>
              )}
            </div>

            {reservation.guests && reservation.guests.length > 0 ? (
                <div className="space-y-3">
                {reservation.guests.map((guest) => (
                  <div
                    key={guest.id}
                      className="p-3 rounded-lg border border-subtle bg-subtle"
                  >
                      <div className="flex items-center justify-between">
                    <div className="flex-1">
                          <p className="text-body font-medium text-on-subtle">{guest.fullName || '—'}</p>
                      {guest.nationalNumberMasked && (
                        //  add national number to span
                            <p className="text-caption text-muted mt-1">کد ملی: <span className="font-mono" dir='ltr'>{guest.nationalNumberMasked}</span></p>
                      )}
                      {guest.relationshipTypeText && (
                            <p className="text-caption text-muted mt-1">{guest.relationshipTypeText}</p>
                      )}
                    </div>
                    {/* if owner cannot be deleted */}
                    {guest.relationshipType !== 'Owner' && (
                        <>
                        {canModifyGuests && guest.id && (
                          <IconButton
                            onClick={() => handleRemoveGuest(guest.id!)}
                        variant="outline"
                            aria-label="حذف مهمان"
                        disabled={isRemovingGuest}
                            className="text-red-600 hover:text-red-700 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                            <PiTrash />
                          </IconButton>
                        )}
                        </>
                      )}
                      </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center py-8">
                  <PiUsers className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted" />
                  <p className="text-body text-muted mb-2">هنوز مهمانی اضافه نشده است</p>
                  {canAddGuest && (
                    <IconButton
                      onClick={() => setShowAddGuestModal(true)}
                      variant="solid"
                      color="primary"
                      aria-label="افزودن اولین مهمان"
                      className="mt-4"
                    >
                      <PiPlus />
                    </IconButton>
                  )}
              </div>
            )}
            </div>

          {/* Notes */}
          {reservation.notes && (
              <div className="bg-surface rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                  <PiNote className="h-4 w-4 text-muted" />
                  <h3 className="text-heading-3 text-on-surface">توضیحات</h3>
                </div>
                <p className="text-body text-muted">{reservation.notes}</p>
              </div>
          )}
          </div>
        </div>

        {/* Action Buttons - Submit and Cancel (Only for Pending status with guests) */}
        {canSubmit && (
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <div className="flex gap-2">
              <Button
                variant="outline"
                color="danger"
                className="flex-1"
                onClick={handleCancel}
                loading={isCanceling}
                loadingText="در حال لغو..."
                leftIcon={!isCanceling ? <PiXCircle className="h-4 w-4" /> : undefined}
              >
                لغو رزرو
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                loading={isSubmitting}
                loadingText="در حال ارسال..."
                leftIcon={!isSubmitting ? <PiCheckCircle className="h-4 w-4" /> : undefined}
              >
                ارسال رزرو
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons - Cancel only (Only for Pending status without guests) */}
        {(status === 'Pending' || status === 'pending' || status === '0') && !canSubmit && canCancel && (
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <Button
              variant="outline"
              color="danger"
              className="w-full"
              onClick={handleCancel}
              loading={isCanceling}
              loadingText="در حال لغو..."
              leftIcon={!isCanceling ? <PiXCircle className="h-4 w-4" /> : undefined}
            >
              لغو رزرو
            </Button>
          </div>
        )}

        {/* Action Buttons - Revert and Cancel (Only for Submitted status) */}
        {(status === 'Submitted' || status === 'submitted' || status === '1') && canCancel && (
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <div className="flex gap-2">
              <Button
                variant="outline"
                color="danger"
                className="flex-1"
                onClick={handleCancel}
                loading={isCanceling}
                loadingText="در حال لغو..."
                leftIcon={!isCanceling ? <PiXCircle className="h-4 w-4" /> : undefined}
              >
                لغو رزرو
              </Button>
              <Button
                variant="solid"
                color="primary"
                className="flex-1"
                onClick={handleRevert}
                loading={isReverting}
                loadingText="در حال بازگشت..."
                leftIcon={!isReverting ? <PiArrowRight className="h-4 w-4" /> : undefined}
              >
                بازگشت به ویرایش
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons - Pay or Reject (Only for Confirmed status) */}
        {(status === 'Confirmed' || status === 'confirmed' || status === '2') && (   
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <div className="flex gap-2">
              <Button
                variant="outline"
                color="danger"
                className="flex-1"
                onClick={handleReject}
                loading={isRejecting}
                loadingText="در حال رد..."
                leftIcon={!isRejecting ? <PiXCircle className="h-4 w-4" /> : undefined}
              >
                رد رزرو
              </Button>
              <Button
                className="flex-1"
                onClick={handlePay}
                loading={isPaying}
                loadingText="در حال آغاز پرداخت..."
                leftIcon={!isPaying ? <PiReceipt className="h-4 w-4" /> : undefined}
              >
                {pricing?.totalAmountRials 
                  ? `پرداخت (${formatCurrencyFa(pricing.totalAmountRials)} ریال)`
                  : 'شروع پرداخت'
                }
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons - Go to Bill (Only for Paying status) */}
        {(status === 'Paying' || status === 'paying' || status === '3') && reservation.billId && (
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <Button
              onClick={handleGoToBill}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
              leftIcon={<PiReceipt className="h-5 w-5" />}
            >
              پرداخت ({pricing?.totalAmountRials ? formatCurrencyFa(pricing.totalAmountRials) + ' ریال' : 'مشاهده فاکتور'})
            </Button>
          </div>
        )}

        {/* Action Buttons - Delete (Only for Rejected or Canceled status) */}
        {canDelete && (
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <Button
              variant="outline"
              color="danger"
              className="w-full"
              onClick={handleDelete}
              loading={isDeleting}
              loadingText="در حال حذف..."
              leftIcon={!isDeleting ? <PiTrash className="h-4 w-4" /> : undefined}
            >
              حذف رزرو
            </Button>
          </div>
        )}

      {/* Add Guest Modal */}
      <Dialog open={showAddGuestModal} onClose={() => setShowAddGuestModal(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-200" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
            <div className="p-6" dir="rtl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  افزودن مهمان
                </DialogTitle>
                <button
                  onClick={() => {
                    setShowAddGuestModal(false);
                    setGuestForm({ fullName: '', nationalNumber: '', relationshipType: '', age: '' });
                      setFormErrors({});
                  }}
                  className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  aria-label="بستن"
                  disabled={isAddingGuest}
                >
                  <PiXCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddGuest} className="space-y-4">
                <InputField
                  label="نام و نام خانوادگی"
                  value={guestForm.fullName || ''}
                    onChange={(e) => {
                      setGuestForm({ ...guestForm, fullName: e.target.value });
                      if (formErrors.fullName) {
                        setFormErrors({ ...formErrors, fullName: undefined });
                      }
                    }}
                  required
                  disabled={isAddingGuest}
                    status={formErrors.fullName ? 'danger' : 'default'}
                    description={formErrors.fullName}
                />
                <InputField
                  label="کد ملی"
                  value={Melli.format(guestForm.nationalNumber || '')}
                    onChange={(e) => {
                      // Normalize input (only digits, max 10) - remove formatting for storage
                      const normalized = Melli.normalize(e.target.value);
                      setGuestForm({ ...guestForm, nationalNumber: normalized });
                      if (formErrors.nationalNumber) {
                        setFormErrors({ ...formErrors, nationalNumber: undefined });
                      }
                    }}
                  required
                  disabled={isAddingGuest}
                    status={formErrors.nationalNumber ? 'danger' : guestForm.nationalNumber.length === 10 ? 'success' : 'default'}
                    description={formErrors.nationalNumber || (guestForm.nationalNumber.length === 10 ? 'کد ملی معتبر است' : undefined)}
                    placeholder="XXX-XXXXXX-X"
                    maxLength={12}
                    inputMode="numeric"
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    نسبت (اختیاری)
                  </label>
                    <select
                      value={guestForm.relationshipType || ''}
                      onChange={(e) => setGuestForm({ ...guestForm, relationshipType: e.target.value || '' })}
                      disabled={isAddingGuest}
                    className="w-full h-10 px-3.5 text-sm border border-neutral-300 dark:border-gray-600 rounded-[2px] bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-600 dark:focus:ring-sky-500 focus:border-sky-600 dark:focus:border-sky-500 disabled:bg-neutral-100 dark:disabled:bg-gray-700 disabled:text-neutral-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-[border-color,box-shadow,background-color] duration-150"
                  >
                    <option value="">انتخاب کنید...</option>
                    {relationshipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <InputField
                  label="سن (اختیاری)"
                  type="number"
                  min="0"
                  max="150"
                  value={guestForm.age || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers
                      if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setGuestForm({ ...guestForm, age: value });
                        if (formErrors.age) {
                          setFormErrors({ ...formErrors, age: undefined });
                        }
                      }
                    }}
                  disabled={isAddingGuest}
                  placeholder="سن مهمان را وارد کنید"
                    status={formErrors.age ? 'danger' : 'default'}
                    description={formErrors.age}
                />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="subtle"
                    size="md"
                    onClick={() => {
                      setShowAddGuestModal(false);
                      setGuestForm({ fullName: '', nationalNumber: '', relationshipType: '', age: '' });
                        setFormErrors({});
                    }}
                    disabled={isAddingGuest}
                    className="min-w-[80px]"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    color="primary"
                    size="md"
                    loading={isAddingGuest}
                    disabled={isAddingGuest}
                    className="min-w-[80px]"
                  >
                    افزودن
                  </Button>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
    </>
  );
}
