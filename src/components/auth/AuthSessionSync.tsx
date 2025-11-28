'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/src/hooks/store';
import { setAccessToken, clearUser, setAnonymous, setAuthStatus, setChallengeId, setMaskedPhoneNumber, setNationalCode } from '@/src/store/auth';

export function AuthSessionSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const lastAccessTokenRef = useRef<string | null>(null);
  const lastSessionKeyRef = useRef<string>('');

  useEffect(() => {
    // Create session key to detect changes
    const currentSessionKey = `${status}-${session?.accessToken || 'no-token'}-${session?.challengeId || 'no-challenge'}`;

    // Skip if no change
    if (currentSessionKey === lastSessionKeyRef.current) {
      return;
    }

    lastSessionKeyRef.current = currentSessionKey;

    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthSessionSync] 🔄 Session changed:', {
        status,
        hasAccessToken: !!session?.accessToken,
        hasChallengeId: !!session?.challengeId,
        sessionKey: currentSessionKey
      });
    }

    // Handle authenticated session
    if (status === 'authenticated') {
      const accessToken = session?.accessToken ?? null;

      // Sync access token if changed
      if (accessToken !== lastAccessTokenRef.current) {
        if (accessToken) {
          dispatch(setAccessToken(accessToken));
          dispatch(setAuthStatus('authenticated'));
          lastAccessTokenRef.current = accessToken;

          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthSessionSync] ✅ accessToken synced from NextAuth to Redux');
          }
        } else {
          // Session authenticated but no access token - might be OTP sent
          dispatch(setAccessToken(null));

          // Check if OTP data exists
          if (session?.challengeId) {
            dispatch(setChallengeId(session.challengeId));
            dispatch(setAuthStatus('otp-sent'));

            if (session.maskedPhoneNumber) {
              dispatch(setMaskedPhoneNumber(session.maskedPhoneNumber));
            }
            if (session.nationalCode) {
              dispatch(setNationalCode(session.nationalCode));
            }

            if (process.env.NODE_ENV === 'development') {
              console.log('[AuthSessionSync] 📱 OTP data synced from NextAuth to Redux');
            }
          } else {
            dispatch(setAuthStatus('anonymous'));
          }
        }
      }
    }

    // Handle unauthenticated session
    if (status === 'unauthenticated') {
      dispatch(setAccessToken(null));
      dispatch(clearUser());
      dispatch(setAnonymous());
      dispatch(setAuthStatus('anonymous'));
      dispatch(setChallengeId(null));
      dispatch(setMaskedPhoneNumber(null));
      dispatch(setNationalCode(null));
      lastAccessTokenRef.current = null;

      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthSessionSync] 🔄 Session unauthenticated – Redux cleared');
      }
    }
  }, [status, session, dispatch]);

  return null;
}
