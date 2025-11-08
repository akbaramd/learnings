'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/hooks/useToast';
import { useGetReservationDetailQuery, useAddGuestToReservationMutation, useGetReservationPricingQuery } from '@/src/store/tours/tours.queries';
import { GuestParticipantDto } from '@/src/store/tours/tours.types';
import { toJalaali, toGregorian } from 'jalaali-js';
import {
  PiUserPlus,
  PiCalendar,
  PiSpinner,
  PiXCircle,
  PiEnvelope,
  PiPhone,
  PiIdentificationCard,
  PiNote,
  PiArrowLeft,
} from 'react-icons/pi';

// Utility functions for date conversion (outside component for better performance)
const normalizeDigits = (str: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = str;
  persianDigits.forEach((p, i) => {
    result = result.replace(new RegExp(p, 'g'), englishDigits[i]);
  });
  return result;
};

const toPersianDigits = (str: string): string => {
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let result = str;
  englishDigits.forEach((e, i) => {
    result = result.replace(new RegExp(e, 'g'), persianDigits[i]);
  });
  return result;
};

const convertToShamsi = (gregorianDate: string): string => {
  if (!gregorianDate) return '';
  try {
    const date = new Date(gregorianDate + 'T12:00:00');
    if (isNaN(date.getTime())) return '';
    
    const jalaali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const year = String(jalaali.jy).padStart(4, '0');
    const month = String(jalaali.jm).padStart(2, '0');
    const day = String(jalaali.jd).padStart(2, '0');
    
    return `${toPersianDigits(year)}/${toPersianDigits(month)}/${toPersianDigits(day)}`;
  } catch {
    return '';
  }
};


interface AddGuestPageProps {
  params: Promise<{ reservationId: string }>;
}

