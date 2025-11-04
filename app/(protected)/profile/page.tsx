'use client';

import { useState } from 'react';
import { IconButton } from '@/src/components/ui/IconButton';
import { useAuth } from '@/src/hooks/useAuth';
import {
  PiUser,
  PiEnvelope,
  PiPhone,
  PiShieldCheck,
  PiSignOut,
  PiGear,
  PiPen,
  PiBell,
} from 'react-icons/pi';
function ProfileCard() {
  const { user, userName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
          <PiUser className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {userName || 'کاربر'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            عضو سیستم رفاهی مهندسین
          </p>
        </div>
        <IconButton
          aria-label="ویرایش پروفایل"
          onClick={() => setIsEditing(!isEditing)}
          variant="ghost"
        >
          <PiPen className="h-4 w-4" />
        </IconButton>
      </div>

      {user && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <PiEnvelope className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.nationalId || 'کد ملی ثبت نشده'}
            </span>
          </div>
          
          {user.phone && (
            <div className="flex items-center gap-3">
              <PiPhone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.phone}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <PiShieldCheck className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              نقش: {user.roles?.join(', ') || 'کاربر عادی'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function MenuItem({ 
  icon, 
  label, 
  onClick, 
  variant = 'default' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
        variant === 'danger'
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      <div className={`${variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function ProfilePage() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="py-4 space-y-6">
      {/* Profile Card */}
      <ProfileCard />
      
      {/* Account Management Sections */}
      <div className="space-y-6">
        <MenuSection title="حساب کاربری">
          <MenuItem
            icon={<PiGear className="h-4 w-4" />}
            label="تنظیمات"
            onClick={() => console.log('Settings clicked')}
          />
          <MenuItem
            icon={<PiShieldCheck className="h-4 w-4" />}
            label="امنیت"
            onClick={() => console.log('Security clicked')}
          />
        </MenuSection>

        <MenuSection title="اطلاعات شخصی">
          <MenuItem
            icon={<PiUser className="h-4 w-4" />}
            label="ویرایش پروفایل"
            onClick={() => console.log('Edit profile clicked')}
          />
          <MenuItem
            icon={<PiEnvelope className="h-4 w-4" />}
            label="اطلاعات تماس"
            onClick={() => console.log('Contact info clicked')}
          />
        </MenuSection>

        <MenuSection title="تنظیمات اعلان‌ها">
          <MenuItem
            icon={<PiBell className="h-4 w-4" />}
            label="اعلان‌های سیستم"
            onClick={() => console.log('System notifications clicked')}
          />
          <MenuItem
            icon={<PiBell className="h-4 w-4" />}
            label="اعلان‌های ایمیل"
            onClick={() => console.log('Email notifications clicked')}
          />
        </MenuSection>
      </div>

      {/* Logout Button - Fixed at bottom */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <MenuItem
          icon={<PiSignOut className="h-4 w-4" />}
          label="خروج از حساب"
          onClick={handleLogout}
          variant="danger"
        />
      </div>
    </div>
  );
}
