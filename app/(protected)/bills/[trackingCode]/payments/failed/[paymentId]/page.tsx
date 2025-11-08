'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
    useLazyGetPaymentDetailQuery,
    selectPaymentsLoading,
} from '@/src/store/payments';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PiXCircle, PiReceipt, PiArrowLeft } from 'react-icons/pi';
import { PaymentDetailDto } from '@/src/services/Api';

// ===== Utility Functions =====
function formatCurrencyFa(amount?: number | null): string {
    if (amount == null || isNaN(amount)) return '۰';
    return new Intl.NumberFormat('fa-IR').format(amount);
}

function formatDateFa(date?: string | Date | null): string {
    if (!date) return 'نامشخص';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
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

interface PaymentFailedPageProps {
    params: Promise<{ paymentId: string }>;
}

export default function PaymentFailedPage({ params }: PaymentFailedPageProps) {
    const router = useRouter();
    const [paymentData, setPaymentData] = useState<PaymentDetailDto | null>(null);
    const [paymentId, setPaymentId] = useState<string>('');
    const [getPaymentDetail] = useLazyGetPaymentDetailQuery();
    const isLoading = useSelector(selectPaymentsLoading);

    // Load route params
    useEffect(() => {
        const resolveParams = async () => {
            const resolved = await params;
            setPaymentId(resolved.paymentId);
        };
        resolveParams();
    }, [params]);

    // Fetch payment detail
    useEffect(() => {
        if (!paymentId) return;
        const fetchData = async () => {
            try {
                const response = await getPaymentDetail(paymentId).unwrap();
                setPaymentData(response?.result || null);
            } catch (err) {
                console.error('Error fetching payment detail:', err);
            }
        };
        fetchData();
    }, [paymentId, getPaymentDetail]);

    const handleDashboard = () => router.push('/dashboard');

    const printReceipt = () => {
       router.push('/bills/'+paymentData?.bill?.referenceTrackingCode);
    };

    // Navigate to reference page based on referenceType
    const handleNavigateToReference = () => {
        const bill = paymentData?.bill;
        if (!bill?.referenceType || !bill?.referenceId) return;

        const referenceType = bill.referenceType;
        const referenceId = bill.referenceId;

        if (referenceType === 'WalletDeposit') {
            router.push(`/wallet/default/deposits/${referenceId}`);
        } else if (referenceType === 'TourReservation') {
            router.push(`/tours/reservations/${referenceId}`);
        }
    };

    // Check if we can navigate to reference
    const canNavigateToReference = () => {
        const bill = paymentData?.bill;
        return !!(bill?.referenceType && bill?.referenceId && 
                  (bill.referenceType === 'WalletDeposit' || bill.referenceType === 'TourReservation'));
    };

    const getReferenceButtonText = () => {
        const bill = paymentData?.bill;
        if (bill?.referenceType === 'WalletDeposit') {
            return 'مشاهده واریز';
        } else if (bill?.referenceType === 'TourReservation') {
            return 'مشاهده رزرو';
        }
        return 'مشاهده جزئیات';
    };

    if (isLoading || !paymentData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <PageHeader
                    title="رسید پرداخت"
                    titleIcon={<PiXCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                    showBackButton
                    onBack={handleDashboard}
                />
                <div className="p-4 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
            <div className="h-full flex flex-col" dir="rtl">
                {/* Header */}
                <PageHeader
                    title="رسید پرداخت ناموفق"
                    titleIcon={<PiXCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                    showBackButton
                    onBack={handleDashboard}
                />

                {/* Scrollable Content */}
                <ScrollableArea className="flex-1" hideScrollbar={true}>
                    <div className="p-4 space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow">
                            <div className="flex justify-center mb-3">
                                <PiXCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                                پرداخت ناموفق
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                پرداخت شما انجام نشد. لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.
                            </p>

                            {/* Payment Info */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-right space-y-3">
                                <InfoRow label="کد پرداخت" value={paymentData.paymentId} />
                                <InfoRow label="کد پیگیری" value={paymentData.gatewayReference || '—'} />
                                <InfoRow label="مبلغ پرداخت" value={`${formatCurrencyFa(paymentData.amountRials)} ریال`} />
                                <InfoRow label="روش پرداخت" value={paymentData.methodText || '—'} />
                                <InfoRow label="درگاه پرداخت" value={paymentData.gatewayText || '—'} />
                                <InfoRow label="زمان تلاش پرداخت" value={formatDateFa(paymentData.createdAt)} />
                                <InfoRow label="علت خطا" value={paymentData.failureReason || 'نامشخص'} />
                            </div>
                        </div>
                    </div>
                </ScrollableArea>

                {/* Sticky Footer */}
                <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10">
                    <div className="flex gap-3">
                        {canNavigateToReference() && (
                            <Button
                                variant="solid"
                                onClick={handleNavigateToReference}
                                leftIcon={<PiArrowLeft className="h-5 w-5" />}
                                className="flex-1 py-3 text-base font-medium"
                            >
                                {getReferenceButtonText()}
                            </Button>
                        )}

                        <Button
                            variant={canNavigateToReference() ? "solid" : "outline"}
                            color={canNavigateToReference() ? "secondary" : "primary"}
                            onClick={printReceipt}
                            leftIcon={<PiReceipt className="h-4 w-4" />}
                            className="flex-1 py-3 text-base font-medium"
                        >
                            صورت حساب
                        </Button>
                        
                        <Button
                            variant="subtle"
                            onClick={handleDashboard}
                            className="flex-1 py-3 text-base font-medium"
                        >
                            داشبورد
                        </Button>
                    </div>
                </div>
            </div>
    );
}

// ===== Reusable Info Row =====
function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
        {value ?? '—'}
      </span>
        </div>
    );
}
