'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetFacilityCycleDetailsQuery,
  useCreateFacilityRequestMutation,
} from '@/src/store/facilities';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/hooks/useToast';
import {
  PiCalendar,
  PiCheckCircle,
  PiClock,
  PiCurrencyCircleDollar,
  PiInfo,
  PiWarning,
} from 'react-icons/pi';

interface CreateRequestPageProps {
  params: Promise<{ cycleId: string }>;
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

export default function CreateRequestPage({ params }: CreateRequestPageProps) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [cycleIdFromParams, setCycleIdFromParams] = useState<string>('');
  const [selectedPriceOptionId, setSelectedPriceOptionId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [touched, setTouched] = useState<{ price: boolean; description: boolean }>({
    price: false,
    description: false,
  });
  const [validationErrors, setValidationErrors] = useState<{
    price?: string;
    description?: string;
  }>({});

  // Get cycle ID from params
  useEffect(() => {
    params.then(({ cycleId }) => {
      setCycleIdFromParams(cycleId);
    });
  }, [params]);

  // Query hooks - use automatic query
  const { 
    data: cycleDetailsData, 
    isLoading: isCycleLoading,
    isError: isCycleError,
  } = useGetFacilityCycleDetailsQuery(
    {
      cycleId: cycleIdFromParams,
      includeFacilityInfo: true,
      includeUserRequestHistory: true,
      includeEligibilityDetails: true,
      includeStatistics: true,
    },
    { skip: !cycleIdFromParams }
  );

  const [createRequest, { isLoading: isSubmitting }] = useCreateFacilityRequestMutation();

  // Extract cycle from response
  const cycle = useMemo(() => {
    return cycleDetailsData?.data || null;
  }, [cycleDetailsData]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors: { price?: string; description?: string } = {};

    // Validate price selection
    if (!selectedPriceOptionId.trim()) {
      errors.price = 'لطفاً یکی از مبالغ را انتخاب کنید';
    }

    // Validate description (optional but check length if provided)
    if (description.trim().length > 1000) {
      errors.description = 'توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedPriceOptionId, description]);

  // Handle price option selection
  const handlePriceOptionChange = useCallback((optionId: string) => {
    setSelectedPriceOptionId(optionId);
    setTouched(prev => ({ ...prev, price: true }));
    setValidationErrors(prev => ({ ...prev, price: undefined }));
  }, []);

  // Handle description change
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 1000) {
      setDescription(value);
      setTouched(prev => ({ ...prev, description: true }));
      setValidationErrors(prev => ({ ...prev, description: undefined }));
    }
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ price: true, description: true });
    
    if (!validateForm()) {
      showError('خطا', 'لطفاً تمام فیلدهای الزامی را به درستی پر کنید');
      return;
    }

    if (!cycleIdFromParams || !cycle) {
      showError('خطا', 'اطلاعات دوره یافت نشد');
      return;
    }

    // Validate that selected price option exists
    const selectedOption = cycle.financialTerms?.priceOptions?.find(
      opt => opt?.id === selectedPriceOptionId
    );

    if (!selectedOption || !selectedOption.id) {
      showError('خطا', 'مبلغ انتخاب شده نامعتبر است');
      return;
    }

