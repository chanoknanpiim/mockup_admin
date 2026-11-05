'use client';

import React, { useEffect } from 'react';

const FONT_FAMILY = "'Prompt', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error boundary caught an error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 102, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          padding: '32px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#000066',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          PLODPLOI ADMIN
        </div>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: '18px',
            fontWeight: 700,
            color: '#0F172A',
          }}
        >
          เกิดข้อผิดพลาดในการโหลดระบบ
        </h2>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: '13px',
            color: '#64748B',
            lineHeight: 1.5,
          }}
        >
          เกิดปัญหาชั่วคราวในการประมวลผลข้อมูล กรุณากดลองใหม่อีกครั้ง หรือกลับไปยังหน้าเข้าสู่ระบบ
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#000066',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT_FAMILY,
            }}
          >
            ลองใหม่อีกครั้ง
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONT_FAMILY,
            }}
          >
            ไปยังหน้าเข้าสู่ระบบ (Login)
          </button>
        </div>
      </div>
    </div>
  );
}
