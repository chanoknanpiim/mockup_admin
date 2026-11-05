'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { getBrowserSupabase } from '@/lib/supabase';

const FONT_FAMILY = "'Prompt', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export default function LoginPage() {
  const router = useRouter();

  // Safe context consumption with fallback to prevent crashes if context is unavailable
  let authContext: ReturnType<typeof useAdminAuth> | null = null;
  try {
    authContext = useAdminAuth();
  } catch (err) {
    console.warn('AdminAuthContext not available, using direct fallback:', err);
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    console.log('[LoginPage] Target Supabase Client:', supabase ? 'Ready' : 'Not Available');
    console.log('[LoginPage] Env NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '(using project fallback)');
  }, []);

  useEffect(() => {
    if (authContext && !authContext.isLoading && authContext.user && authContext.isAdmin) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    }
  }, [authContext, router]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      let res: { error: string | null } | null = null;

      if (authContext?.signIn) {
        res = await authContext.signIn(cleanEmail, password);
      } else {
        // Fallback: Direct Supabase client sign-in with admin profile verification
        const supabase = getBrowserSupabase();
        if (!supabase) {
          setErrorMsg('ไม่สามารถเชื่อมต่อระบบฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
          setSubmitting(false);
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          console.error('[LoginPage fallback] signIn error:', {
            message: error.message,
            status: error.status,
            name: error.name,
          });
          if (error.message.includes('Invalid login credentials')) {
            res = { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid login credentials)' };
          } else if (error.message.includes('Email not confirmed')) {
            res = { error: 'อีเมลนี้ยังไม่ได้รับการยืนยันในระบบ Supabase (Email not confirmed)' };
          } else {
            res = { error: error.message };
          }
        } else if (data.user) {
          // Check role in admin_profiles
          const { data: profile, error: pError } = await supabase
            .from('admin_profiles')
            .select('*')
            .eq('email', cleanEmail)
            .eq('is_active', true)
            .maybeSingle();

          const role = profile?.role;
          const isAuthorized = profile?.is_active && (role === 'admin' || role === 'super_admin' || role === 'moderator');

          if (pError || !profile || !isAuthorized) {
            console.warn('[LoginPage fallback] Unauthorized user:', cleanEmail, profile);
            await supabase.auth.signOut();
            res = { error: 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล (Unauthorized)' };
          } else {
            res = { error: null };
          }
        }
      }

      if (res?.error) {
        // Display exact error message from Supabase or role check
        setErrorMsg(res.error);
      } else {
        // Navigate cleanly to dashboard to reload fresh admin state
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          router.replace('/');
        }
      }
    } catch (err: unknown) {
      console.error('Login submit error:', err);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 102, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          fontFamily: FONT_FAMILY,
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            backgroundColor: '#000066',
            color: '#FFFFFF',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '3px',
              color: '#93C5FD',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            PLODPLOI ADMIN
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
            }}
          >
            เข้าสู่ระบบผู้ดูแลหลังบ้าน
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '13px',
              color: '#CBD5E1',
            }}
          >
            ระบบบริหารจัดการห้องน้ำ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์
          </p>
        </div>

        {/* Form Body */}
        <form
          action="#"
          noValidate
          onSubmit={handleSubmit}
          style={{ padding: '28px 24px', fontFamily: FONT_FAMILY }}
        >
          {errorMsg && (
            <div
              style={{
                backgroundColor: errorMsg.includes('Unauthorized') ? '#FFFBEB' : '#FEF2F2',
                color: errorMsg.includes('Unauthorized') ? '#B45309' : '#DC2626',
                border: errorMsg.includes('Unauthorized') ? '1px solid #FDE68A' : '1px solid #FECACA',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                lineHeight: 1.4,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
                fontFamily: FONT_FAMILY,
              }}
            >
              อีเมล (Email)
            </label>
            <input
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: FONT_FAMILY,
              }}
            />
          </div>

          <div style={{ marginBottom: '26px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
                fontFamily: FONT_FAMILY,
              }}
            >
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: FONT_FAMILY,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#000066',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              fontFamily: FONT_FAMILY,
              transition: 'background 0.15s ease',
            }}
          >
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
