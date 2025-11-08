'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PiSpinner } from "react-icons/pi";

export default function Home() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    "در حال بارگذاری...",
    "در حال آماده‌سازی محیط...",
    "لطفاً صبر کنید...",
  ];

  useEffect(() => {
    // Cycle through loading messages faster
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);

    // Redirect to dashboard quickly (2 seconds)
    const redirectTimeout = setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(redirectTimeout);
    };
  }, [router, loadingMessages.length]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" dir="rtl">
      <div className="flex flex-col items-center justify-center space-y-6 px-4">
        {/* Logo/Brand Area */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center">
              <span className="text-heading-1 text-white">س</span>
            </div>
          </div>
          
          <h1 className="text-heading-1 text-gray-900 dark:text-gray-100 text-center">
            سامانه خدمات رفاهی
          </h1>
        </div>

        {/* Loading Spinner */}
        <div className="flex flex-col items-center space-y-4">
          <PiSpinner className="h-12 w-12 animate-spin text-emerald-600 dark:text-emerald-400" />
          
          {/* Loading Message */}
          <div className="flex flex-col items-center space-y-2">
            <p className="text-body text-gray-700 dark:text-gray-300 text-center min-h-[20px]">
              {loadingMessages[messageIndex]}
            </p>
            
            {/* Progress Dots */}
            <div className="flex items-center flex-row-reverse gap-2">
              {loadingMessages.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    index === messageIndex
                      ? 'bg-emerald-600 dark:bg-emerald-400 w-6 h-2'
                      : 'bg-gray-300 dark:bg-gray-600 w-2 h-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-caption text-gray-500 dark:text-gray-400 text-center">
            © ۱۴۰۳ سامانه خدمات رفاهی
          </p>
        </div>
      </div>
    </div>
  );
}
