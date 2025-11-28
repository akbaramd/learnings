'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppSelector } from '@/src/hooks/store';
import { selectUser } from '@/src/store/auth';

// Extend Window interface for RayChat
declare global {
  interface Window {
    Raychat?: {
      setUser: (user: any) => void;
      on: (event: string, callback: (data?: any) => void) => void;
    };
  }
}

export function RayChatUserSetter() {
  const { data: session } = useSession();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (user || session?.user) {
      const userInfo = {
        email: session?.user?.email || '',
        name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : session?.user?.name || '',
        phone: user?.phone || '',
        about: user?.nationalId ? `کد ملی: ${user.nationalId}` : '',
        avatar: '', // Can be set if user has avatar
        updateOnce: true
      };

      // Store user info in localStorage for RayChat
      localStorage.setItem('raychat_user_info', JSON.stringify(userInfo));

      // If RayChat is already loaded, set user info immediately
      if (window.Raychat) {
        window.Raychat.setUser(userInfo);
      }
    }
  }, [user, session]);

  return null; // This component doesn't render anything
}