export default function AddGuestPage({ params }: AddGuestPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { reservationId } = use(params);
  
  const { data: reservationData, isLoading: isLoadingReservation } = useGetReservationDetailQuery(reservationId, {
    skip: !reservationId,
  });
  const { refetch: refetchPricing } = useGetReservationPricingQuery(reservationId, {
    skip: !reservationId,
  });
  const [addGuest, { isLoading: isAdding }] = useAddGuestToReservationMutation();

  const reservation = reservationData?.data;

  const [formData, setFormData] = useState<GuestParticipantDto>({
    firstName: '',
    lastName: '',
    nationalNumber: '',
    phoneNumber: '',
    email: '',
    birthDate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  });

  const handleBack = () => {
    router.push(`/tours/reservations/${reservationId}`);
  };

  const handleChange = (field: keyof GuestParticipantDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value || null }));
  };

  // Validate Shamsi date
  const validateShamsiDate = (shamsiDate: string): { isValid: boolean; gregorian?: string } => {
    if (!shamsiDate || shamsiDate.trim() === '') {
      return { isValid: false };
    }

    try {
      const normalized = normalizeDigits(shamsiDate.trim());
      const parts = normalized.split('/').filter(Boolean);
      
      if (parts.length !== 3) {
        return { isValid: false };
      }

      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      // Validate range
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return { isValid: false };
      }

      if (year < 1300 || year > 1450 || month < 1 || month > 12 || day < 1 || day > 31) {
        return { isValid: false };
      }

      // Convert to Gregorian using jalaali-js
      const gregorian = toGregorian(year, month, day);
      
      // Validate the conversion result
      if (!gregorian || isNaN(gregorian.gy) || isNaN(gregorian.gm) || isNaN(gregorian.gd)) {
        return { isValid: false };
      }

      // Check if date is valid (e.g., 1399/13/1 should be invalid)
      const testDate = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
      if (
        testDate.getFullYear() !== gregorian.gy ||
        testDate.getMonth() + 1 !== gregorian.gm ||
        testDate.getDate() !== gregorian.gd
      ) {
        return { isValid: false };
      }

      const gregorianStr = `${gregorian.gy}-${String(gregorian.gm).padStart(2, '0')}-${String(gregorian.gd).padStart(2, '0')}`;
      return { isValid: true, gregorian: gregorianStr };
    } catch {
      return { isValid: false };
    }
  };

  // Format input as user types (auto-add slashes, limit digits)
  const formatShamsiInput = (value: string): string => {
    // Handle null, undefined, or empty
    if (value == null || value === '') {
      return '';
    }
    
    // Convert to string if not already
    const strValue = String(value).trim();
    
    // If empty after trim, return empty
    if (strValue === '') {
      return '';
    }
    
    // Remove all non-digit characters except slashes
    // This regex keeps: 0-9, ۰-۹ (Persian digits), and /
    const cleaned = strValue.replace(/[^\d۰-۹/]/g, '');
    
    // If nothing left after cleaning, return empty
    if (cleaned === '') {
      return '';
    }
    
    // Normalize to English digits for processing
    const normalized = normalizeDigits(cleaned);
    
    // Remove slashes temporarily to process digits only
    const digitsOnly = normalized.replace(/\//g, '');
    
    // If no digits after removing slashes, return empty
    if (digitsOnly === '' || digitsOnly.length === 0) {
      return '';
    }
    
    // Limit to 8 digits (4 for year, 2 for month, 2 for day)
    const limited = digitsOnly.slice(0, 8);
    
    // Build formatted string with slashes
    let formatted = '';
    
    // Always process at least the first digit (even if it's just "1")
    if (limited.length >= 1) {
      // Year part (up to 4 digits)
      formatted = limited.slice(0, 4);
      
      // Add slash and month if we have 5+ digits
      if (limited.length >= 5) {
        formatted += '/' + limited.slice(4, 6);
        
        // Add slash and day if we have 7+ digits
        if (limited.length >= 7) {
          formatted += '/' + limited.slice(6, 8);
        }
      }
    }
    
    // Convert back to Persian digits for display
    const result = toPersianDigits(formatted);
    
    // Return result (will be empty string if formatted was empty)
    return result;
  };

  const [shamsiBirthDate, setShamsiBirthDate] = useState<string>('');
  const [isDateValid, setIsDateValid] = useState<boolean>(true);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);

  // Convert existing birthDate to Shamsi when component loads or birthDate changes
  // Only sync if user is not actively typing
  useEffect(() => {
    if (isUserTyping) return; // Don't override user input while typing
    
    if (formData.birthDate) {
      const shamsi = convertToShamsi(formData.birthDate);
      // Use timeout to avoid synchronous state updates
      const timeoutId = setTimeout(() => {
        setShamsiBirthDate(shamsi);
        setIsDateValid(true);
      }, 0);
      return () => clearTimeout(timeoutId);
    } else {
      const timeoutId = setTimeout(() => {
        setShamsiBirthDate('');
        setIsDateValid(true);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.birthDate, isUserTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservation) {
      toast({
        title: 'خطا',
        description: 'اطلاعات رزرو یافت نشد',
        variant: 'error',
      });
      return;
    }

    // Validate all required fields
    if (!formData.firstName || !formData.lastName || !formData.nationalNumber || !formData.phoneNumber || !formData.emergencyContactName || !formData.emergencyContactPhone) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای اجباری را تکمیل کنید',
        variant: 'error',
      });
      return;
    }

    // Validate date
    if (!shamsiBirthDate || !isDateValid) {
      toast({
        title: 'خطا',
        description: 'لطفاً تاریخ تولد معتبر وارد کنید',
        variant: 'error',
      });
      setShowValidation(true);
      return;
    }

    if (!formData.birthDate) {
      toast({
        title: 'خطا',
        description: 'لطفاً تاریخ تولد را وارد کنید',
        variant: 'error',
      });
      return;
    }

    try {
      const result = await addGuest({
        reservationId,
        guest: formData,
      }).unwrap();

      if (result?.isSuccess) {
        toast({
          title: 'موفق',
          description: 'عضو با موفقیت اضافه شد',
          variant: 'success',
        });
        await refetchPricing();
        router.push(`/tours/reservations/${reservationId}`);
      } else {
        toast({
          title: 'خطا',
          description: result?.message || 'خطا در افزودن عضو',
          variant: 'error',
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'خطا در افزودن عضو';
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

  if (isLoadingReservation) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="subtle"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <PiArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <PiUserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">افزودن عضو</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <PiSpinner className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="mr-3 text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="subtle"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <PiArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <PiUserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">افزودن عضو</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">رزرو یافت نشد</p>
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
        {/* Breadcrumb Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="subtle"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <PiArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <PiUserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">افزودن عضو</span>
              </div>
              <div className="flex-1"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            {/* Add Guest Form */}
            <form id="add-guest-form" onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  اطلاعات عضو جدید
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PiIdentificationCard className="inline h-4 w-4 ml-1" />
                    نام <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    placeholder="نام را وارد کنید"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PiIdentificationCard className="inline h-4 w-4 ml-1" />
                    نام خانوادگی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    placeholder="نام خانوادگی را وارد کنید"
                  />
                </div>

                {/* National Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PiIdentificationCard className="inline h-4 w-4 ml-1" />
                    کد ملی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nationalNumber || ''}
                    onChange={(e) => handleChange('nationalNumber', e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    placeholder="کد ملی را وارد کنید"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PiPhone className="inline h-4 w-4 ml-1" />
                    شماره تلفن <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    placeholder="شماره تلفن را وارد کنید"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PiEnvelope className="inline h-4 w-4 ml-1" />
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    placeholder="ایمیل را وارد کنید"
                  />
                </div>

                {/* Birth Date - Shamsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PiCalendar className="inline h-4 w-4 ml-1" />
                    تاریخ تولد (شمسی) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shamsiBirthDate}
                    onChange={(e) => {
                      // Set typing flag first to prevent useEffect interference
                      setIsUserTyping(true);
                      
                      // Get the raw input value
                      const rawValue = e.target.value;
                      
                      // Format the input (this handles Persian/English digits and auto-slashes)
                      const formatted = formatShamsiInput(rawValue);
                      
                      // Update display immediately - this ensures the input responds immediately
                      setShamsiBirthDate(formatted);
                      
                      setShowValidation(true);

                      // Validate and convert to Gregorian (async operation, doesn't block display)
                      const validation = validateShamsiDate(formatted);
                      setIsDateValid(validation.isValid);

                      // Update formData with Gregorian date (only if valid)
                      if (validation.isValid && validation.gregorian) {
                        handleChange('birthDate', validation.gregorian);
                      } else {
                        // Clear birthDate if invalid, but keep the display value
                        handleChange('birthDate', '');
                      }
                    }}
                    onBlur={() => {
                      setShowValidation(true);
                      // Reset typing flag after a short delay to allow useEffect to sync
                      setTimeout(() => setIsUserTyping(false), 100);
                    }}
                    onFocus={() => {
                      setIsUserTyping(true);
                      // Don't show validation while typing
                      if (shamsiBirthDate === '') {
                        setShowValidation(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Keep typing flag active during key operations
                      if (e.key !== 'Tab' && e.key !== 'Enter') {
                        setIsUserTyping(true);
                      }
                    }}
                    placeholder="۱۳۸۰/۰۱/۰۱"
                    required
                    className={`w-full rounded-lg border ${
                      showValidation
                        ? isDateValid && shamsiBirthDate
                          ? 'border-green-500 dark:border-green-400 focus:border-green-500 focus:ring-green-500/20'
                          : !shamsiBirthDate
                          ? 'border-gray-300 dark:border-gray-600'
                          : 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:outline-none transition`}
                    dir="rtl"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      فرمت: سال/ماه/روز (مثال: ۱۳۸۰/۰۱/۰۱)
                    </p>
                    {showValidation && shamsiBirthDate && (
                      <p
                        className={`text-xs ${
                          isDateValid
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isDateValid ? '✓ تاریخ معتبر است' : '✗ تاریخ نامعتبر است'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <PiNote className="h-5 w-5 text-emerald-600" />
                  اطلاعات تماس اضطراری
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام تماس اضطراری <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName || ''}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                      placeholder="نام تماس اضطراری را وارد کنید"
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <PiPhone className="inline h-4 w-4 ml-1" />
                      تلفن تماس اضطراری <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone || ''}
                      onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                      placeholder="تلفن تماس اضطراری را وارد کنید"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <PiNote className="inline h-4 w-4 ml-1" />
                  یادداشت‌ها
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition resize-none"
                  placeholder="یادداشت‌های اضافی (اختیاری)"
                />
              </div>

            </form>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-subtle z-10">
          <div className="flex gap-3">
            <Button
              type="button"
              leftIcon=<PiXCircle className="h-4 w-4" />
              onClick={handleBack}
              variant="subtle"
              className="flex-1"
            >
              
              انصراف
            </Button>
            <Button
              type="submit"
              leftIcon=  {isAdding ? 
                  <PiSpinner className="h-4 w-4 animate-spin" /> :                  <PiUserPlus className="h-4 w-4" />
              }
              form="add-guest-form"
              disabled={isAdding || !formData.firstName || !formData.lastName || !formData.nationalNumber || !formData.phoneNumber || !formData.birthDate || !formData.emergencyContactName || !formData.emergencyContactPhone}
            className='flex-1'
            >
                {isAdding ? 'در حال افزودن...' : 'افزودن عضو'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

