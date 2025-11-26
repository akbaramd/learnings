'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { IconButton } from '@/src/components/ui/IconButton';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { PageHeader } from '@/src/components/ui/PageHeader/PageHeader';
import { useGetReservationDetailQuery, useGetReservationPricingQuery, useRemoveGuestFromReservationMutation, useFinalizeReservationMutation, useReactivateReservationMutation, useGetTourDetailQuery } from '@/src/store/tours/tours.queries';
import { selectSelectedReservation } from '@/src/store/tours';
import { useSelector } from 'react-redux';
import {
  PiUsers,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiReceipt,
  PiCopy,
  PiSpinner,
  PiUserPlus,
  PiTrash,
  PiArrowClockwise,
  PiWarningCircle,
  PiArrowCounterClockwise,
  PiDownload,
} from 'react-icons/pi';
import { useToast } from '@/src/hooks/useToast';

function formatCurrencyFa(amount: number | null | undefined) {
  try {
    if (amount == null || typeof amount !== 'number' || isNaN(amount)) return '۰';
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch {
    return String(amount ?? 0);
  }
}

// Helper function to check if something is free (isFree flag OR amount is 0)
function isFree(isFreeFlag: boolean | null | undefined, amount: number | null | undefined): boolean {
  return isFreeFlag === true || (amount != null && amount === 0);
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
    }).format(d);
  } catch {
    return 'نامشخص';
  }
}

