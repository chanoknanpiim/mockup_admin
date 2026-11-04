'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/AdminDataContext';

export default function UsersPage() {
  const { users, admins, saveUser, deleteUser } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('นักศึกษา');
  const [phone, setPhone] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const openModal = () => {
    setDisplayName('');
    setRole('นักศึกษา');
    setPhone('');
    setIsAdmin(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const ok = await saveUser({
      display_name: displayName,
      role,
      phone,
      isAdmin,
    });
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('ยืนยันการลบผู้ใช้งานนี้?')) return;
    await deleteUser(userId);
  };

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>รายชื่อผู้ใช้งานและผู้ดูแลระบบ (ตาราง Users และ admin)</strong>
          <p>จัดการข้อมูลผู้ใช้งานในระบบและกำหนดสิทธิ์ผู้ดูแลระบบ</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          + เพิ่มผู้ใช้งานใหม่
        </button>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัสผู้ใช้ (User ID)</th>
                <th>ชื่อที่แสดง (Display Name)</th>
                <th>กลุ่มผู้ใช้ (Role)</th>
                <th>เบอร์โทรศัพท์</th>
                <th>สิทธิ์ผู้ดูแล (Admin)</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const userIsAdmin = admins.some(
                  (a) => Number(a.user_id) === Number(u.user_id) && a.is_active
                );
                return (
                  <tr key={u.user_id}>
                    <td>
                      <b>#{u.user_id}</b>
                    </td>
                    <td>
                      <b>{u.display_name}</b>
                    </td>
                    <td>{u.role || 'นักศึกษา'}</td>
                    <td>{u.phone || '-'}</td>
                    <td>
                      {userIsAdmin ? (
                        <span className="badge success">ผู้ดูแลระบบ (Admin)</span>
                      ) : (
                        <span className="text-muted text-sm">ผู้ใช้ทั่วไป</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(u.user_id)}
                      >
                        ลบ
                      </button>
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
              <h3>เพิ่มผู้ใช้งานในระบบ</h3>
              <button className="icon-btn close-modal-btn" onClick={() => setModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  ชื่อที่ใช้แสดงผล (Display Name) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น สมชาย ใจดี"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>กลุ่มผู้ใช้ (Role)</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="นักศึกษา">นักศึกษา</option>
                  <option value="บุคลากร">บุคลากร</option>
                  <option value="อาจารย์">อาจารย์</option>
                </select>
              </div>
              <div className="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                  />
                  <span>แต่งตั้งเป็นผู้ดูแลระบบ (เพิ่มลงตาราง admin)</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                บันทึกผู้ใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
