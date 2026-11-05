'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiffProvider, useLiff } from '@/context/LiffContext';

function NavIcon({ name, active }: { name: 'map' | 'review' | 'profile'; active: boolean }) {
  const strokeWidth = active ? 2.1 : 1.65;
  switch (name) {
    case 'map':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
          <circle cx="12" cy="11" r="2.3" />
        </svg>
      );
    case 'review':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
        </svg>
      );
    case 'profile':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
  }
}

function LiffMobileFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode, profile, isInLineClient } = useLiff();

  const bgMain = isDarkMode ? '#0F172A' : '#F8FAFC';
  const textMain = isDarkMode ? '#F8FAFC' : '#0F172A';
  const headerBg = '#000066';
  const navBg = isDarkMode ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.97)';
  const navBorder = isDarkMode ? '#334155' : '#E2E8F0';

  const navItems: {
    href: string;
    icon: 'map' | 'review' | 'profile';
    label: string;
  }[] = [
    { href: '/liff', icon: 'map', label: 'ค้นหาห้องน้ำ' },
    { href: '/liff/report', icon: 'review', label: 'รีวิว/แจ้งซ่อม' },
    { href: '/liff/me', icon: 'profile', label: 'โปรไฟล์' },
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: bgMain,
        color: textMain,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Minimalist Brand Header (#000066) */}
      <header
        style={{
          backgroundColor: headerBg,
          color: '#FFFFFF',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px rgba(0, 0, 102, 0.14)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo-plodploi-circle.png"
            alt="Plod-Ploi Logo"
            width={36}
            height={36}
            style={{
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '2.5px',
                lineHeight: 1.2,
              }}
            >
              PLODPLOI
            </div>
            <div style={{ fontSize: '11px', color: '#C7D2FE', marginTop: '1px' }}>
              {isInLineClient
                ? `LINE LIFF • ${profile?.displayName || 'ผู้ใช้งาน'}`
                : 'มธ. ท่าพระจันทร์ • แผนที่ห้องน้ำใกล้ฉัน'}
            </div>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          aria-label="สลับโหมดมืด/สว่าง"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.24)',
            color: '#FFFFFF',
            borderRadius: '9999px',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isDarkMode ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </svg>
          )}
          <span>{isDarkMode ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
        </button>
      </header>

      {/* Main Content Area (padded at bottom for Floating Pill Nav) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '94px' }}>
        {children}
      </main>

      {/* Floating Pill Bottom Navigation */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <nav
          aria-label="เมนูหลัก"
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '440px',
            backgroundColor: navBg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${navBorder}`,
            borderRadius: '9999px',
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 102, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06)',
          }}
        >
          {navItems.map((tab) => {
            const isActive =
              tab.href === '/liff'
                ? pathname === '/liff' || pathname?.startsWith('/liff/toilet')
                : pathname?.startsWith(tab.href);
            const activeColor = isDarkMode ? '#FFFFFF' : '#000066';
            const inactiveColor = isDarkMode ? '#94A3B8' : '#64748B';
            const activePillBg = isDarkMode ? '#000066' : '#EEF2FF';

            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  textDecoration: 'none',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  color: isActive ? activeColor : inactiveColor,
                  backgroundColor: isActive ? activePillBg : 'transparent',
                  borderRadius: '9999px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '10.5px',
                  padding: '7px 6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <NavIcon name={tab.icon} active={Boolean(isActive)} />
                <span style={{ lineHeight: 1.1, whiteSpace: 'nowrap' }}>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <LiffProvider>
      <LiffMobileFrame>{children}</LiffMobileFrame>
    </LiffProvider>
  );
}
