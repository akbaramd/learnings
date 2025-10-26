'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useToast } from '@/src/hooks/useToast';
import {
  PiMagnifyingGlass,
  PiReceipt,
} from 'react-icons/pi';

export default function BillsPage() {
  const router = useRouter();
  const { error } = useToast();
  const [trackingCode, setTrackingCode] = useState('');

  const handleSearch = () => {
    if (!trackingCode.trim()) {
      error('لطفاً کد پیگیری را وارد کنید');
      return;
    }

    // Navigate to the dynamic route with tracking code
    router.push(`/bills/${encodeURIComponent(trackingCode.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="p-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <PiReceipt className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                جستجوی صورت حساب با کد پیگیری
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                کد پیگیری صورت حساب خود را وارد کنید
              </p>
            </div>

            <div className="space-y-3">
              <InputField
                label="کد پیگیری"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="کد پیگیری را وارد کنید"
                autoFocus
              />

              <Button
                onClick={handleSearch}
                disabled={!trackingCode.trim()}
                className="w-full"
                size="lg"
              >
                <div className="flex items-center gap-2">
                  <PiMagnifyingGlass className="h-4 w-4" />
                  جستجو
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
