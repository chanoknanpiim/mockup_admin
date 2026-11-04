'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminData } from '@/context/AdminDataContext';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { reports, isConnected, isLoading, syncFromSupabase, toasts } = useAdminData();

  const currentNav = NAV_ITEMS.find((item) => item.href === pathname);
  const pageTitle = currentNav?.label || 'ภาพรวมระบบ';

  return (
    <div id="app-view">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">ปลดปล่อย Admin</div>
          <button
            className="icon-btn mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
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
                {item.showReportBadge && (
                  <span className="badge">{reports.length}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn hamburger-btn"
              onClick={() => setSidebarOpen(true)}
            >
              =
            </button>
            <h2 className="page-title">{pageTitle}</h2>
          </div>
          <div className="topbar-right">
            <span className={`badge ${isConnected ? 'success' : 'warning'}`}>
              {isConnected
                ? 'เชื่อมต่อ Supabase จริงแล้ว'
                : 'โหมดข้อมูลจำลอง (ตั้งค่า DB ได้ที่เมนูซ้ายล่าง)'}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => syncFromSupabase(false)}
              disabled={isLoading}
              title="ดึงข้อมูลล่าสุดจากฐานข้อมูล"
            >
              {isLoading ? 'กำลังโหลด...' : 'โหลดข้อมูลใหม่'}
            </button>
            <div className="user-profile">
              <div className="avatar">A</div>
              <span className="user-name">ผู้ดูแลระบบ</span>
            </div>
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
