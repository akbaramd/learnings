'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { TourCard, TourCardSkeleton, Tour } from '@/src/components/tours/TourCard';
import { useGetToursPaginatedQuery } from '@/src/store/tours/tours.queries';
import { selectToursItems, selectToursPagination, selectToursIsLoading, selectToursError } from '@/src/store/tours';
import { buildImageUrl } from '@/src/config/env';
import {
  PiArrowRight,
  PiArrowLeft,
  PiMagnifyingGlass,
  PiArrowClockwise,
  PiMapPinDuotone,
} from 'react-icons/pi';

function formatCurrencyFa(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) return '۰';
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch {
    return String(amount ?? 0);
  }
}

export default function ToursPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(true);
  const pageSize = 12;

  const { data, isLoading, isError, refetch } = useGetToursPaginatedQuery({
    pageNumber: currentPage,
    pageSize,
    search: searchTerm || undefined,
    isActive: isActiveFilter,
  });

  const tours = useSelector(selectToursItems);
  const pagination = useSelector(selectToursPagination);
  const isLoadingState = useSelector(selectToursIsLoading);
  const error = useSelector(selectToursError);

  // Map tours to Tour type
  const mappedTours: Tour[] = useMemo(() => {
    return tours.map((t) => ({
      id: t.id || '',
      title: t.title || 'بدون عنوان',
      description: t.title ?? '',
      photos: t.photos?.map((p) => (p.url ? buildImageUrl(p.url) : '')) ?? [],
      isRegistrationOpen: t.isRegistrationOpen ?? false,
      isFullyBooked: t.isFullyBooked ?? false,
      isNearlyFull: t.isNearlyFull ?? false,
      difficultyLevel: 1,
      price: t.pricing?.[0]?.effectivePriceRials ?? t.lowestPriceRials ?? 0,
      registrationStart: t.registrationStart ?? '',
      registrationEnd: t.registrationEnd ?? '',
      tourStart: t.tourStart ?? '',
      tourEnd: t.tourEnd ?? '',
      maxCapacity: t.maxCapacity ?? 0,
      remainingCapacity: t.remainingCapacity ?? 0,
      reservationId: t.reservation?.id ?? null,
      reservationStatus: t.reservation?.status ?? null,
      gender: t.gender ?? null,
      genderText: t.genderText ?? null,
    }));
  }, [tours]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: boolean | undefined) => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleBack = () => {
    router.push('/dashboard');
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
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="تور و رویدادها"
          titleIcon={<PiMapPinDuotone className="h-5 w-5" />}
          subtitle={`${pagination?.totalCount || 0} تور و رویداد`}
          showBackButton
          onBack={handleBack}
          rightActions={[
            {
              icon: <PiArrowClockwise className={`h-4 w-4 ${isLoadingState ? 'animate-spin' : ''}`} />,
              onClick: handleRefresh,
              label: 'بروزرسانی',
              disabled: isLoadingState,
              'aria-label': 'بروزرسانی',
            },
          ]}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <PiMagnifyingGlass className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="جستجوی تور..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pr-10 pl-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange(undefined)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActiveFilter === undefined
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  همه
                </button>
                <button
                  onClick={() => handleFilterChange(true)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActiveFilter === true
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  فعال
                </button>
                <button
                  onClick={() => handleFilterChange(false)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActiveFilter === false
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  غیرفعال
                </button>
              </div>
            </div>

            {/* Error Message */}
            {(error || isError) && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <span className="text-sm font-medium">{error || 'خطا در دریافت لیست تورها'}</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoadingState && mappedTours.length === 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <TourCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Tours Grid */}
            {!isLoadingState && mappedTours.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {mappedTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingState && mappedTours.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PiMapPinDuotone className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  توری یافت نشد
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchTerm
                    ? 'نتیجه‌ای برای جستجوی شما یافت نشد'
                    : 'در حال حاضر توری موجود نیست'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || isLoadingState}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PiArrowRight className="h-4 w-4" />
                  قبلی
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoadingState}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-emerald-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {formatCurrencyFa(pageNum)}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage || isLoadingState}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  بعدی
                  <PiArrowLeft className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

