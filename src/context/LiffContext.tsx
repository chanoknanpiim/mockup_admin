'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface LiffUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface UserCoordinates {
  lat: number;
  lng: number;
  source: 'gps' | 'campus_default' | 'custom_pin';
  label: string;
}

interface LiffContextValue {
  isReady: boolean;
  isInLineClient: boolean;
  isLoggedIn: boolean;
  profile: LiffUserProfile | null;
  idToken: string | null;
  coords: UserCoordinates;
  isLocating: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  requestGpsLocation: () => void;
  setCustomCoordinates: (lat: number, lng: number, label?: string) => void;
}

// Default coordinates: Thammasat University (Tha Prachan Campus — central courtyard)
export const THA_PRACHAN_DEFAULT_COORDS: UserCoordinates = {
  lat: 13.7563,
  lng: 100.49,
  source: 'campus_default',
  label: 'มธ. ท่าพระจันทร์ (จุดเริ่มต้นจำลอง)',
};

const LiffContext = createContext<LiffContextValue | undefined>(undefined);

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isInClient: () => boolean;
      isLoggedIn: () => boolean;
      login: () => void;
      getProfile: () => Promise<LiffUserProfile>;
      getIDToken: () => string | null;
    };
  }
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isInLineClient, setIsInLineClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffUserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [coords, setCoords] = useState<UserCoordinates>(THA_PRACHAN_DEFAULT_COORDS);
  const [isLocating, setIsLocating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark mode initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('plodploi_liff_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (!savedTheme && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('plodploi_liff_theme', next ? 'dark' : 'light');
      }
      return next;
    });
  }, []);

  // Initialize LINE LIFF SDK if `NEXT_PUBLIC_LIFF_ID` is configured
  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '';
    const isLocalhostDev =
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (!liffId) {
      if (isLocalhostDev) {
        // Strictly allowed ONLY in development on localhost / 127.0.0.1
        setProfile({
          userId: 'U_LOCAL_PREVIEW',
          displayName: '[LOCAL] นักศึกษา มธ. (โหมดทดสอบ)',
        });
        setIdToken('LOCAL_DEV_PREVIEW_TOKEN');
        setIsLoggedIn(true);
      }
      setIsReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    script.async = true;
    script.onload = async () => {
      try {
        if (window.liff) {
          await window.liff.init({ liffId });
          setIsInLineClient(window.liff.isInClient());
          if (window.liff.isLoggedIn()) {
            setIsLoggedIn(true);
            setIdToken(window.liff.getIDToken());
            const userProfile = await window.liff.getProfile();
            setProfile(userProfile);
          } else if (isLocalhostDev) {
            setProfile({
              userId: 'U_LOCAL_PREVIEW',
              displayName: '[LOCAL] นักศึกษา มธ. (โหมดทดสอบ)',
            });
            setIdToken('LOCAL_DEV_PREVIEW_TOKEN');
            setIsLoggedIn(true);
          }
        }
      } catch (err) {
        console.warn('LIFF init fallback:', err);
        if (isLocalhostDev) {
          setProfile({
            userId: 'U_LOCAL_PREVIEW',
            displayName: '[LOCAL] นักศึกษา มธ. (โหมดทดสอบ)',
          });
          setIdToken('LOCAL_DEV_PREVIEW_TOKEN');
          setIsLoggedIn(true);
        }
      } finally {
        setIsReady(true);
      }
    };
    script.onerror = () => {
      setIsReady(true);
    };
    document.body.appendChild(script);
  }, []);

  const requestGpsLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: 'gps',
          label: 'ตำแหน่ง GPS ปัจจุบันของคุณ',
        });
        setIsLocating(false);
      },
      () => {
        // Fallback to Thammasat Tha Prachan if GPS denied or unavailable
        setCoords(THA_PRACHAN_DEFAULT_COORDS);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const setCustomCoordinates = useCallback((lat: number, lng: number, label?: string) => {
    setCoords({
      lat,
      lng,
      source: 'custom_pin',
      label: label || `พิกัดจำลอง (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    });
  }, []);

  return (
    <LiffContext.Provider
      value={{
        isReady,
        isInLineClient,
        isLoggedIn,
        profile,
        idToken,
        coords,
        isLocating,
        isDarkMode,
        toggleDarkMode,
        requestGpsLocation,
        setCustomCoordinates,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  const ctx = useContext(LiffContext);
  if (!ctx) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return ctx;
}
