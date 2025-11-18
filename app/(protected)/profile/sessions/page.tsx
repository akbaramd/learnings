'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useGetSessionsPaginatedQuery,
  useLogoutBySessionIdMutation,
} from '@/src/store/auth/auth.queries';
import { getDeviceId } from '@/src/lib/deviceInfo';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { PageHeader } from '@/src/components/ui/PageHeader/PageHeader';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { InputField } from '@/src/components/forms/InputField';
import { useToast } from '@/src/hooks/useToast';
import { SessionDto } from '@/src/store/auth/auth.types';
import {
  PiDeviceMobile,
  PiGlobe,
  PiClock,
  PiCheckCircle,
  PiXCircle,
  PiArrowClockwise,
  PiTrash,
  PiMagnifyingGlass,
  PiX,
  PiFunnel,
  PiInfo,
  PiQuestion,
  PiCheckSquare,
  PiSquare,
} from 'react-icons/pi';

function formatRelativeFa(date: Date | string | null) {
  if (!date) return 'نامشخص';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'نامشخص';
    
    const diff = Date.now() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'هم‌اکنون';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    return `${days} روز پیش`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'نامشخص';
  }
}

function getStatusInfo(session: SessionDto) {
  if (session.isRevoked) {
    return {
      icon: PiXCircle,
      text: 'لغو شده',
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-100 dark:bg-red-900/40',
      borderColor: 'border-red-300 dark:border-red-700',
      ariaLabel: 'وضعیت: لغو شده',
      tooltip: 'این نشست توسط شما یا مدیر سیستم لغو شده است'
    };
  }
  if (session.isExpired) {
    return {
      icon: PiClock,
      text: 'منقضی شده',
      color: 'text-gray-700 dark:text-gray-200',
      bgColor: 'bg-gray-100 dark:bg-gray-800/50',
      borderColor: 'border-gray-300 dark:border-gray-600',
      ariaLabel: 'وضعیت: منقضی شده',
      tooltip: 'این نشست به دلیل عدم استفاده منقضی شده است'
    };
  }
  if (session.isActive) {
    return {
      icon: PiCheckCircle,
      text: 'فعال',
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-100 dark:bg-green-900/40',
      borderColor: 'border-green-300 dark:border-green-700',
      ariaLabel: 'وضعیت: فعال',
      tooltip: 'این نشست در حال حاضر فعال است و می‌تواند به حساب کاربری دسترسی داشته باشد'
    };
  }
  return {
    icon: PiClock,
    text: 'نامشخص',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-700',
    ariaLabel: 'وضعیت: نامشخص',
    tooltip: 'وضعیت این نشست مشخص نیست'
  };
}