function getStatusBadge(status: string | null | undefined) {
  switch (status) {
    case 'Confirmed':
      return {
        icon: PiCheckCircle,
        text: 'تأیید شده',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-800',
      };
    case 'Pending':
      return {
        icon: PiClock,
        text: 'در انتظار',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'Draft':
      return {
        icon: PiClock,
        text: 'پیش‌نویس',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
      };
    case 'OnHold':
      return {
        icon: PiClock,
        text: 'در انتظار پرداخت',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'Paying':
      return {
        icon: PiClock,
        text: 'در حال پرداخت',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'Cancelled':
      return {
        icon: PiXCircle,
        text: 'لغو شده',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'Expired':
      return {
        icon: PiWarningCircle,
        text: 'منقضی شده',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'SystemCancelled':
      return {
        icon: PiXCircle,
        text: 'لغو شده توسط سیستم',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'ProcessingFailed':
      return {
        icon: PiWarningCircle,
        text: 'خطا در پردازش',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'CancellationProcessing':
      return {
        icon: PiClock,
        text: 'در حال پردازش لغو',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'CancellationProcessed':
      return {
        icon: PiCheckCircle,
        text: 'لغو پردازش شده',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
      };
    case 'Waitlisted':
      return {
        icon: PiClock,
        text: 'در لیست انتظار',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'CancellationRequested':
      return {
        icon: PiClock,
        text: 'درخواست لغو',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'AmendmentRequested':
      return {
        icon: PiClock,
        text: 'درخواست تغییر',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
      };
    case 'NoShow':
      return {
        icon: PiXCircle,
        text: 'عدم حضور',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'Rejected':
      return {
        icon: PiXCircle,
        text: 'رد شده',
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

function isExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  
  try {
    // Remove microseconds (keep only milliseconds)
    const cleanedDate = expiryDate.replace(/\.(\d{3})\d+/, '.$1');
    
    let expiry: Date;
    const hasTimezone = cleanedDate.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(cleanedDate);
    
    if (!hasTimezone) {
      const isoMatch = cleanedDate.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
      
      if (isoMatch) {
        const [, year, month, day, hour, minute, second, ms = '0'] = isoMatch;
        const utcDateString = `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms.padEnd(3, '0')}Z`;
        expiry = new Date(utcDateString);
      } else {
        expiry = new Date(cleanedDate + 'Z');
      }
    } else {
      expiry = new Date(cleanedDate);
    }
    
    if (isNaN(expiry.getTime())) return false;
    
    return expiry.getTime() <= Date.now();
  } catch {
    return false;
  }
}

function getRemainingTime(expiryDate: string | null | undefined): string {
  if (!expiryDate) return 'نامشخص';
  
  try {
    // Remove microseconds (keep only milliseconds) - JavaScript Date supports up to 3 digits
    const cleanedDate = expiryDate.replace(/\.(\d{3})\d+/, '.$1');
    
    let expiry: Date;
    
    // Check if date has timezone indicator (Z or +/-offset)
    const hasTimezone = cleanedDate.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(cleanedDate);
    
    if (!hasTimezone) {
      // No timezone - assume UTC (standard practice for APIs)
      // Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss.mmm
      const isoMatch = cleanedDate.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
      
      if (isoMatch) {
        const [, year, month, day, hour, minute, second, ms = '0'] = isoMatch;
        // Parse as UTC by appending 'Z' to make it explicit
        const utcDateString = `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms.padEnd(3, '0')}Z`;
        expiry = new Date(utcDateString);
      } else {
        // Fallback: append Z to treat as UTC
        expiry = new Date(cleanedDate + 'Z');
      }
    } else {
      // Has timezone info, parse normally (JavaScript handles timezone correctly)
      expiry = new Date(cleanedDate);
    }
    
    // Get current time in local timezone
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(expiry.getTime())) {
      console.warn('Invalid expiry date:', expiryDate, 'cleaned:', cleanedDate);
      return 'نامشخص';
    }
    
    // Calculate difference in milliseconds (both dates are now in the same timezone context)
    const diff = expiry.getTime() - now.getTime();
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Time calculation:', {
        input: expiryDate,
        cleaned: cleanedDate,
        expiryUTC: expiry.toISOString(),
        expiryLocal: expiry.toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
        expiryTimestamp: expiry.getTime(),
        nowUTC: now.toISOString(),
        nowLocal: now.toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
        nowTimestamp: now.getTime(),
        diffMs: diff,
        diffMinutes: Math.floor(diff / 60000),
        diffHours: Math.floor(diff / 3600000),
        isExpired: diff <= 0,
      });
    }
    
    // If difference is negative or zero, it's expired
    if (diff <= 0) {
      return 'منقضی شده';
    }
    
    // Calculate time components
    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    
    // Format output based on remaining time
    if (totalDays > 0) {
      const remainingHours = totalHours % 24;
      if (remainingHours > 0) {
        return `${totalDays} روز و ${remainingHours} ساعت`;
      }
      return `${totalDays} روز`;
    } else if (totalHours > 0) {
      const remainingMinutes = totalMinutes % 60;
      if (remainingMinutes > 0) {
        return `${totalHours} ساعت و ${remainingMinutes} دقیقه`;
      }
      return `${totalHours} ساعت`;
    } else if (totalMinutes > 0) {
      const remainingSeconds = totalSeconds % 60;
      if (remainingSeconds > 0 && totalMinutes < 5) {
        return `${totalMinutes} دقیقه و ${remainingSeconds} ثانیه`;
      }
      return `${totalMinutes} دقیقه`;
    } else {
      return `${totalSeconds} ثانیه`;
    }
  } catch (error) {
    console.error('Error calculating remaining time:', error, expiryDate);
    return 'نامشخص';
  }
}

function translateTourStatus(status: string | null | undefined): string {
  switch (status) {
    case 'RegistrationOpen':
      return 'ثبت‌نام باز';
    case 'RegistrationClosed':
      return 'ثبت‌نام بسته';
    case 'Completed':
      return 'تکمیل شده';
    case 'Cancelled':
      return 'لغو شده';
    default:
      return status || 'نامشخص';
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

interface ReservationDetailsPageProps {
  params: Promise<{ reservationId: string }>;
}

export default function ReservationDetailsPage({ params }: ReservationDetailsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { reservationId } = use(params);
  
  const { data, isLoading, isFetching, error, refetch: refetchDetails } = useGetReservationDetailQuery(reservationId, {
    skip: !reservationId,
  });
  
  const { data: pricingData, refetch: refetchPricing } = useGetReservationPricingQuery(reservationId, {
    skip: !reservationId,
  });
  
  const [removeGuest, { isLoading: isRemoving }] = useRemoveGuestFromReservationMutation();
  const [finalizeReservation, { isLoading: isFinalizing }] = useFinalizeReservationMutation();
  const [reactivateReservation, { isLoading: isReactivating }] = useReactivateReservationMutation();
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);

  const reservation = useSelector(selectSelectedReservation);
  const details = reservation || data?.data;
  const pricing = pricingData?.data;
  const status = details?.status || null;
  const badge = getStatusBadge(status);
  const StatusIcon = badge.icon;
  
  // Get tour details using tourId from reservation
  const tourId = details?.tourId;
  const { data: tourDetailData } = useGetTourDetailQuery(tourId || '', {
    skip: !tourId,
  });
  const tourDetails = tourDetailData?.data;
  
  // Get max guests per reservation from tour details
  const maxGuestsPerReservation = tourDetails?.maxGuestsPerReservation ?? null;
  
  // Calculate current guest count (non-main participants)
  const currentGuestCount = details?.participants?.filter(p => p.isGuest || !p.isMainParticipant).length ?? 0;
  
  // Check if can add more guests
  const canAddGuest = maxGuestsPerReservation == null || currentGuestCount < maxGuestsPerReservation;
  
  // Check if reservation is expired - use isExpired from API or calculate from expiryDate
  const expired = details?.isExpired || (details?.expiryDate ? isExpired(details.expiryDate) : false);

  // Update remaining time every second for OnHold status (to detect expiration immediately)
  // Timer stops when expired
  const [, setRefreshTime] = useState(0);
  useEffect(() => {
    // Only start timer if not expired and status is OnHold/Draft
    if ((status === 'OnHold' || status === 'Draft') && details?.expiryDate && !expired) {
      // Check every second to detect expiration immediately
      const interval = setInterval(() => {
        // Check if expired during interval
        if (isExpired(details.expiryDate)) {
          // Just update state to trigger re-render, timer will be cleaned up on next effect run
          setRefreshTime((prev) => prev + 1);
          // Clear interval to stop timer
          clearInterval(interval);
        } else {
          // Update timer state
          setRefreshTime((prev) => prev + 1);
        }
      }, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [status, details?.expiryDate, expired]);

  const handleBack = () => {
    router.push('/tours');
  };

  const handleGoToBill = () => {
    if (!details?.trackingCode) return;
    router.push(`/bills/${encodeURIComponent(details.trackingCode)}?billType=TourReservation`);
  };

  const handleFinalizeClick = () => {
    setIsTermsAccepted(false); // Reset checkbox when opening dialog
    setShowFinalizeDialog(true);
  };

  const handleFinalizeConfirm = async (confirmed: boolean) => {
    setShowFinalizeDialog(false);
    
    if (!confirmed || !reservationId) return;

    try {
      const result = await finalizeReservation(reservationId).unwrap();
      
      if (result.isSuccess && result.data) {
        toast({
          title: 'موفق',
          description: 'رزرو با موفقیت نهایی شد. ظرفیت برای ۳۰ دقیقه برای شما رزرو شده است.',
          variant: 'success',
        });
        
        // Refetch reservation details to show updated status
        await refetchDetails();
        await refetchPricing();
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در نهایی‌سازی رزرو';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'خطا در نهایی‌سازی رزرو';
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data as { message?: string; errors?: string[] };
        errorMessage = errorData?.message || errorData?.errors?.[0] || errorMessage;
      }
      
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleAddGuest = () => {
    router.push(`/tours/reservations/${reservationId}/add-guest`);
  };

  const handleRemoveGuest = async (participantId: string) => {
    if (!participantId || !details) return;
    
    if (!confirm('آیا از حذف این عضو اطمینان دارید؟')) {
      return;
    }

    try {
      await removeGuest({
        reservationId,
        participantId,
      }).unwrap();
      
      toast({
        title: 'موفق',
        description: 'عضو با موفقیت حذف شد',
        variant: 'success',
      });
      
      refetchDetails();
      refetchPricing();
    } catch (error: unknown) {
      let errorMessage = 'خطا در حذف عضو';
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data as { message?: string; errors?: string[] };
        errorMessage = errorData?.message || errorData?.errors?.[0] || errorMessage;
      }
      
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleReactivate = async () => {
    if (!reservationId) return;

    try {
      const result = await reactivateReservation(reservationId).unwrap();
      
      if (result.isSuccess && result.data) {
        toast({
          title: 'موفق',
          description: 'رزرو با موفقیت فعال‌سازی مجدد شد',
          variant: 'success',
        });
        
        // Refetch reservation details to show updated status
        await refetchDetails();
        await refetchPricing();
      } else {
        const errorMessage = result.message || result.errors?.[0] || 'خطا در فعال‌سازی مجدد رزرو';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'خطا در فعال‌سازی مجدد رزرو';
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data as { message?: string; errors?: string[] };
        errorMessage = errorData?.message || errorData?.errors?.[0] || errorMessage;
      }
      
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleDownloadTickets = async () => {
    if (!details || !details.participants || details.participants.length === 0) return;
    
    setIsDownloadingTicket(true);
    
    try {
      // Dynamically import html2canvas and qrcode
      const html2canvas = (await import('html2canvas')).default;
      const QRCode = (await import('qrcode')).default;
      
      // Create a container for tickets
      const ticketContainer = document.createElement('div');
      ticketContainer.style.position = 'absolute';
      ticketContainer.style.left = '-9999px';
      ticketContainer.style.width = '1000px';
      ticketContainer.style.padding = '40px';
      ticketContainer.style.backgroundColor = '#ffffff';
      ticketContainer.style.color = '#111827';
      ticketContainer.style.fontFamily = 'Vazirmatn, Arial, sans-serif';
      ticketContainer.style.fontSize = '16px';
      ticketContainer.style.lineHeight = '1.5';
      ticketContainer.dir = 'rtl';
      document.body.appendChild(ticketContainer);

      // Helper function to escape HTML
      const escapeHtml = (text: string | null | undefined) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      // Helper function to generate QR code data URL
      const generateQRCode = async (data: string): Promise<string> => {
        try {
          return await QRCode.toDataURL(data, {
            width: 200,
            margin: 1,
            color: {
              dark: '#059669',
              light: '#FFFFFF',
            },
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
          return '';
        }
      };

      // Create ticket HTML for each participant
      const ticketsHTML = await Promise.all(
        details.participants.map(async (participant, index) => {
          const participantPrice = pricing?.participants?.find(p => p.participantId === participant.id)?.requiredAmount ?? participant.requiredAmountRials ?? 0;
          const isParticipantFree = isFree(false, participantPrice);
          
          // Create QR code data: combination of reservationId, nationalNumber, trackingCode, and acceptanceCode
          const qrDataParts = [
            reservationId || '',
            participant.nationalNumber || '',
            details.trackingCode || '',
            participant.acceptanceCode || '',
          ].filter(Boolean);
          const qrData = qrDataParts.join('|');
          const qrCodeDataUrl = await generateQRCode(qrData);
          
          return `
            <div style="box-sizing: border-box; margin-bottom: ${index < details.participants!.length - 1 ? '60px' : '0'}; border: 2px solid rgb(5, 150, 105); border-radius: 12px; padding: 0; background-color: rgb(255, 255, 255); display: flex; flex-direction: row; align-items: stretch;">
            <!-- Tear-off Stub (Right side in RTL) -->
              <div style="width: 220px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: rgb(243, 244, 246); border-left: 2px dashed rgb(5, 150, 105); text-align: center;">
                <div style="margin-bottom: 15px; width: 100%;">
                  <div style="font-size: 11px; color: rgb(55, 65, 81); font-weight: 600; margin-bottom: 5px;">نام و نام خانوادگی:</div>
                  <div style="font-size: 13px; color: rgb(17, 24, 39); font-weight: 500; margin-bottom: 12px;">${escapeHtml(participant.fullName || `${participant.firstName || ''} ${participant.lastName || ''}`.trim())}</div>
                  
                  ${participant.nationalNumber ? `
                  <div style="font-size: 11px; color: rgb(55, 65, 81); font-weight: 600; margin-bottom: 5px;">کد ملی:</div>
                  <div style="font-size: 13px; color: rgb(17, 24, 39); font-weight: 500; margin-bottom: 12px;">${escapeHtml(participant.nationalNumber)}</div>
                  ` : ''}
                </div>
                
                ${details.trackingCode ? `
                  <div style="text-align: center; margin-bottom: 15px; width: 100%;">
                    <div style="font-size: 10px; color: rgb(55, 65, 81); font-weight: 600; margin-bottom: 4px;">کد پیگیری رزرو</div>
                    <div style="font-size: 11px; color: rgb(5, 150, 105); font-family: 'Courier New', monospace;">${escapeHtml(details.trackingCode)}</div>
                  </div>
                ` : ''}
                ${participant.acceptanceCode ? `
                  <div style="text-align: center; margin-bottom: 10px; width: 100%;">
                    <div style="font-size: 10px; color: rgb(55, 65, 81); font-weight: 600; margin-bottom: 4px;">کد پذیرش</div>
                    <div style="font-size: 11px; color: rgb(5, 150, 105); font-family: 'Courier New', monospace;">${escapeHtml(participant.acceptanceCode)}</div>
                  </div>
                ` : ''}
              </div>
              <!-- Content Section (Left side in RTL) -->
              <div style="flex: 1; padding: 30px; ">
                <div style="margin-bottom: 20px;">
                  <div style="font-size: 16px; color: rgb(55, 65, 81); font-weight: 700; margin-bottom: 8px; text-align: center;">سازمان نظام مهندسی ساختمان آذربایجان غربی</div>
                  <div style="font-size: 14px; color: rgb(107, 114, 128); font-weight: 600; margin-bottom: 10px; text-align: center;">بلیط رزرو تور و رویداد</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="font-weight: 600; color: rgb(55, 65, 81);">عنوان:</span>
                    <span style="font-size: 18px; font-weight: bold; color: rgb(4, 120, 87);">${escapeHtml(details.tour?.title || 'تور')}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="font-weight: 600; color: rgb(55, 65, 81);">نام و نام خانوادگی:</span>
                    <span style="font-size: 18px; font-weight: bold; color: rgb(17, 24, 39);">${escapeHtml(participant.fullName || `${participant.firstName || ''} ${participant.lastName || ''}`.trim())}</span>
                  </div>
                  
                  ${participant.nationalNumber ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="font-weight: 600; color: rgb(55, 65, 81);">کد ملی:</span>
                    <span style="font-size: 16px; color: rgb(17, 24, 39);">${escapeHtml(participant.nationalNumber)}</span>
                  </div>
                  ` : ''}
                  
                  ${details.tour?.tourStart ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="font-weight: 600; color: rgb(55, 65, 81);">تاریخ شروع:</span>
                    <span style="font-size: 16px; color: rgb(17, 24, 39);">${escapeHtml(formatDateFa(details.tour.tourStart))}</span>
                  </div>
                  ` : ''}
                  
                  ${details.tour?.tourEnd ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="font-weight: 600; color: rgb(55, 65, 81);">تاریخ پایان:</span>
                    <span style="font-size: 16px; color: rgb(17, 24, 39);">${escapeHtml(formatDateFa(details.tour.tourEnd))}</span>
                  </div>
                  ` : ''}
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="font-weight: 600; color: rgb(55, 65, 81);">مبلغ:</span>
                    <span style="font-size: 18px; font-weight: bold; color: rgb(5, 150, 105);">
                      ${isParticipantFree ? 'رایگان' : `${formatCurrencyFa(participantPrice)} ریال`}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- QR Code Section (Middle) -->
              <div style="width: 250px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid rgb(5, 150, 105);">
                ${qrCodeDataUrl ? `
                  <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 150px; height: 150px; border: 2px solid rgb(5, 150, 105); border-radius: 6px; padding: 8px; background-color: white; margin-bottom: 12px;" />
                ` : ''}
                ${details.trackingCode ? `
                  <div style="margin-bottom: 15px; width: 100%; text-align: center;">
                    <div style="font-size: 11px; font-weight: 600; color: rgb(55, 65, 81); margin-bottom: 4px;">کد پیگیری رزرو:</div>
                    <div style="font-size: 14px; font-weight: bold; color: rgb(17, 24, 39);">${escapeHtml(details.trackingCode)}</div>
                  </div>
                ` : ''}
                ${participant.acceptanceCode ? `
                  <div style="margin-bottom: 15px; width: 100%; text-align: center;">
                    <div style="font-size: 12px; font-weight: 600; color: rgb(5, 150, 105); margin-bottom: 4px;">کد پذیرش:</div>
                    <div style="font-size: 16px;color: rgb(5, 150, 105); font-weight: bold;">${escapeHtml(participant.acceptanceCode)}</div>
                  </div>
                ` : ''}
              </div>
              
              
            </div>
          `;
        })
      );

      ticketContainer.innerHTML = ticketsHTML.join('');

      // Wait for fonts and images to load
      await document.fonts.ready;
      
      // Wait for QR code images to load
      const images = ticketContainer.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve, reject) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = reject;
              }
            })
        )
      );

      // Generate canvas with simplified options to avoid color parsing issues
      const canvas = await html2canvas(ticketContainer, {
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `بلیط-${details.trackingCode || reservationId}-${new Date().getTime()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: 'موفق',
            description: 'بلیط‌ها با موفقیت دانلود شد',
            variant: 'success',
          });
        }
        
        // Cleanup
        document.body.removeChild(ticketContainer);
        setIsDownloadingTicket(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating ticket image:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد تصویر بلیط',
        variant: 'error',
      });
      setIsDownloadingTicket(false);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="جزئیات رزرو"
          titleIcon={<PiReceipt className="h-5 w-5 text-primary" />}
          showBackButton={true}
          onBack={handleBack}
        />
        <div className="flex-1 flex items-center justify-center">
          <PiSpinner className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-3 text-muted">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="جزئیات رزرو"
          titleIcon={<PiReceipt className="h-5 w-5 text-primary" />}
          showBackButton={true}
          onBack={handleBack}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4 text-body">
              {error ? 'خطا در بارگذاری جزئیات رزرو' : 'رزرو یافت نشد'}
            </p>
            <Button onClick={handleBack}>بازگشت</Button>
          </div>
        </div>
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
        {/* Page Header */}
        <PageHeader
          title="جزئیات رزرو"
          titleIcon={<PiReceipt className="h-5 w-5 text-primary" />}
          subtitle={details.trackingCode ? `${details.trackingCode.slice(0, 12)}...` : undefined}
          showBackButton={true}
          onBack={handleBack}
          rightActions={[
            {
              icon: <PiArrowClockwise className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />,
              onClick: () => { refetchDetails(); refetchPricing(); },
              disabled: isFetching,
              'aria-label': 'بروزرسانی',
              label: 'بروزرسانی',
            },
          ]}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Compact Reservation Details */}
            <div className="bg-surface rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {details.tour?.title && (
                    <h2 className="text-heading-3 text-on-surface">
                      {details.tour.title}
                    </h2>
                  )}
                </div>
              </div>
              
              {/* Tour Information */}
              {details.tour && (
                <div className="mb-3 pb-3 border-b border-subtle">
                  <h3 className="text-label text-on-surface mb-2">اطلاعات تور و رویداد</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-caption">
                    {details.tour.tourStart && (
                      <div>
                        <span className="text-muted">شروع: </span>
                        <span className="text-on-surface font-medium">
                          {formatDateFa(details.tour.tourStart)}
                        </span>
                      </div>
                    )}
                    {details.tour.tourEnd && (
                      <div>
                        <span className="text-muted">پایان: </span>
                        <span className="text-on-surface font-medium">
                          {formatDateFa(details.tour.tourEnd)}
                        </span>
                      </div>
                    )}
                    {details.tour.status && (
                      <div>
                        <span className="text-muted">وضعیت: </span>
                        <span className="text-on-surface font-medium">
                          {translateTourStatus(details.tour.status)}
                        </span>
                      </div>
                    )}
                    {details.tour.isActive !== undefined && (
                      <div>
                        <span className="text-muted">فعال: </span>
                        <span className={`font-medium ${details.tour.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted'}`}>
                          {details.tour.isActive ? 'بله' : 'خیر'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reservation Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption mb-3">
                {details.capacity?.description && (
                  <div>
                    <span className="text-muted">ظرفیت: </span>
                    <span className="text-on-surface font-medium">{details.capacity.description}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted">تعداد شرکت‌کنندگان: </span>
                  <span className="text-on-surface font-medium">
                    {details.participantCount || 0} نفر
                  </span>
                </div>
                {details.trackingCode && (
                  <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                    <span className="text-muted">کد پیگیری: </span>
                    <span className="text-on-surface font-medium font-mono text-caption">
                      {details.trackingCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(details.trackingCode || '', toast)}
                      className="p-1 rounded hover:bg-ghost-hover transition"
                      aria-label="کپی کد پیگیری"
                      title="کپی کد پیگیری"
                    >
                      <PiCopy className="h-3.5 w-3.5 text-muted hover:text-secondary" />
                    </button>
                  </div>
                )}
              </div>

              {/* Draft Status Badge with Description - At bottom of card */}
              {status === 'Draft' && (
                <div className="border-t border-subtle pt-3 mt-3">
                  <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1.5 rounded-lg ${badge.bg} ${badge.border} border inline-flex items-center gap-2 w-fit`}>
                      <StatusIcon className={`h-4 w-4 ${badge.color}`} />
                      <span className={`text-caption font-semibold ${badge.color}`}>{badge.text}</span>
                    </div>
                    <span className="text-caption text-muted">
                      این رزرو هنوز نهایی نشده است و قطعی محسوب نمی‌شود. برای قطعی شدن رزرو، باید آن را نهایی و پرداخت کنید.
                    </span>
                  </div>
                </div>
              )}

              {/* OnHold Status Badge with Description and Remaining Time - At bottom of card */}
              {status === 'OnHold' && !expired && (
                <div className="border-t border-subtle pt-3 mt-3">
                  <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1.5 rounded-lg ${badge.bg} ${badge.border} border inline-flex items-center gap-2 w-fit`}>
                      <StatusIcon className={`h-4 w-4 ${badge.color}`} />
                      <span className={`text-caption font-semibold ${badge.color}`}>{badge.text}</span>
                    </div>
                    <span className="text-caption text-muted">
                      این رزرو در انتظار پرداخت است. زمان باقی‌مانده: <strong className="text-orange-600 dark:text-orange-400">{getRemainingTime(details.expiryDate)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Confirmed Status Badge with Description - At bottom of card */}
              {status === 'Confirmed' && (
                <div className="border-t border-subtle pt-3 mt-3">
                  <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1.5 rounded-lg ${badge.bg} ${badge.border} border inline-flex items-center gap-2 w-fit`}>
                      <StatusIcon className={`h-4 w-4 ${badge.color}`} />
                      <span className={`text-caption font-semibold ${badge.color}`}>{badge.text}</span>
                    </div>
                    <span className="text-caption text-muted">
                      این رزرو با موفقیت تأیید شده است. پرداخت به صورت کامل انجام شده و رزرو قطعی است.
                    </span>
                  </div>
                </div>
              )}

              {/* Expired Status Badge - Shows when expired */}
              {(expired || status === 'Expired') && (
                <div className="border-t border-subtle pt-3 mt-3">
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 inline-flex items-center gap-2 w-fit">
                      <PiWarningCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-caption font-semibold text-red-600 dark:text-red-400">منقضی شده</span>
                    </div>
                    <span className="text-caption text-muted">
                      مهلت پرداخت این رزرو به پایان رسیده است. جهت ادامه، لازم است ظرفیت را مجدداً رزرو و فرآیند پرداخت را آغاز کنید.
                      
                    </span>
                  </div>
                </div>
              )}

              {/* Rejected Status Badge with Alert */}
              {status === 'Rejected' && (
                <div className="border-t border-subtle pt-3 mt-3">
                  <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1.5 rounded-lg ${badge.bg} ${badge.border} border inline-flex items-center gap-2 w-fit`}>
                      <StatusIcon className={`h-4 w-4 ${badge.color}`} />
                      <span className={`text-caption font-semibold ${badge.color}`}>{badge.text}</span>
                    </div>
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                      <div className="flex items-start gap-3">
                        <PiWarningCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                            دلیل رد رزرو
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                            رزرو شما به دلیل عدم تطابق با شرایط تور رد شده است. ممکن است دلیل رد یکی از موارد زیر باشد:
                          </div>
                          <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                            <li>محدودیت جنسیتی تور</li>
                            <li>محدودیت منطقه‌ای (شهرستان محل سکونت)</li>
                          </ul>
                          <div className="mt-3 text-xs text-red-600 dark:text-red-400 italic">
                            لطفاً شرایط تور را بررسی کرده و در صورت نیاز با پشتیبانی تماس بگیرید.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Participants Card with Pricing */}
            <div className="bg-surface rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading-3 text-on-surface flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  شرکت‌کنندگان و قیمت
                </h2>
                {details.status === 'Draft' && canAddGuest && (
                  <Button
                    onClick={handleAddGuest}
                    size="sm"
                    variant="solid"
                    leftIcon={<PiUserPlus className="h-4 w-4" />}
                  >
                    افزودن عضو
                  </Button>
                )}
                {details.status === 'Draft' && !canAddGuest && maxGuestsPerReservation != null && (
                  <span className="text-caption text-muted">
                    حداکثر {maxGuestsPerReservation} مهمان مجاز است
                  </span>
                )}
              </div>

              {details.participants && details.participants.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {details.participants.map((participant) => {
                    const participantPricing = pricing?.participants?.find(p => p.participantId === participant.id);
                    const participantPrice = participantPricing?.requiredAmount ?? participant.requiredAmountRials ?? 0;
                    
                    return (
                      <div
                        key={participant.id}
                        className="p-3 rounded-lg border border-subtle bg-subtle"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-body font-medium text-on-subtle">
                              {participant.fullName || `${participant.firstName} ${participant.lastName}`}
                            </span>
                            {participant.isMainParticipant && (
                              <span className="px-2 py-0.5 text-caption font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                اصلی
                              </span>
                            )}
                            {participant.isGuest && (
                              <span className="px-2 py-0.5 text-caption font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                                مهمان
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-body font-semibold text-on-subtle">
                              {isFree(false, participantPrice) 
                                ? 'رایگان' 
                                : `${formatCurrencyFa(participantPrice)} ریال`
                              }
                            </span>
                            {details.status === 'Draft' && participant.isGuest && (
                              <IconButton
                                onClick={() => handleRemoveGuest(participant.id || '')}
                                variant="solid"
                                color="accent"
                                aria-label="حذف عضو"
                                disabled={isRemoving}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <PiTrash />
                              </IconButton>
                            )}
                          </div>
                        </div>
                        {participant.isFullyPaid && (
                          <div className="mt-2 text-caption text-green-600 dark:text-green-400">
                            ✓ پرداخت شده
                          </div>
                        )}
                        {status === 'Confirmed' && participant.acceptanceCode && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-caption font-medium text-gray-700 dark:text-gray-300">کد پذیرش:</span>
                            <span className="text-caption font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                              {participant.acceptanceCode}
                            </span>
                            <button
                              onClick={() => copyToClipboard(participant.acceptanceCode || '', toast)}
                              className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
                              aria-label="کپی کد پذیرش"
                              title="کپی کد پذیرش"
                            >
                              <PiCopy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 mb-4">
                  <PiUsers className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted" />
                  <p className="text-body text-muted mb-2">هنوز عضوی اضافه نشده است</p>
                  {details.status === 'Draft' && canAddGuest && (
                    <Button
                      onClick={handleAddGuest}
                      size="sm"
                      variant="solid"
                      leftIcon={<PiUserPlus className="h-4 w-4" />}
                      className="mt-4"
                    >
                      افزودن اولین عضو
                    </Button>
                  )}
                  {details.status === 'Draft' && !canAddGuest && maxGuestsPerReservation != null && (
                    <p className="text-caption text-muted mt-4">
                      حداکثر {maxGuestsPerReservation} مهمان مجاز است
                    </p>
                  )}
                </div>
              )}

              {/* Final Price Summary */}
              {(details.isFree || pricing?.totalRequiredAmount != null || pricing?.totalRemainingAmount != null || details.totalAmountRials != null) && (
                <div className="border-t border-subtle pt-4 space-y-2">
                  {(() => {
                    const totalAmount = pricing?.totalRequiredAmount ?? details.totalAmountRials ?? 0;
                    const isTotalFree = isFree(details.isFree, totalAmount);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-body font-medium text-muted">مبلغ کل:</span>
                          <span className="text-heading-3 font-bold text-on-surface">
                            {isTotalFree ? 'رایگان' : `${formatCurrencyFa(totalAmount)} ریال`}
                          </span>
                        </div>
                        {!isTotalFree && details.paidAmountRials != null && details.paidAmountRials > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-body font-medium text-muted">پرداخت شده:</span>
                            <span className="text-body font-semibold text-green-600 dark:text-green-400">
                              {isFree(false, details.paidAmountRials) ? 'رایگان' : `${formatCurrencyFa(details.paidAmountRials)} ریال`}
                            </span>
                          </div>
                        )}
                        {!isTotalFree && (pricing?.totalRemainingAmount != null || details.remainingAmountRials != null) && (
                          <div className="flex items-center justify-between">
                            <span className="text-body font-medium text-muted">باقیمانده:</span>
                            <span className="text-heading-3 font-bold text-orange-600 dark:text-orange-400">
                              {(() => {
                                const remainingAmount = pricing?.totalRemainingAmount ?? details.remainingAmountRials ?? 0;
                                return isFree(false, remainingAmount) ? 'رایگان' : `${formatCurrencyFa(remainingAmount)} ریال`;
                              })()}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {details.isFullyPaid && (() => {
              const totalAmount = pricing?.totalRequiredAmount ?? details.totalAmountRials ?? 0;
              const isTotalFree = isFree(details.isFree, totalAmount);
              return !isTotalFree ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <PiCheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">رزرو شما با موفقیت پرداخت شده است.</span>
                  </div>
                </div>
              ) : null;
            })()}

            {details.isCancelled && details.cancellationReason && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <PiXCircle className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium mb-1">رزرو لغو شده</div>
                    <div className="text-xs">{details.cancellationReason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Download Tickets Button - Only for Confirmed reservations */}
            {status === 'Confirmed' && details.participants && details.participants.length > 0 && (
              <div className="bg-surface rounded-lg p-4">
                <Button
                  onClick={handleDownloadTickets}
                  variant="solid"
                  className="w-full"
                  leftIcon={<PiDownload className="h-5 w-5" />}
                  disabled={isDownloadingTicket}
                  loading={isDownloadingTicket}
                >
                  {isDownloadingTicket ? 'در حال ایجاد بلیط‌ها...' : 'دانلود بلیط‌ها'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Finalize and Pay (Only for Draft, not expired) */}
        {details.status === 'Draft' && !expired && (() => {
          const totalAmount = pricing?.totalRequiredAmount ?? details.totalAmountRials ?? 0;
          const isTotalFree = isFree(details.isFree, totalAmount);
          return (
            <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
              <Button
                onClick={handleFinalizeClick}
                disabled={isFinalizing}
                className="w-full"
                leftIcon={<PiReceipt className="h-5 w-5" />}
              >
                {isTotalFree
                  ? 'نهایی‌سازی (رایگان)'
                  : `نهایی‌سازی و پرداخت (${formatCurrencyFa(totalAmount)} ریال)`
                }
              </Button>
            </div>
          );
        })()}

        {/* Action Buttons - Reactivate Reservation (Only for expired) */}
        {(expired || status === 'Expired') && (
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <Button
              variant="solid"
              onClick={handleReactivate}
              disabled={isReactivating}
              loading={isReactivating}
              className="w-full"
              leftIcon={<PiArrowCounterClockwise className="h-5 w-5" />}
            >
              فعال‌سازی مجدد رزرو
            </Button>
          </div>
        )}

        {/* Finalize Confirmation Dialog */}
        <ConfirmDialog
          open={showFinalizeDialog}
          onClose={handleFinalizeConfirm}
          title="نهایی‌سازی رزرو"
          confirmText="نهایی‌سازی"
          cancelText="لغو"
          variant="warning"
          isLoading={isFinalizing}
          disabled={!isTermsAccepted}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              آیا از نهایی‌سازی این رزرو اطمینان دارید؟
            </p>
            
            <div className="space-y-3">
              {(() => {
                const totalAmount = pricing?.totalRequiredAmount ?? details.totalAmountRials ?? 0;
                const isTotalFree = isFree(details.isFree, totalAmount);
                
                if (!isTotalFree) {
                  return (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <PiClock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                          ظرفیت برای ۳۰ دقیقه برای شما رزرو می‌شود تا پرداخت را انجام دهید
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <PiClock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                          اگر تا ۳۰ دقیقه پرداخت انجام نگیرد، ظرفیت آزاد می‌شود و رزرو به حالت پیش‌نویس بازمی‌گردد
                        </p>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <PiCheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                        این رزرو رایگان است و نیازی به پرداخت ندارد. پس از نهایی‌سازی، رزرو شما قطعی می‌شود.
                      </p>
                    </div>
                  );
                }
              })()}
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <PiUsers className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                  پس از نهایی‌سازی، اعضای شرکت‌کننده قابل تغییر نخواهند بود
                </p>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isTermsAccepted}
                  onChange={(e) => setIsTermsAccepted(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-green-600 dark:checked:border-green-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  قوانین و ضوابط را خوانده و می‌پذیرم
                </span>
              </label>
            </div>
          </div>
        </ConfirmDialog>

        {/* Action Buttons - Pay Remaining */}
        {details.billId && !expired && status !== 'Expired' && (details.isPending || details.isPaying || details.status === 'Pending') && pricing?.totalRemainingAmount != null && !isFree(false, pricing.totalRemainingAmount) && (
          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
            <Button 
              onClick={handleGoToBill} 
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white" 
              leftIcon={<PiReceipt className="h-5 w-5" />}
            >
              پرداخت باقیمانده ({formatCurrencyFa(pricing.totalRemainingAmount)} ریال)
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

