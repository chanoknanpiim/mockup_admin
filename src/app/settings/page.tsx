'use client';

import React, { useState, useEffect } from 'react';
import { useAdminData } from '@/context/AdminDataContext';

export default function SettingsPage() {
  const {
    supabaseUrl,
    supabaseKey,
    storageBucket,
    saveSupabaseSettings,
    clearSupabaseSettings,
  } = useAdminData();

  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseKey);
  const [bucket, setBucket] = useState(storageBucket);

  useEffect(() => {
    setUrl(supabaseUrl);
    setKey(supabaseKey);
    setBucket(storageBucket);
  }, [supabaseUrl, supabaseKey, storageBucket]);

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>ตั้งค่าการเชื่อมต่อฐานข้อมูล Supabase จริง</strong>
          <p>
            ระบบได้ดึงค่าเริ่มต้นจากไฟล์ <code>.env.local</code> ให้อัตโนมัติแล้ว
            หากต้องการเปลี่ยนโปรเจกต์ Supabase สามารถแก้ไขด้านล่างได้ทันที
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>ข้อมูลกุญแจเชื่อมต่อ (Supabase Credentials)</h3>
        </div>
        <div className="panel-body">
          <div className="form-group">
            <label>1. Supabase Project URL</label>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น https://abcdefghijklm.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <small className="text-muted">ดูได้ที่ปุ่ม Connect บนหัวเว็บ Supabase ของคุณ</small>
          </div>
          <div className="form-group">
            <label>2. Supabase Publishable Key (หรือ Anon Key)</label>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น sb_publishable_... หรือ eyJhbGciOiJIUzI1NiIsInR5..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <small className="text-muted">
              ใช้เฉพาะ Publishable Key เท่านั้น (ห้ามนำ Secret Key มาใส่ในหน้าเว็บ)
            </small>
          </div>
          <div className="form-group">
            <label>
              3. ชื่อโฟลเดอร์เก็บรูปภาพ (Storage Bucket Name สำหรับอัปโหลดรูปแจ้งซ่อม)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น report-photos"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
            />
            <small className="text-muted">
              หากยังไม่ได้สร้าง Bucket ใน Supabase
              ระบบจะแปลงรูปภาพเก็บลงตารางให้โดยอัตโนมัติ (ใช้งานได้ทันทีไม่ต้องตั้งค่าเพิ่ม)
            </small>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => saveSupabaseSettings(url, key, bucket)}
            >
              บันทึกและเชื่อมต่อฐานข้อมูลทันที
            </button>
            <button className="btn btn-outline-danger" onClick={clearSupabaseSettings}>
              รีเซ็ตกลับไปใช้ค่าจาก .env.local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
