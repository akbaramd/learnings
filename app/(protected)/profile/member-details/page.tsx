'use client';

import { useRouter } from 'next/navigation';
import { useGetCurrentMemberQuery } from '@/src/store/members';
import { useAuth } from '@/src/hooks/useAuth';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PageHeader } from '@/src/components/ui/PageHeader';
import {
  PiUser,
  PiEnvelope,
  PiPhone,
  PiSpinner,
  PiXCircle,
  PiStar,
  PiBuildings,
  PiKey,
  PiIdentificationCard,
} from 'react-icons/pi';

// Types for capability, feature, and agency list items
interface CapabilityListItem {
  id?: string;
  title?: string | null;
}

interface FeatureListItem {
  id?: string;
  title?: string | null;
}

interface AgencyListItem {
  id?: string;
  title?: string | null;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null;
  
  const displayValue = typeof value === 'string' ? value : String(value || '');
  
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{displayValue}</div>
      </div>
    </div>
  );
}

function ListSection<T>({ 
  title, 
  items, 
  getLabel, 
  getValue,
  icon 
}: { 
  title: string; 
  items: T[] | null | undefined; 
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  icon: React.ReactNode;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent border border-emerald-100 dark:border-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800/30 transition-colors"
          >
            <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{getLabel(item)}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                {getValue(item)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberDetailsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: memberData, isLoading: isLoadingMember, error: memberError } = useGetCurrentMemberQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  
  const member = memberData?.data;
  const hasError = !!memberError;

  const handleBack = () => {
    router.push('/profile');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PageHeader
        title="اطلاعات عضو"
        titleIcon={<PiUser className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-4">
          {/* Loading State */}
          {isLoadingMember && (
            <div className="flex items-center justify-center gap-3 py-12">
              <PiSpinner className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">در حال بارگذاری اطلاعات عضو...</span>
            </div>
          )}

          {/* Error State */}
          {hasError && !isLoadingMember && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <PiXCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800 dark:text-red-200">
                    خطا در دریافت اطلاعات عضو
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    لطفاً دوباره تلاش کنید
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Member Information */}
          {!isLoadingMember && member && (
            <div className="space-y-4">
              {/* Profile Header Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/30">
                    <PiUser className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white mb-1 truncate">
                      {member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'کاربر'}
                    </h2>
                    <div className="space-y-1">
                      {member.membershipNumber && (
                        <p className="text-sm text-emerald-50 flex items-center gap-1.5">
                          <PiIdentificationCard className="h-4 w-4" />
                          <span>شماره عضویت: {member.membershipNumber}</span>
                        </p>
                      )}
                      {member.nationalId && (
                        <p className="text-sm text-emerald-50">
                          {member.nationalId}
                        </p>
                      )}
                    </div>
                  </div>
                  {member.isActive !== undefined && (
                    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      member.isActive 
                        ? 'bg-emerald-700/30 text-white border border-white/20' 
                        : 'bg-white/20 text-white/80'
                    }`}>
                      {member.isActive ? 'فعال' : 'غیرفعال'}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  اطلاعات تماس
                </h3>
                <div className="space-y-3">
                  {(member.phoneNumber || user?.phone) && (
                    <InfoRow
                      icon={<PiPhone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                      label="شماره تماس"
                      value={(member.phoneNumber as string | undefined) || user?.phone || undefined}
                    />
                  )}

                  {member.email && (
                    <InfoRow
                      icon={<PiEnvelope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                      label="ایمیل"
                      value={member.email as string}
                    />
                  )}
                </div>
              </div>

              {/* Capabilities */}
              {member?.capabilityList && Array.isArray(member.capabilityList) && member.capabilityList.length > 0 && (
                <ListSection<CapabilityListItem>
                  title="قابلیت‌ها"
                  items={member.capabilityList}
                  getLabel={(item) => item.id || 'قابلیت'}
                  getValue={(item) => item.title || 'بدون نام'}
                  icon={<PiKey className="h-5 w-5" />}
                />
              )}

              {/* Features */}
              {member?.featureList && Array.isArray(member.featureList) && member.featureList.length > 0 && (
                <ListSection<FeatureListItem>
                  title="ویژگی‌ها"
                  items={member.featureList}
                  getLabel={(item) => item.id || 'ویژگی'}
                  getValue={(item) => item.title || 'بدون نام'}
                  icon={<PiStar className="h-5 w-5" />}
                />
              )}

              {/* Agencies */}
              {member?.agencyList && Array.isArray(member.agencyList) && member.agencyList.length > 0 && (
                <ListSection<AgencyListItem>
                  title="آژانس‌ها"
                  items={member.agencyList}
                  getLabel={(item) => item.id || 'آژانس'}
                  getValue={(item) => item.title || 'بدون نام'}
                  icon={<PiBuildings className="h-5 w-5" />}
                />
              )}
            </div>
          )}

          {/* No Member Data */}
          {!isLoadingMember && !member && !hasError && (
            <div className="text-center py-12">
              <PiUser className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                اطلاعات عضو یافت نشد
              </p>
            </div>
          )}
        </div>

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </ScrollableArea>
    </div>
  );
}