function SessionCard({ 
  session, 
  isCurrentDevice,
  onDelete,
  isDeleting,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
}: { 
  session: SessionDto; 
  isCurrentDevice: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onLongPress: () => void;
}) {
  const statusInfo = getStatusInfo(session);
  const canDelete = !isCurrentDevice && session.isActive && !session.isRevoked && !session.isExpired;
  const canSelect = canDelete || (!isCurrentDevice && (session.isExpired || session.isRevoked));
  
  // Long press handler
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleMouseDown = useCallback(() => {
    if (!isSelectionMode && canSelect) {
      const timer = setTimeout(() => {
        onLongPress();
      }, 500); // 500ms for long press
      setLongPressTimer(timer);
    }
  }, [isSelectionMode, canSelect, onLongPress]);
  
  const handleMouseUp = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);
  
  const handleMouseLeave = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Determine card styling based on selection mode and selectability
  const getCardClassName = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    if (isSelectionMode) {
      if (!canSelect) {
        // Non-selectable items in selection mode: grayed out
        return `${baseClasses} opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600`;
      }
      if (isSelected) {
        // Selected items: green ring and background
        return `${baseClasses} cursor-pointer ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-700`;
      }
      // Selectable but not selected: normal border
      return `${baseClasses} cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`;
    }
    
    // Normal mode (not in selection)
    if (isCurrentDevice) {
      return `${baseClasses} hover:shadow-md hover:scale-[1.01] border-2 border-emerald-500 dark:border-emerald-400 shadow-emerald-100 dark:shadow-emerald-900/20`;
    }
    return `${baseClasses} hover:shadow-md hover:scale-[1.01] border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`;
  };

  return (
    <Card
      variant="default"
      radius="lg"
      padding="md"
      className={getCardClassName()}
      onMouseDown={canSelect && !isSelectionMode ? handleMouseDown : undefined}
      onMouseUp={canSelect && !isSelectionMode ? handleMouseUp : undefined}
      onMouseLeave={canSelect && !isSelectionMode ? handleMouseLeave : undefined}
      onClick={isSelectionMode && canSelect ? onToggleSelect : undefined}
    >
      <div className="space-y-3">
        {/* Header: Checkbox (if selection mode) or Device Icon, Device ID and Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Checkbox in selection mode */}
            {isSelectionMode && canSelect ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect();
                }}
                className="flex-shrink-0 p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={isSelected ? 'لغو انتخاب' : 'انتخاب نشست'}
                title={isSelected ? 'لغو انتخاب' : 'انتخاب نشست'}
              >
                {isSelected ? (
                  <PiCheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <PiSquare className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
              </button>
            ) : (
              <PiDeviceMobile 
                className={`h-4 w-4 flex-shrink-0 ${isCurrentDevice ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-semibold truncate ${
                isSelectionMode && !canSelect 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : isCurrentDevice 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-gray-900 dark:text-gray-100'
              }`}>
                {isCurrentDevice ? 'دستگاه فعلی' : (session.deviceId || 'دستگاه ناشناس')}
              </div>
            </div>
          </div>
          <div 
            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 transition-colors duration-200 ${
              isSelectionMode && !canSelect 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                : `${statusInfo.bgColor} ${statusInfo.color}`
            }`}
            role="status"
            aria-label={statusInfo.ariaLabel}
            title={statusInfo.tooltip}
          >
            {React.createElement(statusInfo.icon, { 
              className: `h-3 w-3 ${isSelectionMode && !canSelect ? 'text-gray-500 dark:text-gray-400' : ''}`, 
              'aria-hidden': true 
            })}
            <span className="font-medium">{statusInfo.text}</span>
          </div>
        </div>

        {/* User Agent */}
        {session.userAgent && (
          <div className={`text-xs flex items-start gap-2 ${
            isSelectionMode && !canSelect 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            <span className="font-medium flex-shrink-0">مرورگر:</span>
            <span className={`break-words flex-1 ${
              isSelectionMode && !canSelect 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-500'
            }`} title={session.userAgent}>
              {session.userAgent.length > 60 
                ? session.userAgent.substring(0, 60) + '...' 
                : session.userAgent
              }
            </span>
          </div>
        )}

        {/* IP Address */}
        {session.ipAddress && (
          <div className={`flex items-center gap-2 text-xs ${
            isSelectionMode && !canSelect 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            <PiGlobe className={`h-3.5 w-3.5 flex-shrink-0 ${
              isSelectionMode && !canSelect 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-400'
            }`} aria-hidden="true" />
            <span className="font-medium flex-shrink-0">آدرس IP:</span>
            <span className={`font-mono ${
              isSelectionMode && !canSelect 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-500'
            }`}>{session.ipAddress}</span>
          </div>
        )}

        {/* Last Activity */}
        {session.lastActivityAt && (
          <div className={`flex items-center gap-2 text-xs ${
            isSelectionMode && !canSelect 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            <PiClock className={`h-3.5 w-3.5 flex-shrink-0 ${
              isSelectionMode && !canSelect 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-400'
            }`} aria-hidden="true" />
            <span className="font-medium flex-shrink-0">آخرین فعالیت:</span>
            <span className={
              isSelectionMode && !canSelect 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-500'
            }>{formatRelativeFa(session.lastActivityAt)}</span>
          </div>
        )}

        {/* Delete Button for non-current devices (only in non-selection mode) */}
        {canDelete && !isSelectionMode && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="subtle"
              color="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              loading={isDeleting}
              loadingText="در حال حذف..."
              disabled={isDeleting}
              leftIcon={!isDeleting && <PiTrash className="h-3.5 w-3.5" />}
              className="w-full text-xs"
              aria-label="حذف این نشست"
              title="حذف این نشست باعث قطع دسترسی این دستگاه به حساب کاربری شما می‌شود"
            >
              {isDeleting ? 'در حال حذف...' : 'حذف نشست'}
            </Button>
          </div>
        )}

        {/* Current Device Indicator */}
        {isCurrentDevice && (
          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <PiCheckCircle className="h-4 w-4" />
              <span>شما در حال حاضر از این دستگاه استفاده می‌کنید</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SessionsPage() {
  const router = useRouter();
  // Get current device ID on mount (using useState initializer to avoid setState in effect)
  const [currentDeviceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return getDeviceId();
    }
    return null;
  });
  const [pageNumber, setPageNumber] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');
  const [showHelp, setShowHelp] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] = useState(false);
  const { success, error: showError } = useToast();
  const pageSize = 10;

  const { data, isLoading, error, refetch } = useGetSessionsPaginatedQuery({
    pageNumber,
    pageSize,
  });

  // Logout mutation
  const [logoutBySessionId, { isLoading: isLoggingOutSession }] = useLogoutBySessionIdMutation();

  const totalCount = data?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasError = error !== undefined && error !== null;

  // Memoize all sessions to prevent unnecessary re-renders
  const allSessions = useMemo(() => data?.data?.items || [], [data?.data?.items]);

  // Filter sessions based on search query and status filter
  const sessions = useMemo(() => {
    let filtered = allSessions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => {
        if (statusFilter === 'active') return session.isActive && !session.isRevoked && !session.isExpired;
        if (statusFilter === 'expired') return session.isExpired;
        if (statusFilter === 'revoked') return session.isRevoked;
        return true;
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(session => {
        const deviceId = (session.deviceId || '').toLowerCase();
        const userAgent = (session.userAgent || '').toLowerCase();
        const ipAddress = (session.ipAddress || '').toLowerCase();
        
        return deviceId.includes(normalizedQuery) ||
               userAgent.includes(normalizedQuery) ||
               ipAddress.includes(normalizedQuery);
      });
    }

    return filtered;
  }, [allSessions, searchQuery, statusFilter]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDeleteClick = useCallback((session: SessionDto) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async (confirmed: boolean) => {
    setDeleteDialogOpen(false);
    
    if (!confirmed || !sessionToDelete?.id) {
      setSessionToDelete(null);
      return;
    }

    try {
      await logoutBySessionId({ sessionId: sessionToDelete.id }).unwrap();
      setSessionToDelete(null);
      // Show success toast
      success('نشست با موفقیت حذف شد', 'دسترسی این دستگاه به حساب کاربری شما قطع شد');
      // Refetch sessions list
      await refetch();
    } catch (err) {
      console.error('[Sessions] Error logging out session:', err);
      setSessionToDelete(null);
      // Show error toast
      showError('خطا در حذف نشست', 'لطفاً دوباره تلاش کنید');
    }
  }, [sessionToDelete, logoutBySessionId, refetch, success, showError]);

  // Selection mode handlers
  const handleLongPress = useCallback(() => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
  }, [isSelectionMode]);

  const handleToggleSelect = useCallback((sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const selectableSessions = sessions.filter(s => {
      if (!s.id) return false; // Skip sessions without ID
      const isCurrent = s.deviceId === currentDeviceId;
      const canDelete = !isCurrent && s.isActive && !s.isRevoked && !s.isExpired;
      return canDelete || (!isCurrent && (s.isExpired || s.isRevoked));
    });
    
    if (selectedSessions.size === selectableSessions.length) {
      // Deselect all
      setSelectedSessions(new Set());
    } else {
      // Select all (filter out undefined IDs)
      setSelectedSessions(new Set(selectableSessions.map(s => s.id).filter((id): id is string => !!id)));
    }
  }, [sessions, currentDeviceId, selectedSessions]);

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedSessions(new Set());
  }, []);

  const handleDeleteMultipleClick = useCallback(() => {
    if (selectedSessions.size > 0) {
      setDeleteMultipleDialogOpen(true);
    }
  }, [selectedSessions]);

  const handleDeleteMultipleConfirm = useCallback(async (confirmed: boolean) => {
    setDeleteMultipleDialogOpen(false);
    
    if (!confirmed || selectedSessions.size === 0) {
      return;
    }

    try {
      // Delete all selected sessions sequentially
      const sessionIds = Array.from(selectedSessions);
      let successCount = 0;
      let failCount = 0;

      for (const sessionId of sessionIds) {
        try {
          await logoutBySessionId({ sessionId }).unwrap();
          successCount++;
        } catch (err) {
          console.error('[Sessions] Error deleting session:', sessionId, err);
          failCount++;
        }
      }

      // Clear selection and exit selection mode
      setSelectedSessions(new Set());
      setIsSelectionMode(false);

      // Show result toast
      if (successCount > 0 && failCount === 0) {
        success(
          `${successCount} نشست با موفقیت حذف شد`,
          'دسترسی دستگاه‌های انتخاب شده قطع شد'
        );
      } else if (successCount > 0 && failCount > 0) {
        showError(
          'حذف جزئی',
          `${successCount} نشست حذف شد، ${failCount} نشست با خطا مواجه شد`
        );
      } else {
        showError('خطا در حذف نشست‌ها', 'لطفاً دوباره تلاش کنید');
      }

      // Refetch sessions list
      await refetch();
    } catch (err) {
      console.error('[Sessions] Error in bulk delete:', err);
      showError('خطا در حذف نشست‌ها', 'لطفاً دوباره تلاش کنید');
    }
  }, [selectedSessions, logoutBySessionId, refetch, success, showError]);

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInSlide 0.3s ease-out forwards;
        }
      `}</style>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <PageHeader
        title={isSelectionMode ? `${selectedSessions.size} مورد انتخاب شده` : "دستگاه‌ها و نشست‌ها"}
        titleIcon={<PiDeviceMobile className="h-5 w-5" />}
        showBackButton={!isSelectionMode}
        onBack={isSelectionMode ? handleExitSelectionMode : handleBack}
        rightActions={isSelectionMode ? [
          {
            icon: <PiX className="h-4 w-4" />,
            onClick: handleExitSelectionMode,
            label: 'لغو',
            'aria-label': 'خروج از حالت انتخاب',
          },
        ] : [
          {
            icon: <PiQuestion className="h-4 w-4" />,
            onClick: () => setShowHelp(!showHelp),
            label: showHelp ? 'بستن راهنما' : 'راهنما',
            'aria-label': showHelp ? 'بستن راهنما' : 'نمایش راهنما',
          },
          {
            icon: <PiArrowClockwise className={`h-4 w-4 transition-transform duration-300 ${isLoading ? 'animate-spin' : ''}`} />,
            onClick: handleRefresh,
            label: 'بروزرسانی',
            disabled: isLoading,
            'aria-label': 'بروزرسانی',
          },
        ]}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-3">
          {/* Selection Mode Info Bar */}
          {isSelectionMode && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiCheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  {selectedSessions.size} نشست انتخاب شده
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedSessions.size === sessions.filter(s => {
                    const isCurrent = s.deviceId === currentDeviceId;
                    const canDelete = !isCurrent && s.isActive && !s.isRevoked && !s.isExpired;
                    return canDelete || (!isCurrent && (s.isExpired || s.isRevoked));
                  }).length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filter Section */}
          {!isSelectionMode && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <PiMagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <InputField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی دستگاه، IP یا مرورگر..."
                  className="pr-10"
                  dir="rtl"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="flex-shrink-0"
                  aria-label="پاک کردن جستجو"
                  title="پاک کردن جستجو"
                >
                  <PiX className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <PiFunnel className="h-3.5 w-3.5" />
                <span className="font-medium">فیلتر وضعیت:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'active', 'expired', 'revoked'] as const).map((filter) => {
                  const labels = {
                    all: 'همه',
                    active: 'فعال',
                    expired: 'منقضی شده',
                    revoked: 'لغو شده',
                  };
                  const isActive = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200
                        ${isActive
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900 shadow-sm'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                      aria-label={`فیلتر: ${labels[filter]}`}
                      title={`نمایش فقط نشست‌های ${labels[filter]}`}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert">
              <div className="flex items-start gap-2">
                <PiXCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    خطا در بارگذاری نشست‌ها
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                    لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.
                  </p>
                  <Button
                    variant="outline"
                    color="accent"
                    size="sm"
                    onClick={handleRefresh}
                    className="text-xs"
                  >
                    تلاش مجدد
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {!isLoading && (searchQuery || statusFilter !== 'all') && (
            <div className="flex items-center justify-between px-1">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {sessions.length > 0 
                  ? `${sessions.length} نشست ${searchQuery ? 'یافت شد' : 'نمایش داده می‌شود'}`
                  : 'نتیجه‌ای یافت نشد'
                }
              </div>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  title="پاک کردن همه فیلترها"
                >
                  پاک کردن فیلترها
                </button>
              )}
            </div>
          )}

          {/* Help Section */}
          {showHelp && (
            <Card variant="default" radius="lg" padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <PiInfo className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    راهنمای استفاده
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>دستگاه فعلی شما با <strong className="text-emerald-700 dark:text-emerald-300">حاشیه سبز</strong> مشخص شده است</li>
                    <li>برای حذف یک نشست، روی دکمه <strong>&quot;حذف نشست&quot;</strong> کلیک کنید</li>
                    <li>پس از حذف، دسترسی آن دستگاه به حساب کاربری شما قطع می‌شود</li>
                    <li>می‌توانید از فیلترها برای نمایش نشست‌های خاص استفاده کنید</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  aria-label="بستن راهنما"
                >
                  <PiX className="h-4 w-4" />
                </button>
              </div>
            </Card>
          )}

          {/* Sessions List */}
          {isLoading ? (
            <Card variant="default" radius="lg" padding="lg">
              <div className="text-center py-6">
                <div className="h-8 w-8 animate-spin border-2 border-emerald-300 border-t-emerald-600 rounded-full mx-auto mb-3" role="status" aria-label="در حال بارگذاری" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  در حال بارگذاری نشست‌ها...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  لطفاً صبر کنید
                </p>
              </div>
            </Card>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="opacity-0 animate-fade-in"
                  style={{ 
                    animation: `fadeInSlide 0.3s ease-out forwards`,
                    animationDelay: `${index * 50}ms` 
                  }}
                >
                  <SessionCard
                    session={session}
                    isCurrentDevice={session.deviceId === currentDeviceId}
                    onDelete={() => handleDeleteClick(session)}
                    isDeleting={isLoggingOutSession && sessionToDelete?.id === session.id}
                    isSelectionMode={isSelectionMode}
                    isSelected={session.id ? selectedSessions.has(session.id) : false}
                    onToggleSelect={() => session.id && handleToggleSelect(session.id)}
                    onLongPress={handleLongPress}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card variant="default" radius="lg" padding="lg">
            <div className="text-center py-8">
              <PiDeviceMobile className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {searchQuery ? 'نتیجه‌ای یافت نشد' : 'هیچ نشستی یافت نشد'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery 
                  ? 'لطفاً عبارت جستجوی خود را تغییر دهید'
                  : 'در حال حاضر هیچ نشست فعالی در سیستم ثبت نشده است'
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs"
                >
                  پاک کردن جستجو
                </Button>
              )}
            </div>
            </Card>
          )}

          {/* Pagination */}
          {!isLoading && !searchQuery && allSessions && allSessions.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber === 1 || isLoading}
                className="text-xs"
                aria-label="صفحه قبلی"
              >
                قبلی
              </Button>
              
              <span className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                صفحه {pageNumber} از {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                disabled={pageNumber === totalPages || isLoading}
                className="text-xs"
                aria-label="صفحه بعدی"
              >
                بعدی
              </Button>
            </div>
          )}

        </div>
      </ScrollableArea>

      {/* Sticky Delete Button (when in selection mode) */}
      {isSelectionMode && selectedSessions.size > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedSessions.size} نشست انتخاب شده
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitSelectionMode}
                className="text-xs"
              >
                لغو
              </Button>
              <Button
                variant="solid"
                color="danger"
                size="sm"
                onClick={handleDeleteMultipleClick}
                disabled={isLoggingOutSession}
                loading={isLoggingOutSession}
                loadingText="در حال حذف..."
                leftIcon={!isLoggingOutSession && <PiTrash className="h-4 w-4" />}
                className="text-xs"
              >
                حذف ({selectedSessions.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Session Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteConfirm}
        title="حذف نشست"
        variant="danger"
        confirmText="حذف"
        cancelText="لغو"
        isLoading={isLoggingOutSession}
      >
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>آیا از حذف این نشست اطمینان دارید؟</p>
          {sessionToDelete && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-1 text-xs">
              <div><span className="font-medium">شناسه دستگاه:</span> {sessionToDelete.deviceId || 'نامشخص'}</div>
              {sessionToDelete.ipAddress && (
                <div><span className="font-medium">آدرس IP:</span> {sessionToDelete.ipAddress}</div>
              )}
              {sessionToDelete.userAgent && (
                <div className="truncate">
                  <span className="font-medium">مرورگر:</span> {sessionToDelete.userAgent}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            پس از حذف، این نشست دیگر قادر به دسترسی به حساب کاربری شما نخواهد بود.
          </p>
        </div>
      </ConfirmDialog>

      {/* Delete Multiple Sessions Confirmation Dialog */}
      <ConfirmDialog
        open={deleteMultipleDialogOpen}
        onClose={handleDeleteMultipleConfirm}
        title="حذف نشست‌های انتخاب شده"
        variant="danger"
        confirmText={`حذف ${selectedSessions.size} نشست`}
        cancelText="لغو"
        isLoading={isLoggingOutSession}
      >
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>آیا از حذف {selectedSessions.size} نشست انتخاب شده اطمینان دارید؟</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            پس از حذف، دسترسی تمام دستگاه‌های انتخاب شده به حساب کاربری شما قطع می‌شود.
          </p>
        </div>
      </ConfirmDialog>
    </div>
    </>
  );
}

