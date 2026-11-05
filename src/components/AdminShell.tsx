'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminData } from '@/context/AdminDataContext';
import { useAdminAuth } from '@/context/AdminAuthContext';

const NAV_ITEMS = [
  { section: 'ภาพรวมและการแจ้งเตือน' },
  { href: '/', label: 'ภาพรวมระบบ' },
  { href: '/reports', label: 'รายงานแจ้งซ่อม/ปัญหา', showReportBadge: true },
  { href: '/reviews', label: 'รีวิวและคะแนนความสะอาด' },
  { divider: true },
  { section: 'จัดการฐานข้อมูลหลัก (CRUD)' },
  { href: '/toilets', label: 'ข้อมูลห้องน้ำ (Toilets)' },
  { href: '/buildings', label: 'ข้อมูลอาคาร (Buildings)' },
  { href: '/locations', label: 'จุดอ้างอิงในตึก (Locations)' },
  { href: '/amenities', label: 'สิ่งอำนวยความสะดวก (Amenities)' },
  { divider: true },
  { section: 'ระบบและผู้ใช้งาน' },
  { href: '/users', label: 'รายชื่อผู้ใช้งานและแอดมิน' },
  { href: '/settings', label: 'ตั้งค่าเชื่อมต่อ Supabase' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { reports, isConnected, isLoading: isDataLoading, syncFromSupabase, toasts } = useAdminData();
  const { user, isAdmin, isLoading: isAuthLoading, authError, signOut, refreshAdminStatus, adminProfile } = useAdminAuth();

  // If user is completely logged out (no session), redirect to /login
  useEffect(() => {
    if (pathname?.startsWith('/liff') || pathname?.startsWith('/login')) {
      return;
    }
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [pathname, user, isAuthLoading, router]);

  // If public route or login page, do not wrap with AdminShell layout
  if (pathname?.startsWith('/liff') || pathname?.startsWith('/login')) {
    return <>{children}</>;
  }

  // Loading state while verifying auth session (times out within 4-5s)
  if (isAuthLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: '#000066',
          fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif",
          gap: '14px',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E2E8F0',
            borderTopColor: '#000066',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</div>
      </div>
    );
  }

  // If completely unauthenticated, show brief redirect text
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: '#64748B',
          fontSize: '13px',
          fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif",
        }}
      >
        <span>กำลังนำทางไปยังหน้าเข้าสู่ระบบ...</span>
      </div>
    );
  }

  // If authenticated but does NOT have admin permissions (or permission check failed/timed out)
  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          padding: '24px',
          fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif",
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
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '20px',
              fontWeight: 800,
              border: '1px solid #FECACA',
            }}
          >
            !
          </div>

          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#000066',
            }}
          >
            ไม่พบสิทธิ์ผู้ดูแลระบบ
          </h2>

          <p
            style={{
              margin: '0 0 16px',
              fontSize: '13px',
              color: '#64748B',
              lineHeight: 1.5,
            }}
          >
            {authError || 'ไม่พบสิทธิ์ผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบสูงสุด'}
          </p>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#F1F5F9',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#334155',
              marginBottom: '24px',
              wordBreak: 'break-all',
            }}
          >
            บัญชีที่เข้าสู่ระบบ: <strong>{user.email}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => refreshAdminStatus()}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#000066',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ลองตรวจสอบสิทธิ์อีกครั้ง
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace('/login');
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ออกจากระบบและกลับไปหน้า Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentNav = NAV_ITEMS.find((item) => item.href === pathname);
  const pageTitle = currentNav?.label || 'ภาพรวมระบบ';

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const adminEmail = user.email || 'Admin';
  const roleLabel = adminProfile?.role === 'super_admin' ? 'Super Admin' : 'ผู้ดูแลระบบ';

  return (
    <div id="app-view">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">ปลดปล่อย Admin</div>
          <button
            className="icon-btn mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="ปิดเมนู"
          >
            X
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, idx) => {
            if (item.divider) {
              return <div key={`div-${idx}`} className="nav-divider" />;
            }
            if (item.section) {
              return (
                <div key={`sec-${idx}`} className="nav-title">
                  {item.section}
                </div>
              );
            }
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href || '/'}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span>{item.label}</span>
                {item.showReportBadge && reports.length > 0 && (
                  <span className="badge danger">{reports.length}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout Button */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #1E293B',
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ fontWeight: 600, color: '#F1F5F9' }}>{adminEmail}</span>
            <div style={{ fontSize: '11px', color: '#64748B' }}>{roleLabel}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '8px 12px',
              backgroundColor: '#1E293B',
              color: '#F87171',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              =
            </button>
            <h2 className="page-title">{pageTitle}</h2>
          </div>
          <div className="topbar-right">
            <span className={`badge ${isConnected ? 'success' : 'warning'}`}>
              {isConnected ? 'เชื่อมต่อ Supabase จริง' : 'กำลังเชื่อมต่อฐานข้อมูล...'}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => syncFromSupabase(false)}
              disabled={isDataLoading}
              title="ดึงข้อมูลล่าสุดจากฐานข้อมูล"
            >
              {isDataLoading ? 'กำลังโหลด...' : 'โหลดข้อมูลใหม่'}
            </button>
            <div className="user-profile">
              <div className="avatar">A</div>
              <span className="user-name">{adminProfile?.display_name || adminEmail}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleLogout}
              style={{ marginLeft: '8px' }}
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        <div className="page-container">{children}</div>
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
