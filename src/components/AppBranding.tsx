'use client';

import { PiSparkle } from 'react-icons/pi';

// Company information
export const companyInfo = {
  name: 'سازمان نظام مهندسی ساختمان آذربایجان غربی',
  description: 'پلتفرم جامع رفاهی و گردشگری ',
  tagline: '© ۲۰۲۵ گروه نرم‌افزاری بنیان — کلیه حقوق محفوظ است.',
  version: 'نسخه ۲.۱.۰',
  company: 'گروه نرم‌افزاری بنیان'
};

export function AppBranding() {
  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Simple Title and Description */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl mb-4 shadow-lg">
          <PiSparkle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {companyInfo.name}
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          {companyInfo.description}
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {companyInfo.tagline}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {companyInfo.company}
        </div>
      </div>
    </div>
  );
}
