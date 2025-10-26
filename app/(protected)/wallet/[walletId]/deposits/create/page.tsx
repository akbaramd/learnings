'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyWallets } from '@/src/hooks/useLazyWallets';
import { InputField } from '@/src/components/forms/InputField';
import { TextAreaField } from '@/src/components/forms/TextAreaField';
import { Button } from '@/src/components/ui/Button';
import {
  PiArrowLeft,
  PiPlusCircle,
} from 'react-icons/pi';

interface CreateDepositPageProps {
  params: Promise<{
    walletId?: string;
  }>;
}

export default function CreateDepositPage({ params }: CreateDepositPageProps) {
  const router = useRouter();
  const { walletId } = use(params);
  const { createDeposit } = useLazyWallets();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [validation, setValidation] = useState({
    amount: 'default' as 'default' | 'success' | 'danger' | 'typing'
  });

  // Handle case where walletId might be undefined
  const currentWalletId = walletId || 'default';

  const handleBack = () => {
    router.push(`/wallet/${currentWalletId}/deposits`);
  };

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    
    if (!value || value.trim() === '') {
      return 'default';
    }
    
    if (isNaN(numValue)) {
      return 'danger';
    }
    
    if (numValue < 1000000) {
      return 'danger';
    }
    
    if (numValue > 500000000) {
      return 'danger';
    }
    
    return 'success';
  };

  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Split by decimal point
    const parts = numericValue.split('.');
    
    // Format the integer part with commas
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // Join back with decimal point if exists
    return parts.join('.');
  };

  const parseCurrency = (value: string) => {
    // Remove commas and return clean number
    return value.replace(/,/g, '');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleanValue = parseCurrency(rawValue);
    
    // Update form data with clean numeric value
    setFormData({ ...formData, amount: cleanValue });
    
    // Set typing state briefly, then validate
    setValidation({ ...validation, amount: 'typing' });
    
    // Debounce validation
    setTimeout(() => {
      const validationStatus = validateAmount(cleanValue);
      setValidation({ ...validation, amount: validationStatus });
    }, 300);
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    // Validate amount
    if (!formData.amount || formData.amount.trim() === '') {
      setError('لطفاً مبلغ واریز را وارد کنید');
      setValidation({ ...validation, amount: 'danger' });
      return;
    }
    
    if (isNaN(amount)) {
      setError('مبلغ وارد شده نامعتبر است');
      setValidation({ ...validation, amount: 'danger' });
      return;
    }
    
    if (amount < 1000000) {
      setError('مبلغ واریز باید حداقل ۱,۰۰۰,۰۰۰ ریال باشد');
      setValidation({ ...validation, amount: 'danger' });
      return;
    }
    
    if (amount > 500000000) {
      setError('مبلغ واریز نمی‌تواند بیشتر از ۵۰۰,۰۰۰,۰۰۰ ریال باشد');
      setValidation({ ...validation, amount: 'danger' });
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      await createDeposit({
        walletId: currentWalletId,
        amount: amount,
        description: formData.description || undefined
      });
      
      // Navigate back to deposits page
      router.push(`/wallet/${currentWalletId}/deposits`);
    } catch (error) {
      console.error('Failed to create deposit:', error);
      setError('خطا در ایجاد واریز جدید');
    } finally {
      setIsCreating(false);
    }
  };

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
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
        {/* Breadcrumb Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <PiArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <PiPlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">واریز جدید</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {currentWalletId.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Create Deposit Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  واریز جدید
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  مبلغ مورد نظر خود را وارد کنید تا واریز جدیدی ایجاد شود
                </p>
              </div>
              
              <form onSubmit={handleCreateDeposit} className="space-y-6">
                 <InputField
                   type="text"
                   label="مبلغ واریز (ریال)"
                   value={formData.amount ? formatCurrency(formData.amount) : ''}
                   onChange={handleAmountChange}
                   placeholder="مبلغ مورد نظر را وارد کنید"
                   required
                   variant="outline"
                   size="lg"
                   status={validation.amount}
                   description="حداقل مبلغ ۱,۰۰۰,۰۰۰ ریال و حداکثر ۵۰۰,۰۰۰,۰۰۰ ریال"
                 />
                
                <TextAreaField
                  label="توضیحات (اختیاری)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات واریز..."
                  rows={4}
                  variant="outline"
                  size="lg"
                  description="این توضیحات در تاریخچه واریزها نمایش داده می‌شود"
                />

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Information Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                نکات مهم
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• واریز شما پس از تایید در کیف پول شما اعمال خواهد شد</li>
                <li>• کد پیگیری برای هر واریز صادر می‌شود</li>
                <li>• وضعیت واریز در صفحه واریزها قابل مشاهده است</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 py-2">
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isCreating}
              loadingText="در حال ایجاد..."
              leftIcon={!isCreating ? <PiPlusCircle className="h-5 w-5" /> : undefined}
              className="flex-1 py-3 text-base font-medium"
              disabled={validation.amount !== 'success' || isCreating}
              onClick={handleCreateDeposit}
            >
              ایجاد واریز
            </Button>
            
            <Button
              type="button"
              onClick={handleBack}
              variant="ghost"
              size="lg"
              className="flex-1 py-3 text-base font-medium"
            >
              لغو
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
