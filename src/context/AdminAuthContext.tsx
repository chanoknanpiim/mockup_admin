'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase';

export interface AdminProfile {
  admin_profile_id: number;
  email: string | null;
  display_name?: string | null;
  role: string;
  is_active: boolean;
}

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAdminProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser || !currentUser.email) {
      setAdminProfile(null);
      setIsAdmin(false);
      setAuthError(null);
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setAdminProfile(null);
      setIsAdmin(false);
      setAuthError('ไม่สามารถเชื่อมต่อระบบฐานข้อมูลได้');
      return;
    }

    try {
      // Query admin_profiles with a strict 4-second timeout to prevent hanging
      const queryPromise = supabase
        .from('admin_profiles')
        .select('*')
        .eq('email', currentUser.email.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'QUERY_TIMEOUT' } }), 4000)
      );

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result;

      if (!error && data) {
        setAdminProfile(data as AdminProfile);
        setIsAdmin(true);
        setAuthError(null);
        return;
      }

      if (error && error.message === 'QUERY_TIMEOUT') {
        console.warn('Admin profile check timed out after 4s (likely RLS policy recursion)');
        setAdminProfile(null);
        setIsAdmin(false);
        setAuthError('การตรวจสอบสิทธิ์ใช้เวลานานเกินไป กรุณาตรวจสอบ RLS Policy ของตาราง admin_profiles');
        return;
      }

      // If no admin profile found or inactive
      console.warn('No active admin profile found for user:', currentUser.email);
      setAdminProfile(null);
      setIsAdmin(false);
      setAuthError('ไม่พบสิทธิ์ผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบสูงสุด');
    } catch (err: unknown) {
      console.error('Error verifying admin profile:', err);
      setAdminProfile(null);
      setIsAdmin(false);
      setAuthError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ผู้ดูแลระบบ');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Safety timeout: Never stay in isLoading for more than 5 seconds under any circumstance
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 5000);

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await checkAdminProfile(currentSession.user);
      }
      if (isMounted) {
        setIsLoading(false);
        clearTimeout(safetyTimer);
      }
    }).catch((err) => {
      console.error('Session retrieval error:', err);
      if (isMounted) {
        setIsLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await checkAdminProfile(newSession.user);
      } else {
        setAdminProfile(null);
        setIsAdmin(false);
        setAuthError(null);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [checkAdminProfile]);

  const signIn = async (email: string, password: string) => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      return { error: 'ไม่สามารถเชื่อมต่อ Supabase ได้ กรุณาตรวจสอบการตั้งค่า' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await checkAdminProfile(data.user);
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      return { error: msg };
    }
  };

  const signOut = async () => {
    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setAdminProfile(null);
      setIsAdmin(false);
      setAuthError(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshAdminStatus = async () => {
    setIsLoading(true);
    setAuthError(null);
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        await checkAdminProfile(currentUser);
      }
    }
    setIsLoading(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        adminProfile,
        isAdmin,
        isLoading,
        authError,
        signIn,
        signOut,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
