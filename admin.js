/* =========================================
   1. Mock Data (จำลองข้อมูลฐานข้อมูลกลาง)
   ========================================= */
// ข้อมูลห้องน้ำ (อ้างอิงฟีเจอร์จาก Proposal)
let toiletsData = [
    { id: 'T001', building: 'คณะศิลปศาสตร์', floor: 'ชั้น 1', type: 'แยกเพศชาย/หญิง', hasBidet: true, hasAccessible: true, status: 'ปกติ', rating: 4.8 },
    { id: 'T002', building: 'คณะนิติศาสตร์', floor: 'ชั้น 2', type: 'แยกเพศชาย/หญิง', hasBidet: true, hasAccessible: false, status: 'ทำความสะอาด', rating: 4.2 },
    { id: 'T003', building: 'หอสมุดปรีดี พนมยงค์', floor: 'ชั้น U1', type: 'ห้องน้ำรวม (All Gender)', hasBidet: false, hasAccessible: true, status: 'ชำรุด', rating: 3.5 },
    { id: 'T004', building: 'คณะพาณิชยศาสตร์และการบัญชี', floor: 'ชั้น G', type: 'แยกเพศชาย/หญิง', hasBidet: true, hasAccessible: true, status: 'ปกติ', rating: 4.5 }
];

// ข้อมูลรายงานปัญหา[cite: 12]
let reportsData = [
    { id: 'R1001', date: '2026-10-19', toiletId: 'T003', building: 'หอสมุดปรีดี พนมยงค์ - ชั้น U1', issue: 'ก๊อกน้ำอ่างล้างมือหัก น้ำพุ่ง', status: 'รอตรวจสอบ' },
    { id: 'R1002', date: '2026-10-18', toiletId: 'T002', building: 'คณะนิติศาสตร์ - ชั้น 2', issue: 'ทิชชู่หมด และพื้นเปียกมาก', status: 'กำลังดำเนินการ' },
    { id: 'R1003', date: '2026-10-15', toiletId: 'T001', building: 'คณะศิลปศาสตร์ - ชั้น 1', issue: 'สายฉีดชำระน้ำรั่ว', status: 'ปิดงานแล้ว' }
];

// ข้อมูลรีวิว[cite: 12]
let reviewsData = [
    { id: 'REV-01', date: '2026-10-19', toilet: 'คณะศิลปศาสตร์ - ชั้น 1', rating: 5, comment: 'สะอาดมาก แม่บ้านดูแลดีครับ' },
    { id: 'REV-02', date: '2026-10-17', toilet: 'หอสมุดปรีดี พนมยงค์ - ชั้น U1', rating: 3, comment: 'ค่อนข้างมืด และก๊อกน้ำบางอันใช้ไม่ได้' },
    { id: 'REV-03', date: '2026-10-16', toilet: 'คณะนิติศาสตร์ - ชั้น 2', rating: 4, comment: 'สะอาดดี แต่ช่วงบ่ายคนเยอะ' }
];

/* =========================================
   2. Main Application Logic
   ========================================= */
