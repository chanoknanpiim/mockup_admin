'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { Building } from '@/lib/types';

const SUPABASE_SQL_FIX = `-- 1. ปลดล็อก RLS และอนุญาตให้เว็บแอดมินเพิ่ม/แก้ไข/ลบข้อมูลลงตารางจริงได้
ALTER TABLE IF EXISTS public.buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.toilets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.toilet_amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. เพิ่มรายชื่อทั้ง 9 คณะ/วิทยาลัย มธ. ท่าพระจันทร์ ลงตาราง buildings ใน Supabase จริง
INSERT INTO public.buildings (building_id, building_name, description) VALUES
  (1, 'คณะนิติศาสตร์', 'เปิดสอนทั้งท่าพระจันทร์ รังสิต และลำปาง'),
  (2, 'คณะพาณิชยศาสตร์และการบัญชี', 'หลักสูตรนานาชาติ BBA และโครงการพิเศษ'),
  (3, 'คณะรัฐศาสตร์', 'หลักสูตรนานาชาติ BMIR'),
  (4, 'คณะเศรษฐศาสตร์', 'หลักสูตรนานาชาติ BE'),
  (5, 'คณะศิลปศาสตร์', 'โครงการอังกฤษ-อเมริกันศึกษา BAS'),
  (6, 'คณะวารสารศาสตร์และสื่อสารมวลชน', 'บางหลักสูตร/โครงการพิเศษ'),
  (7, 'วิทยาลัยสหวิทยาการ', 'วิทยาลัยสหวิทยาการ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์'),
  (8, 'วิทยาลัยนวัตกรรม', 'มีชั้น 3-5'),
  (9, 'วิทยาลัยนานาชาติปรีดี พนมยงค์', '')
ON CONFLICT (building_id) DO UPDATE
SET building_name = EXCLUDED.building_name,
    description = EXCLUDED.description;`;

export default function BuildingsPage() {
  const {
    buildings,
    toilets,
    rlsBlocked,
    saveBuilding,
    deleteBuilding,
    seedBuildingsToSupabase,
    showToast,
  } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [buildingName, setBuildingName] = useState('');
  const [description, setDescription] = useState('');

  const openModal = (b?: Building) => {
    if (b) {
      setEditingId(b.building_id);
      setBuildingName(b.building_name);
      setDescription(b.description || '');
    } else {
      setEditingId(null);
      setBuildingName('');
      setDescription('');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const ok = await saveBuilding({
      id: editingId,
      building_name: buildingName,
      description,
    });
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (buildingId: number) => {
    if (!confirm('ยืนยันการลบอาคารนี้ใช่หรือไม่?')) return;
    await deleteBuilding(buildingId);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_FIX);
    showToast('คัดลอกคำสั่ง SQL แล้ว! นำไปวางในเมนู SQL Editor ของ Supabase ได้เลย', 'success');
  };

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>การจัดการข้อมูลอาคาร (ตาราง buildings)</strong>
          <p>
            รายชื่อตึกและคณะต่างๆ ใน มธ. ท่าพระจันทร์ เมื่อเพิ่มตึกที่นี่แล้ว
            จะสามารถนำไปเลือกตอนสร้างห้องน้ำหรือจุดอ้างอิงได้
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline-primary btn-lg"
            onClick={() => seedBuildingsToSupabase()}
          >
            ซิงก์ 9 คณะเข้า Supabase
          </button>
          <button className="btn btn-primary btn-lg" onClick={() => openModal()}>
            + เพิ่มอาคารใหม่
          </button>
        </div>
      </div>

      {rlsBlocked && (
        <div
          className="panel"
          style={{
            borderColor: 'var(--danger)',
            background: '#FFF5F5',
            marginBottom: '24px',
          }}
        >
          <div className="panel-header" style={{ borderColor: '#FECACA' }}>
            <h3 className="text-danger">
              ตรวจพบการบล็อกสิทธิ์จาก Supabase (Row-Level Security: Error 42501)
            </h3>
            <button className="btn btn-sm btn-primary" onClick={copySql}>
              คัดลอกคำสั่ง SQL เพื่อปลดล็อกและเพิ่ม 9 คณะ
            </button>
          </div>
          <div className="panel-body">
            <p style={{ marginBottom: '10px', fontSize: '14px' }}>
              ขณะนี้ตาราง <code>buildings</code> ในโปรเจกต์ Supabase ของคุณเปิด{' '}
              <b>Row-Level Security (RLS)</b> เอาไว้โดยยังไม่มี Policy อนุญาตการเขียนข้อมูล
              ทำให้เมื่อโค้ดสั่ง <code>INSERT</code> รายชื่อทั้ง 9 คณะเข้า Supabase จึงถูกบล็อก
              (ตารางใน Supabase จึงยังว่างอยู่)
            </p>
            <p style={{ marginBottom: '10px', fontSize: '14px' }}>
              <b>วิธีแก้ให้ข้อมูลขึ้นใน Supabase ทันที:</b> กดปุ่ม{' '}
              <b>&ldquo;คัดลอกคำสั่ง SQL&rdquo;</b> ด้านบน แล้วไปที่เว็บ{' '}
              <b>Supabase Dashboard → เมนูซ้ายเลือก SQL Editor → New query</b> วางโค้ดด้านล่างนี้แล้วกด{' '}
              <b>Run</b> ได้เลยครับ:
            </p>
            <pre
              style={{
                background: '#1E293B',
                color: '#F8FAFC',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
              }}
            >
              {SUPABASE_SQL_FIX}
            </pre>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัสอาคาร (ID)</th>
                <th>ชื่ออาคาร / คณะ</th>
                <th>รายละเอียดเพิ่มเติม / จุดสังเกตตึก</th>
                <th>จำนวนห้องน้ำในตึกนี้</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((b) => {
                const count = toilets.filter(
                  (t) => Number(t.building_id) === Number(b.building_id)
                ).length;
                return (
                  <tr key={b.building_id}>
                    <td>
                      <b>#{b.building_id}</b>
                    </td>
                    <td>
                      <b>{b.building_name}</b>
                    </td>
                    <td>{b.description || '-'}</td>
                    <td>
                      <span className="badge success">{count} จุดห้องน้ำ</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openModal(b)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(b.building_id)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? `แก้ไขข้อมูลอาคาร #${editingId}` : 'เพิ่มอาคารใหม่'}</h3>
              <button className="icon-btn close-modal-btn" onClick={() => setModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  ชื่ออาคาร หรือ คณะ <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น อาคารคณะศิลปศาสตร์"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>คำอธิบายอาคาร / จุดสังเกตใกล้เคียง</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="เช่น อาคารเรียนรวม ใกล้ประตูท่าพระจันทร์"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                บันทึกอาคาร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