    try {
      // Build request payload - only include defined values
      const requestPayload: {
        facilityCycleId: string;
        priceOptionId: string;
        description?: string | null;
        metadata?: Record<string, string>;
        idempotencyKey?: string | null;
      } = {
        facilityCycleId: cycleIdFromParams,
        priceOptionId: selectedOption.id,
      };

      // Add optional fields only if they have values
      const trimmedDescription = description.trim();
      if (trimmedDescription) {
        requestPayload.description = trimmedDescription;
      }

      // metadata and idempotencyKey can be added later if needed
      // For now, we omit them from the request

      const result = await createRequest(requestPayload).unwrap();

      if (result?.isSuccess && result?.data) {
        success('موفق', result.message || 'درخواست با موفقیت ثبت شد');
        // Navigate to request detail page
        if (result.data.requestId) {
          router.push(`/facilities/requests/${result.data.requestId}`);
        } else {
          router.push('/facilities/requests');
        }
      } else {
        // Handle API error response
        const errorMessages = result?.errors || [];
        const errorMessage = errorMessages.length > 0 
          ? errorMessages.join(', ')
          : result?.message || 'خطا در ثبت درخواست';
        showError('خطا', errorMessage);
      }
    } catch (err: unknown) {
      console.error('Error creating facility request:', {
        error: err,
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
      });

      // Extract error message from RTK Query error
      let errorMessage = 'خطا در ثبت درخواست';
      
      if (err && typeof err === 'object') {
        // RTK Query error structure
        if ('data' in err) {
          const errorData = (err as { data?: unknown }).data;
          if (errorData && typeof errorData === 'object') {
            const apiError = errorData as Record<string, unknown>;
            
            // Check for ApplicationResult format
            if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
              errorMessage = apiError.errors
                .filter((e): e is string => typeof e === 'string')
                .join(', ');
            } else if (typeof apiError.message === 'string') {
              errorMessage = apiError.message;
            }
          }
        } else if ('error' in err) {
          // Check for error object
          const errorObj = (err as { error?: unknown }).error;
          if (errorObj && typeof errorObj === 'object') {
            const apiError = errorObj as Record<string, unknown>;
            if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
              errorMessage = apiError.errors
                .filter((e): e is string => typeof e === 'string')
                .join(', ');
            } else if (typeof apiError.message === 'string') {
              errorMessage = apiError.message;
            }
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
      }

      showError('خطا', errorMessage);
    }
  }, [selectedPriceOptionId, description, cycleIdFromParams, cycle, validateForm, createRequest, router, success, showError]);

  const handleBack = useCallback(() => {
    // Navigate back to cycle detail or facility detail
    if (cycleIdFromParams) {
      router.push(`/facilities/cycles/${cycleIdFromParams}`);
    } else if (document.referrer && document.referrer.includes('/facilities')) {
      router.back();
    } else {
      router.push('/facilities');
    }
  }, [router, cycleIdFromParams]);

  // Computed values
  const descriptionStatus = useMemo(() => {
    if (!touched.description) return 'default';
    if (validationErrors.description) return 'danger';
    if (description.trim() && !validationErrors.description) return 'success';
    return 'default';
  }, [touched.description, validationErrors.description, description]);

  const canSubmit = useMemo(() => {
    return !isSubmitting && 
           selectedPriceOptionId.trim() !== '' && 
           !validationErrors.price && 
           !validationErrors.description &&
           cycle?.isActive === true;
  }, [isSubmitting, selectedPriceOptionId, validationErrors, cycle]);

  // Get price options from cycle financialTerms
  const priceOptions = useMemo(() => {
    return cycle?.financialTerms?.priceOptions || [];
  }, [cycle]);

  // Loading state
  if (isCycleLoading || !cycleIdFromParams) {
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

  // Error state - cycle not found
  if (isCycleError || (!isCycleLoading && !cycle)) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="دوره یافت نشد"
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <PiWarning className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              دوره مورد نظر یافت نشد
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleBack}
              className="mt-6"
            >
              بازگشت
            </Button>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  // Early return if cycle is still null or not active
  if (!cycle || cycle.isActive !== true) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="دوره فعال نیست"
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <PiWarning className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              این دوره فعال نیست و امکان ثبت درخواست وجود ندارد
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleBack}
              className="mt-6"
            >
              بازگشت
            </Button>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  // At this point, cycle is guaranteed to be non-null and active
  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="ثبت درخواست تسهیلات"
        titleIcon={<PiCurrencyCircleDollar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-2">
          {/* Cycle Information */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <PiCalendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              اطلاعات دوره
            </h3>
            <div className="space-y-3">
              {cycle.name && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">نام دوره</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {cycle.name}
                  </div>
                </div>
              )}

              {cycle.startDate && cycle.endDate && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">بازه زمانی</div>
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                    <PiClock className="h-4 w-4" />
                    <span>
                      {new Date(cycle.startDate).toLocaleDateString('fa-IR')} - {new Date(cycle.endDate).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>
              )}

              {cycle.financialTerms?.interestRatePercentage !== undefined && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">نرخ سود</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {cycle.financialTerms.interestRatePercentage}%
                  </div>
                </div>
              )}

              {cycle.financialTerms?.paymentMonths && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">مدت بازپرداخت</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrencyFa(cycle.financialTerms.paymentMonths)} ماه
                  </div>
                </div>
              )}

              {priceOptions.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">مبالغ مجاز</div>
                  <div className="flex flex-wrap gap-2">
                    {priceOptions.map((option, idx) => (
                      <div
                        key={option?.id || idx}
                        className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        {formatCurrencyFa(option?.amountRials)} ریال
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cycle.statistics && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">آمار دوره</div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {cycle.statistics.totalQuota !== undefined && (
                      <div>ظرفیت کل: {formatCurrencyFa(cycle.statistics.totalQuota)} درخواست</div>
                    )}
                    {cycle.statistics.usedQuota !== undefined && (
                      <div>استفاده شده: {formatCurrencyFa(cycle.statistics.usedQuota)} درخواست</div>
                    )}
                    {cycle.statistics.availableQuota !== undefined && (
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ظرفیت باقیمانده: {formatCurrencyFa(cycle.statistics.availableQuota)} درخواست
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cycle.availableQuota !== undefined && cycle.availableQuota > 0 && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">ظرفیت باقیمانده</div>
                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyFa(cycle.availableQuota)} درخواست
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Request Form */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <PiInfo className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              فرم درخواست
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Price Options Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  انتخاب مبلغ درخواست <span className="text-red-500">*</span>
                </label>
                {priceOptions.length === 0 ? (
                  <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      مبلغی برای این دوره تعریف نشده است
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {priceOptions.map((option, idx) => {
                      const optionId = option?.id || `option-${idx}`;
                      const isSelected = selectedPriceOptionId === optionId;
                      const amount = option?.amountRials || 0;
                      
                      return (
                        <button
                          key={optionId}
                          type="button"
                          onClick={() => handlePriceOptionChange(optionId)}
                          className={`
                            w-full p-4 rounded-lg border-2 transition-all text-right
                            ${isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                            }
                            ${touched.price && validationErrors.price && !isSelected
                              ? 'border-red-300 dark:border-red-600'
                              : ''
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center
                                ${isSelected
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-gray-400 dark:border-gray-500'
                                }
                              `}>
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <span className={`
                                text-base font-semibold
                                ${isSelected
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-gray-900 dark:text-gray-100'
                                }
                              `}>
                                {formatCurrencyFa(amount)} ریال
                              </span>
                            </div>
                            {isSelected && (
                              <PiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {touched.price && validationErrors.price && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.price}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  value={description}
                  onChange={handleDescriptionChange}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, description: true }));
                    validateForm();
                  }}
                  rows={4}
                  maxLength={1000}
                  className={`
                    w-full px-3 py-2 rounded-lg border
                    text-sm text-gray-900 dark:text-gray-100
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    resize-none
                    ${descriptionStatus === 'danger' ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                    ${descriptionStatus === 'success' ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}
                  `}
                  placeholder="توضیحات اضافی در مورد درخواست خود وارد کنید..."
                />
                {touched.description && validationErrors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {description.length} / 1000 کاراکتر
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  block
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!canSubmit}
                  loading={isSubmitting}
                  block
                >
                  ثبت درخواست
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </ScrollableArea>
    </div>
  );
}