const app = {
    init() {
        this.bindEvents();
        // ตรวจสอบสถานะจำลอง (ในระบบจริงควรเช็ค Token ใน LocalStorage/Cookie)
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
        if (isLoggedIn === 'true') {
            this.showApp();
        }
    },

    bindEvents() {
        // --- Login Events ---
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('toggle-password-btn').addEventListener('click', this.togglePassword);
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // --- Sidebar Events ---
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.nav-item').getAttribute('data-target');
                this.switchPage(target);
                // ปิด Sidebar บนมือถือเมื่อกดเลือกเมนู
                if(window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('open');
                }
            });
        });
        document.getElementById('open-sidebar-btn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('open');
        });
        document.getElementById('close-sidebar-btn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
        });

        // --- Toilet Management Events ---
        document.getElementById('add-toilet-btn').addEventListener('click', () => {
            document.getElementById('toilet-form').reset();
            document.getElementById('form-toilet-id').value = '';
            document.getElementById('toilet-modal-title').innerText = 'เพิ่มข้อมูลห้องน้ำ';
            this.openModal('toilet-modal');
        });
        
        document.getElementById('save-toilet-btn').addEventListener('click', () => this.saveToilet());

        // --- Modal Close Events ---
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                this.closeModal(modal.id);
            });
        });

        // --- Report Action ---
        document.getElementById('save-report-btn').addEventListener('click', () => this.saveReportStatus());
    },

    /* --- Auth Logic --- */
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        const errorEl = document.getElementById('login-error');

        // จำลองการตรวจสอบ (Mock Validation)
        if (email === 'admin@tu.ac.th' && password === '1234') {
            errorEl.classList.add('hidden');
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showToast('เข้าสู่ระบบสำเร็จ', 'success');
            this.showApp();
        } else {
            errorEl.classList.remove('hidden');
        }
    },

    handleLogout() {
        sessionStorage.removeItem('adminLoggedIn');
        document.getElementById('app-view').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('login-view').classList.add('active');
        this.showToast('ออกจากระบบแล้ว', 'success');
    },

    togglePassword() {
        const input = document.getElementById('password-input');
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    },

    /* --- View Management --- */
    showApp() {
        document.getElementById('login-view').classList.remove('active');
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('app-view').classList.remove('hidden');
        this.switchPage('page-dashboard');
    },

    switchPage(pageId) {
        // อัปเดตเมนู
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-item[data-target="${pageId}"]`);
        if(activeBtn) {
            activeBtn.classList.add('active');
            document.getElementById('current-page-title').innerText = activeBtn.innerText.replace(/[^\u0E00-\u0E7Fa-zA-Z\s]/g, '').trim(); // ลบ Emoji ออกจาก Header
        }

        // ซ่อนหน้าทั้งหมด และแสดงหน้าที่เลือก
        document.querySelectorAll('.page-section').forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden');
        });
        document.getElementById(pageId).classList.remove('hidden');
        document.getElementById(pageId).classList.add('active');

        // รันฟังก์ชันวาดข้อมูลตามหน้าที่เปิด
        if (pageId === 'page-dashboard') this.renderDashboard();
        if (pageId === 'page-toilets') this.renderToilets();
        if (pageId === 'page-reports') this.renderReports();
        if (pageId === 'page-reviews') this.renderReviews();
    },

    /* --- Data Rendering --- */
    renderDashboard() {
        document.getElementById('stat-total-toilets').innerText = toiletsData.length;
        document.getElementById('stat-normal-toilets').innerText = toiletsData.filter(t => t.status === 'ปกติ').length;
        document.getElementById('stat-cleaning-toilets').innerText = toiletsData.filter(t => t.status === 'ทำความสะอาด').length;
        document.getElementById('stat-broken-toilets').innerText = toiletsData.filter(t => t.status === 'ชำรุด').length;

        // รายงานล่าสุด
        const tbody = document.querySelector('#dashboard-reports-table tbody');
        tbody.innerHTML = reportsData.slice(0, 3).map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.building}</td>
                <td class="text-danger">${r.issue}</td>
                <td><span class="badge ${r.status === 'ปิดงานแล้ว' ? 'success' : 'warning'}">${r.status}</span></td>
            </tr>
        `).join('');
    },

    renderToilets() {
        const tbody = document.querySelector('#toilets-table tbody');
        tbody.innerHTML = toiletsData.map(t => {
            let statusBadge = t.status === 'ปกติ' ? 'success' : (t.status === 'ชำรุด' ? 'danger' : 'warning');
            let statusIcon = t.status === 'ปกติ' ? '✅' : (t.status === 'ชำรุด' ? '🚫' : '🧹');
            let facHtml = (t.hasBidet ? '💦 ' : '') + (t.hasAccessible ? '♿️ ' : '');
            
            return `
            <tr>
                <td>${t.id}</td>
                <td><b>${t.building}</b><br><span class="text-muted text-sm">${t.floor}</span></td>
                <td>${facHtml || '-'}</td>
                <td>⭐ ${t.rating}</td>
                <td><span class="badge ${statusBadge}">${statusIcon} ${t.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.editToilet('${t.id}')">แก้ไข</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteToilet('${t.id}')">ลบ</button>
                </td>
            </tr>
        `}).join('');
    },

    renderReports() {
        const tbody = document.querySelector('#reports-table tbody');
        tbody.innerHTML = reportsData.map(r => {
            let statusBadge = r.status === 'ปิดงานแล้ว' ? 'success' : 'warning';
            return `
            <tr>
                <td>${r.id}</td>
                <td>${r.date}</td>
                <td>${r.building}</td>
                <td class="text-danger">${r.issue}</td>
                <td><span class="badge ${statusBadge}">${r.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.openReportDetail('${r.id}')">จัดการ</button>
                </td>
            </tr>
        `}).join('');
    },

    renderReviews() {
        const tbody = document.querySelector('#reviews-table tbody');
        tbody.innerHTML = reviewsData.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.date}</td>
                <td>${r.toilet}</td>
                <td style="color:var(--warning)">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</td>
                <td>${r.comment}</td>
            </tr>
        `).join('');
    },

    /* --- Form Actions --- */
    editToilet(id) {
        const t = toiletsData.find(x => x.id === id);
        if(!t) return;
        document.getElementById('form-toilet-id').value = t.id;
        document.getElementById('form-building').value = t.building;
        document.getElementById('form-floor').value = t.floor;
        document.getElementById('form-type').value = t.type;
        document.getElementById('form-status').value = t.status;
        document.getElementById('form-has-bidet').checked = t.hasBidet;
        document.getElementById('form-has-accessible').checked = t.hasAccessible;
        
        document.getElementById('toilet-modal-title').innerText = 'แก้ไขข้อมูลห้องน้ำ ' + t.id;
        this.openModal('toilet-modal');
    },

    saveToilet() {
        const id = document.getElementById('form-toilet-id').value;
        const b = document.getElementById('form-building').value;
        const f = document.getElementById('form-floor').value;
        
        if(!b || !f) {
            this.showToast('กรุณากรอกอาคารและชั้นให้ครบถ้วน', 'error');
            return;
        }

        const newData = {
            id: id || 'T00' + (toiletsData.length + 1),
            building: b,
            floor: f,
            type: document.getElementById('form-type').value,
            status: document.getElementById('form-status').value,
            hasBidet: document.getElementById('form-has-bidet').checked,
            hasAccessible: document.getElementById('form-has-accessible').checked,
            rating: id ? toiletsData.find(x=>x.id===id).rating : 0 // ถ้าของใหม่ให้เรตติ้ง 0
        };

        if(id) {
            const index = toiletsData.findIndex(x => x.id === id);
            toiletsData[index] = newData;
            this.showToast('อัปเดตข้อมูลสำเร็จ', 'success');
        } else {
            toiletsData.push(newData);
            this.showToast('เพิ่มห้องน้ำใหม่สำเร็จ', 'success');
        }

        this.closeModal('toilet-modal');
        this.renderToilets();
    },

    deleteToilet(id) {
        if(confirm(`คุณต้องการลบข้อมูลห้องน้ำรหัส ${id} ใช่หรือไม่?\nข้อมูลรีวิวที่เกี่ยวข้องอาจได้รับผลกระทบ`)) {
            toiletsData = toiletsData.filter(t => t.id !== id);
            this.renderToilets();
            this.showToast('ลบข้อมูลสำเร็จ', 'success');
        }
    },

    /* --- Report Actions --- */
    openReportDetail(id) {
        const r = reportsData.find(x => x.id === id);
        document.getElementById('report-modal-id').innerText = `(${r.id})`;
        document.getElementById('report-modal-location').innerText = r.building;
        document.getElementById('report-modal-issue').innerText = r.issue;
        document.getElementById('report-modal-status').value = r.status;
        document.getElementById('report-modal').setAttribute('data-current-id', r.id);
        this.openModal('report-modal');
    },

    saveReportStatus() {
        const id = document.getElementById('report-modal').getAttribute('data-current-id');
        const newStatus = document.getElementById('report-modal-status').value;
        const index = reportsData.findIndex(x => x.id === id);
        
        if(index > -1) {
            reportsData[index].status = newStatus;
            this.showToast('อัปเดตสถานะรายงานสำเร็จ', 'success');
            this.closeModal('report-modal');
            this.renderReports();
        }
    },

    /* --- UI Helpers --- */
    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Start application
document.addEventListener('DOMContentLoaded', () => app.init());