/* =========================================
1. ตั้งค่าการเชื่อมต่อ Supabase & ข้อมูลเริ่มต้น
========================================= */
// หากต้องการฝังค่าถาวร สามารถนำ URL และ Publishable Key มาใส่ใน '' ด้านล่างนี้ได้เลย
const DEFAULT_SUPABASE_URL = ''; 
const DEFAULT_SUPABASE_KEY = '';

let supabaseClient = null;
let currentPhotoDataUrl = ''; // เก็บรูปภาพที่ผู้ใช้เลือกตอนแจ้งซ่อม

// ข้อมูลเริ่มต้น (อ้างอิงตามโครงสร้างตารางใน Supabase ของโปรเจกต์ "ปลดปล่อย")
let buildingsData = [
    { building_id: 1, building_name: 'คณะศิลปศาสตร์', description: 'อาคารเรียนรวมและโถงอ่านหนังสือ ใกล้ประตูท่าพระจันทร์' },
    { building_id: 2, building_name: 'คณะนิติศาสตร์', description: 'อาคารเรียนติดสนามฟุตบอล' },
    { building_id: 3, building_name: 'หอสมุดปรีดี พนมยงค์', description: 'ห้องสมุดใต้ดิน เปิดให้บริการทุกวัน' },
    { building_id: 4, building_name: 'คณะพาณิชยศาสตร์และการบัญชี', description: 'อาคารริมแม่น้ำเจ้าพระยา' }
];

let locationsData = [
    { location_id: 1, building_id: 1, floor: 1, room_name: 'โถงลิฟต์หลัก ชั้น 1', description: 'เดินตรงจากทางเข้าหลัก เลี้ยวซ้ายข้างลิฟต์' },
    { location_id: 2, building_id: 2, floor: 2, room_name: 'หน้าห้องบรรยาย 201', description: 'อยู่สุดทางเดินฝั่งทิศเหนือ' },
    { location_id: 3, building_id: 3, floor: 1, room_name: 'โซนทางเข้า U1', description: 'ด้านหลังเคาน์เตอร์ยืม-คืนหนังสือ' }
];

// ลบไอคอนที่เป็นอิโมจิออกทั้งหมดตามโจทย์
let amenitiesData = [
    { amenity_id: 1, amenity_name: 'สายฉีดชำระ' },
    { amenity_id: 2, amenity_name: 'ห้องน้ำผู้พิการ' },
    { amenity_id: 3, amenity_name: 'กระดาษทิชชู่' },
    { amenity_id: 4, amenity_name: 'สบู่ล้างมือ' }
];

let toiletsData = [
    { toilet_id: 101, building_id: 1, floor: 1, location_lat: 13.7563, location_lng: 100.4902, location_text: 'ข้างลิฟต์ฝั่งทิศเหนือ', toilet_type: 'แยกเพศ', has_bidet: true, has_disabled_access: true, status: 'ปกติ' },
    { toilet_id: 102, building_id: 2, floor: 2, location_lat: 13.7558, location_lng: 100.4910, location_text: 'ติดบันไดกลาง ชั้น 2', toilet_type: 'แยกเพศ', has_bidet: true, has_disabled_access: false, status: 'ทำความสะอาด' },
    { toilet_id: 103, building_id: 3, floor: 1, location_lat: 13.7570, location_lng: 100.4895, location_text: 'ชั้น U1 โซนอ่านหนังสือ', toilet_type: 'รวม', has_bidet: false, has_disabled_access: true, status: 'ชำรุด' },
    { toilet_id: 104, building_id: 4, floor: 1, location_lat: 13.7565, location_lng: 100.4890, location_text: 'ชั้น G ใกล้ทางออกท่าเรือ', toilet_type: 'แยกเพศ', has_bidet: true, has_disabled_access: true, status: 'ปกติ' }
];

let toiletAmenitiesData = [
    { toilet_amenities_id: 1, toilet_id: 101, amenity_id: 1 },
    { toilet_amenities_id: 2, toilet_id: 101, amenity_id: 2 },
    { toilet_amenities_id: 3, toilet_id: 101, amenity_id: 3 },
    { toilet_amenities_id: 4, toilet_id: 102, amenity_id: 1 },
    { toilet_amenities_id: 5, toilet_id: 103, amenity_id: 2 },
    { toilet_amenities_id: 6, toilet_id: 104, amenity_id: 1 },
    { toilet_amenities_id: 7, toilet_id: 104, amenity_id: 2 },
    { toilet_amenities_id: 8, toilet_id: 104, amenity_id: 4 }
];

let usersData = [
    { user_id: 1, display_name: 'ชนกนันท์ (Admin)', role: 'นักศึกษา', phone: '081-111-2222' },
    { user_id: 2, display_name: 'อรณัฐ (Developer)', role: 'นักศึกษา', phone: '089-333-4444' },
    { user_id: 3, display_name: 'สุพิชญา (Scrum Master)', role: 'นักศึกษา', phone: '086-555-6666' }
];

let adminsData = [
    { admin_id: 1, user_id: 1, is_active: true },
    { admin_id: 2, user_id: 2, is_active: true }
];

let reportsData = [
    { report_id: 1001, created_at: '2026-11-02 09:30', toilet_id: 103, user_id: 2, status_type: 'ประตูปิดซ่อม', status_detail: 'ก๊อกน้ำอ่างล้างมือหัก น้ำพุ่งตลอดเวลา', photo_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80' },
    { report_id: 1002, created_at: '2026-11-02 10:15', toilet_id: 102, user_id: 3, status_type: 'ปิดทำความสะอาด', status_detail: 'แม่บ้านกำลังล้างพื้นห้องน้ำ คาดว่าเสร็จใน 30 นาที', photo_url: '' }
];

let reviewsData = [
    { review_id: 'REV-01', created_at: '2026-11-01', toilet_id: 101, user_id: 2, rating: 5, review_text: 'สะอาดมาก มีสายฉีดชำระและทิชชู่ครบครับ' },
    { review_id: 'REV-02', created_at: '2026-11-01', toilet_id: 103, user_id: 3, rating: 3, review_text: 'แอร์เย็นดี แต่ก๊อกน้ำอ่างล้างมือชำรุด 1 จุด' },
    { review_id: 'REV-03', created_at: '2026-10-30', toilet_id: 104, user_id: 1, rating: 5, review_text: 'ห้องน้ำกว้างขวาง สะอาด ลมโกรกดีมาก' }
];

/* =========================================
2. ระบบการทำงานหลัก (Application Controller)
========================================= */
const app = {
    async init() {
        this.loadSavedSettings();
        this.bindEvents();
        
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            await this.showApp();
        }
    },

    loadSavedSettings() {
        const savedUrl = localStorage.getItem('plodploi_supabase_url') || DEFAULT_SUPABASE_URL;
        const savedKey = localStorage.getItem('plodploi_supabase_key') || DEFAULT_SUPABASE_KEY;
        const savedBucket = localStorage.getItem('plodploi_storage_bucket') || 'report-photos';

        document.getElementById('setting-supabase-url').value = savedUrl;
        document.getElementById('setting-supabase-key').value = savedKey;
        document.getElementById('setting-storage-bucket').value = savedBucket;

        if (savedUrl && savedKey && window.supabase) {
            try {
                supabaseClient = window.supabase.createClient(savedUrl, savedKey);
                this.updateConnectionBadge(true);
            } catch (err) {
                console.error('Supabase init error:', err);
                this.updateConnectionBadge(false);
            }
        } else {
            this.updateConnectionBadge(false);
        }
    },

    updateConnectionBadge(isConnected) {
        const badge = document.getElementById('db-connection-badge');
        if (isConnected) {
            badge.className = 'badge success';
            badge.innerText = 'เชื่อมต่อ Supabase จริงแล้ว';
        } else {
            badge.className = 'badge warning';
            badge.innerText = 'โหมดข้อมูลจำลอง (ตั้งค่า DB ได้ที่เมนูซ้ายล่าง)';
        }
    },

    /* --- ดึงข้อมูลจริงจากทุกตารางใน Supabase --- */
    async syncFromSupabase() {
        if (!supabaseClient) {
            this.renderAllViews();
            return;
        }

        try {
            const [bRes, lRes, aRes, tRes, taRes, rRes, revRes, uRes, admRes] = await Promise.all([
                supabaseClient.from('buildings').select('*').order('building_id'),
                supabaseClient.from('locations').select('*').order('location_id'),
                supabaseClient.from('amenities').select('*').order('amenity_id'),
                supabaseClient.from('toilets').select('*').order('toilet_id'),
                supabaseClient.from('toilet_amenities').select('*'),
                supabaseClient.from('reports').select('*').order('created_at', { ascending: false }),
                supabaseClient.from('reviews').select('*').order('created_at', { ascending: false }),
                supabaseClient.from('Users').select('*').order('user_id'),
                supabaseClient.from('admin').select('*')
            ]);

            if (!bRes.error && bRes.data) buildingsData = bRes.data;
            if (!lRes.error && lRes.data) locationsData = lRes.data;
            if (!aRes.error && aRes.data) amenitiesData = aRes.data;
            if (!tRes.error && tRes.data) toiletsData = tRes.data;
            if (!taRes.error && taRes.data) toiletAmenitiesData = taRes.data;
            if (!rRes.error && rRes.data) reportsData = rRes.data;
            if (!revRes.error && revRes.data) reviewsData = revRes.data;
            if (!uRes.error && uRes.data) usersData = uRes.data;
            if (!admRes.error && admRes.data) adminsData = admRes.data;

            this.updateConnectionBadge(true);
            this.renderAllViews();
        } catch (err) {
            this.showToast('ไม่สามารถดึงข้อมูลจาก Supabase ได้: ' + err.message, 'error');
        }
    },

    bindEvents() {
        // การเข้าสู่ระบบ
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('toggle-password-btn').addEventListener('click', this.togglePassword);
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('sync-data-btn').addEventListener('click', async () => {
            await this.syncFromSupabase();
            this.showToast('อัปเดตข้อมูลล่าสุดเรียบร้อยแล้ว', 'success');
        });

        // เมนู Sidebar
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.nav-item').getAttribute('data-target');
                this.switchPage(target);
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('open');
                }
            });
        });
        document.getElementById('open-sidebar-btn').addEventListener('click', () => document.getElementById('sidebar').classList.add('open'));
        document.getElementById('close-sidebar-btn').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

        // ปิด Modal ทุกตัว
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                this.closeModal(modal.id);
            });
        });

        // 1. เหตุการณ์จัดการห้องน้ำ (Toilets)
        document.getElementById('add-toilet-btn').addEventListener('click', () => this.openToiletModal());
        document.getElementById('save-toilet-btn').addEventListener('click', () => this.saveToilet());
        document.getElementById('search-toilet').addEventListener('input', () => this.renderToilets());
        document.getElementById('filter-building-toilet').addEventListener('change', () => this.renderToilets());
        document.getElementById('filter-status-toilet').addEventListener('change', () => this.renderToilets());

        // 2. เหตุการณ์จัดการอาคาร (Buildings)
        document.getElementById('add-building-btn').addEventListener('click', () => this.openBuildingModal());
        document.getElementById('save-building-btn').addEventListener('click', () => this.saveBuilding());

        // 3. เหตุการณ์จัดการจุดอ้างอิง (Locations)
        document.getElementById('add-location-btn').addEventListener('click', () => this.openLocationModal());
        document.getElementById('save-location-btn').addEventListener('click', () => this.saveLocation());

        // 4. เหตุการณ์จัดการสิ่งอำนวยความสะดวก (Amenities)
        document.getElementById('add-amenity-btn').addEventListener('click', () => this.openAmenityModal());
        document.getElementById('save-amenity-btn').addEventListener('click', () => this.saveAmenity());

        // 5. เหตุการณ์แจ้งปัญหา + อัปโหลดรูปภาพ (Reports)
        document.getElementById('add-report-btn').addEventListener('click', () => this.openNewReportModal());
        document.getElementById('form-report-photo').addEventListener('change', (e) => this.handlePhotoSelect(e));
        document.getElementById('remove-photo-btn').addEventListener('click', () => this.clearSelectedPhoto());
        document.getElementById('submit-new-report-btn').addEventListener('click', () => this.submitNewReport());
        document.getElementById('filter-type-report').addEventListener('change', () => this.renderReports());
        document.getElementById('update-report-toilet-btn').addEventListener('click', () => this.updateToiletStatusFromReport());
        document.getElementById('delete-report-btn').addEventListener('click', () => this.deleteReportFromModal());

        // 6. เหตุการณ์ผู้ใช้งาน & ตั้งค่า
        document.getElementById('add-user-btn').addEventListener('click', () => {
            document.getElementById('user-form').reset();
            this.openModal('user-modal');
        });
        document.getElementById('save-user-btn').addEventListener('click', () => this.saveUser());
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSupabaseSettings());
        document.getElementById('clear-settings-btn').addEventListener('click', () => this.clearSupabaseSettings());
    },

    /* --- ระบบเข้าสู่ระบบ --- */
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email-input').value.trim();
        const password = document.getElementById('password-input').value.trim();
        const errorEl = document.getElementById('login-error');

        if (email === 'admin@tu.ac.th' && password === '1234') {
            errorEl.classList.add('hidden');
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showToast('เข้าสู่ระบบผู้ดูแลสำเร็จ', 'success');
            await this.showApp();
        } else {
            errorEl.classList.remove('hidden');
        }
    },

    handleLogout() {
        sessionStorage.removeItem('adminLoggedIn');
        document.getElementById('app-view').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('login-view').classList.add('active');
        this.showToast('ออกจากระบบเรียบร้อยแล้ว', 'success');
    },

    togglePassword() {
        const input = document.getElementById('password-input');
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    async showApp() {
        document.getElementById('login-view').classList.remove('active');
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('app-view').classList.remove('hidden');
        await this.syncFromSupabase();
        this.switchPage('page-dashboard');
    },

    switchPage(pageId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-item[data-target="${pageId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            document.getElementById('current-page-title').innerText = activeBtn.querySelector('span').innerText;
        }

        document.querySelectorAll('.page-section').forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden');
        });
        const targetSection = document.getElementById(pageId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        }

        this.renderAllViews();
    },

    /* =========================================
    3. ฟังก์ชันวาดข้อมูลขึ้นหน้าจอ (Render Views)
    ========================================= */
    renderAllViews() {
        this.populateBuildingDropdowns();
        this.renderDashboard();
        this.renderToilets();
        this.renderBuildings();
        this.renderLocations();
        this.renderAmenities();
        this.renderReports();
        this.renderReviews();
        this.renderUsers();
        document.getElementById('report-badge').innerText = reportsData.length;
    },

    getBuildingName(buildingId) {
        const b = buildingsData.find(x => Number(x.building_id) === Number(buildingId));
        return b ? b.building_name : 'ไม่ระบุอาคาร';
    },

    getToiletLabel(toiletId) {
        const t = toiletsData.find(x => Number(x.toilet_id) === Number(toiletId));
        if (!t) return `ห้องน้ำรหัส #${toiletId}`;
        return `${this.getBuildingName(t.building_id)} (ชั้น ${t.floor}) - ${t.location_text || ''}`;
    },

    populateBuildingDropdowns() {
        const filterEl = document.getElementById('filter-building-toilet');
        const currentFilter = filterEl.value;
        filterEl.innerHTML = `<option value="">แสดงทุกอาคาร</option>` +
            buildingsData.map(b => `<option value="${b.building_id}">${b.building_name}</option>`).join('');
        filterEl.value = currentFilter;

        const buildingOptions = buildingsData.map(b => `<option value="${b.building_id}">${b.building_name}</option>`).join('');
        document.getElementById('form-toilet-building').innerHTML = buildingOptions;
        document.getElementById('form-location-building').innerHTML = buildingOptions;
    },

    renderDashboard() {
        const total = toiletsData.length;
        const normal = toiletsData.filter(t => t.status === 'ปกติ').length;
        const cleaning = toiletsData.filter(t => t.status === 'ทำความสะอาด').length;
        const broken = toiletsData.filter(t => t.status === 'ชำรุด').length;

        document.getElementById('stat-total-toilets').innerText = total;
        document.getElementById('stat-normal-toilets').innerText = normal;
        document.getElementById('stat-cleaning-toilets').innerText = cleaning;
        document.getElementById('stat-broken-toilets').innerText = broken;

        // คำนวณกราฟวงกลมจริง
        const pNormal = total ? Math.round((normal / total) * 100) : 0;
        const pCleaning = total ? Math.round((cleaning / total) * 100) : 0;
        const pBroken = total ? Math.max(0, 100 - pNormal - pCleaning) : 0;

        document.getElementById('pct-normal').innerText = pNormal;
        document.getElementById('pct-cleaning').innerText = pCleaning;
        document.getElementById('pct-broken').innerText = pBroken;

        const deg1 = pNormal;
        const deg2 = pNormal + pCleaning;
        document.getElementById('status-pie-chart').style.background =
            `conic-gradient(var(--success) 0% ${deg1}%, var(--warning) ${deg1}% ${deg2}%, var(--danger) ${deg2}% 100%)`;

        const tbody = document.querySelector('#dashboard-reports-table tbody');
        if (reportsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ไม่มีรายการแจ้งซ่อมค้างในระบบ</td></tr>`;
            return;
        }

        tbody.innerHTML = reportsData.slice(0, 4).map(r => {
            const toilet = toiletsData.find(t => Number(t.toilet_id) === Number(r.toilet_id));
            const tStatus = toilet ? toilet.status : 'ปกติ';
            const badgeClass = tStatus === 'ปกติ' ? 'success' : (tStatus === 'ชำรุด' ? 'danger' : 'warning');
            const imgHtml = r.photo_url ? `<img src="${r.photo_url}" class="thumb-img" onclick="app.openReportDetail(${r.report_id})">` : '<span class="text-muted text-sm">ไม่มีรูป</span>';

            return `
            <tr>
                <td>${(r.created_at || '').slice(0, 16)}</td>
                <td><b>${this.getToiletLabel(r.toilet_id)}</b></td>
                <td><span class="text-danger"><b>${r.status_type}</b></span>: ${r.status_detail || '-'}</td>
                <td>${imgHtml}</td>
                <td><span class="badge ${badgeClass}">${tStatus}</span></td>
            </tr>`;
        }).join('');
    },

    renderToilets() {
        const search = document.getElementById('search-toilet').value.trim().toLowerCase();
        const buildingFilter = document.getElementById('filter-building-toilet').value;
        const statusFilter = document.getElementById('filter-status-toilet').value;

        const filtered = toiletsData.filter(t => {
            const bName = this.getBuildingName(t.building_id).toLowerCase();
            const locText = (t.location_text || '').toLowerCase();
            const matchSearch = !search || bName.includes(search) || locText.includes(search);
            const matchBuilding = !buildingFilter || String(t.building_id) === String(buildingFilter);
            const matchStatus = !statusFilter || t.status === statusFilter;
            return matchSearch && matchBuilding && matchStatus;
        });

        const tbody = document.querySelector('#toilets-table tbody');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">ไม่พบข้อมูลห้องน้ำตามเงื่อนไขที่เลือก</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(t => {
            const statusBadge = t.status === 'ปกติ' ? 'success' : (t.status === 'ชำรุด' ? 'danger' : 'warning');

            // ดึงสิ่งอำนวยความสะดวกจากตารางเชื่อม toilet_amenities
            const linkedIds = toiletAmenitiesData
                .filter(ta => Number(ta.toilet_id) === Number(t.toilet_id))
                .map(ta => Number(ta.amenity_id));

            let tags = amenitiesData
                .filter(a => linkedIds.includes(Number(a.amenity_id)))
                .map(a => `<span class="amenity-tag">${a.amenity_name}</span>`)
                .join('');

            if (!tags) {
                if (t.has_bidet) tags += `<span class="amenity-tag">สายฉีดชำระ</span>`;
                if (t.has_disabled_access) tags += `<span class="amenity-tag">ผู้พิการ</span>`;
            }

            return `
            <tr>
                <td><b>#${t.toilet_id}</b></td>
                <td><b>${this.getBuildingName(t.building_id)}</b><br><span class="text-muted text-sm">ชั้น ${t.floor}</span></td>
                <td>${t.location_text || '-'}<br><span class="text-muted text-sm">พิกัด: ${t.location_lat || '-'}, ${t.location_lng || '-'}</span></td>
                <td>${t.toilet_type || 'แยกเพศ'}</td>
                <td>${tags || '<span class="text-muted text-sm">ไม่มีระบุ</span>'}</td>
                <td><span class="badge ${statusBadge}">${t.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.openToiletModal(${t.toilet_id})">แก้ไข</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteToilet(${t.toilet_id})">ลบ</button>
                </td>
            </tr>`;
        }).join('');
    },

    renderBuildings() {
        const tbody = document.querySelector('#buildings-table tbody');
        tbody.innerHTML = buildingsData.map(b => {
            const count = toiletsData.filter(t => Number(t.building_id) === Number(b.building_id)).length;
            return `
            <tr>
                <td><b>#${b.building_id}</b></td>
                <td><b>${b.building_name}</b></td>
                <td>${b.description || '-'}</td>
                <td><span class="badge success">${count} จุดห้องน้ำ</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.openBuildingModal(${b.building_id})">แก้ไข</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteBuilding(${b.building_id})">ลบ</button>
                </td>
            </tr>`;
        }).join('');
    },

    renderLocations() {
        const tbody = document.querySelector('#locations-table tbody');
        tbody.innerHTML = locationsData.map(loc => `
            <tr>
                <td><b>#${loc.location_id}</b></td>
                <td><b>${this.getBuildingName(loc.building_id)}</b></td>
                <td>ชั้น ${loc.floor}</td>
                <td><b>${loc.room_name}</b></td>
                <td>${loc.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.openLocationModal(${loc.location_id})">แก้ไข</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteLocation(${loc.location_id})">ลบ</button>
                </td>
            </tr>
        `).join('');
    },

    renderAmenities() {
        const tbody = document.querySelector('#amenities-table tbody');
        tbody.innerHTML = amenitiesData.map(a => `
            <tr>
                <td><b>#${a.amenity_id}</b></td>
                <td><b>${a.amenity_name}</b></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.openAmenityModal(${a.amenity_id})">แก้ไข</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteAmenity(${a.amenity_id})">ลบ</button>
                </td>
            </tr>
        `).join('');
    },

    renderReports() {
        const filterType = document.getElementById('filter-type-report').value;
        const filtered = reportsData.filter(r => !filterType || r.status_type === filterType);

        const tbody = document.querySelector('#reports-table tbody');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">ยังไม่มีรายการแจ้งปัญหาในหมวดนี้</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(r => {
            const imgHtml = r.photo_url
                ? `<img src="${r.photo_url}" class="thumb-img" title="คลิกเพื่อดูรูปใหญ่" onclick="app.openReportDetail(${r.report_id})">`
                : `<span class="text-muted text-sm">ไม่มีรูปแนบ</span>`;

            return `
            <tr>
                <td><b>#${r.report_id}</b></td>
                <td>${(r.created_at || '').slice(0, 16)}</td>
                <td><b>${this.getToiletLabel(r.toilet_id)}</b></td>
                <td><span class="badge danger">${r.status_type}</span></td>
                <td>${r.status_detail || '-'}</td>
                <td>${imgHtml}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.openReportDetail(${r.report_id})">ดูรูป / อัปเดตสถานะ</button>
                </td>
            </tr>`;
        }).join('');
    },

    renderReviews() {
        const tbody = document.querySelector('#reviews-table tbody');
        tbody.innerHTML = reviewsData.map(rev => {
            const u = usersData.find(x => Number(x.user_id) === Number(rev.user_id));
            return `
            <tr>
                <td><b>${rev.review_id}</b></td>
                <td>${(rev.created_at || '').slice(0, 10)}</td>
                <td><b>${this.getToiletLabel(rev.toilet_id)}</b></td>
                <td>${u ? u.display_name : 'ผู้ใช้งานทั่วไป'}</td>
                <td style="color:#F59E0B; font-size: 16px;">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)} (${rev.rating}/5)</td>
                <td>${rev.review_text || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteReview('${rev.review_id}')">ลบ</button>
                </td>
            </tr>`;
        }).join('');
    },

    renderUsers() {
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = usersData.map(u => {
            const isAdmin = adminsData.some(a => Number(a.user_id) === Number(u.user_id) && a.is_active);
            return `
            <tr>
                <td><b>#${u.user_id}</b></td>
                <td><b>${u.display_name}</b></td>
                <td>${u.role || 'นักศึกษา'}</td>
                <td>${u.phone || '-'}</td>
                <td>${isAdmin ? '<span class="badge success">ผู้ดูแลระบบ (Admin)</span>' : '<span class="text-muted text-sm">ผู้ใช้ทั่วไป</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteUser(${u.user_id})">ลบ</button>
                </td>
            </tr>`;
        }).join('');
    },

    /* =========================================
    4. CRUD ตารางที่ 1: ห้องน้ำ (Toilets & Toilet_Amenities)
    ========================================= */
    openToiletModal(toiletId = null) {
        document.getElementById('toilet-form').reset();
        this.populateBuildingDropdowns();

        // สร้าง Checkbox สิ่งอำนวยความสะดวกจากตาราง amenities
        const container = document.getElementById('form-toilet-amenities-list');
        container.innerHTML = amenitiesData.map(a => `
            <label class="checkbox-container">
                <input type="checkbox" class="toilet-amenity-cb" value="${a.amenity_id}" data-name="${a.amenity_name}">
                <span>${a.amenity_name}</span>
            </label>
        `).join('');

        if (toiletId) {
            const t = toiletsData.find(x => Number(x.toilet_id) === Number(toiletId));
            if (!t) return;
            document.getElementById('form-toilet-id').value = t.toilet_id;
            document.getElementById('form-toilet-building').value = t.building_id;
            document.getElementById('form-toilet-floor').value = t.floor;
            document.getElementById('form-toilet-location-text').value = t.location_text || '';
            document.getElementById('form-toilet-lat').value = t.location_lat || 13.7563;
            document.getElementById('form-toilet-lng').value = t.location_lng || 100.4902;
            document.getElementById('form-toilet-type').value = t.toilet_type || 'แยกเพศ';
            document.getElementById('form-toilet-status').value = t.status || 'ปกติ';

            const linkedIds = toiletAmenitiesData
                .filter(ta => Number(ta.toilet_id) === Number(t.toilet_id))
                .map(ta => Number(ta.amenity_id));

            document.querySelectorAll('.toilet-amenity-cb').forEach(cb => {
                cb.checked = linkedIds.includes(Number(cb.value));
            });

            document.getElementById('toilet-modal-title').innerText = `แก้ไขข้อมูลห้องน้ำ #${t.toilet_id}`;
        } else {
            document.getElementById('form-toilet-id').value = '';
            document.getElementById('toilet-modal-title').innerText = 'เพิ่มห้องน้ำจุดใหม่';
        }

        this.openModal('toilet-modal');
    },

    async saveToilet() {
        const id = document.getElementById('form-toilet-id').value;
        const building_id = Number(document.getElementById('form-toilet-building').value);
        const floor = Number(document.getElementById('form-toilet-floor').value);
        const location_text = document.getElementById('form-toilet-location-text').value.trim();
        const location_lat = parseFloat(document.getElementById('form-toilet-lat').value) || 13.7563;
        const location_lng = parseFloat(document.getElementById('form-toilet-lng').value) || 100.4902;
        const toilet_type = document.getElementById('form-toilet-type').value;
        const status = document.getElementById('form-toilet-status').value;

        if (!building_id || !location_text) {
            this.showToast('กรุณาเลือกอาคารและระบุจุดสังเกตให้ครบถ้วน', 'error');
            return;
        }

        const checkedBoxes = Array.from(document.querySelectorAll('.toilet-amenity-cb:checked'));
        const selectedAmenityIds = checkedBoxes.map(cb => Number(cb.value));
        const has_bidet = checkedBoxes.some(cb => cb.getAttribute('data-name').includes('สายฉีด'));
        const has_disabled_access = checkedBoxes.some(cb => cb.getAttribute('data-name').includes('พิการ'));

        const payload = {
            building_id, floor, location_text, location_lat, location_lng,
            toilet_type, status, has_bidet, has_disabled_access
        };

        let savedToiletId = id ? Number(id) : (toiletsData.reduce((max, x) => Math.max(max, Number(x.toilet_id)), 100) + 1);

        if (supabaseClient) {
            if (id) {
                const { error } = await supabaseClient.from('toilets').update(payload).eq('toilet_id', id);
                if (error) return this.showToast('บันทึกไม่สำเร็จ: ' + error.message, 'error');
            } else {
                const { data, error } = await supabaseClient.from('toilets').insert([payload]).select();
                if (error) return this.showToast('เพิ่มห้องน้ำไม่สำเร็จ: ' + error.message, 'error');
                if (data && data[0]) savedToiletId = data[0].toilet_id;
            }

            // อัปเดตตารางเชื่อม toilet_amenities
            await supabaseClient.from('toilet_amenities').delete().eq('toilet_id', savedToiletId);
            if (selectedAmenityIds.length > 0) {
                const taRows = selectedAmenityIds.map(aid => ({ toilet_id: savedToiletId, amenity_id: aid }));
                await supabaseClient.from('toilet_amenities').insert(taRows);
            }
            await this.syncFromSupabase();
        } else {
            if (id) {
                const idx = toiletsData.findIndex(x => Number(x.toilet_id) === Number(id));
                toiletsData[idx] = { ...toiletsData[idx], ...payload };
            } else {
                toiletsData.push({ toilet_id: savedToiletId, ...payload });
            }
            toiletAmenitiesData = toiletAmenitiesData.filter(ta => Number(ta.toilet_id) !== Number(savedToiletId));
            selectedAmenityIds.forEach(aid => {
                toiletAmenitiesData.push({ toilet_amenities_id: Date.now() + aid, toilet_id: savedToiletId, amenity_id: aid });
            });
            this.renderAllViews();
        }

        this.closeModal('toilet-modal');
        this.showToast('บันทึกข้อมูลห้องน้ำเรียบร้อยแล้ว', 'success');
    },

    async deleteToilet(toiletId) {
        if (!confirm(`ยืนยันการลบห้องน้ำรหัส #${toiletId} ใช่หรือไม่?`)) return;

        if (supabaseClient) {
            await supabaseClient.from('toilet_amenities').delete().eq('toilet_id', toiletId);
            const { error } = await supabaseClient.from('toilets').delete().eq('toilet_id', toiletId);
            if (error) return this.showToast('ลบไม่สำเร็จ: ' + error.message, 'error');
            await this.syncFromSupabase();
        } else {
            toiletsData = toiletsData.filter(t => Number(t.toilet_id) !== Number(toiletId));
            toiletAmenitiesData = toiletAmenitiesData.filter(ta => Number(ta.toilet_id) !== Number(toiletId));
            this.renderAllViews();
        }
        this.showToast('ลบข้อมูลห้องน้ำสำเร็จ', 'success');
    },

    /* =========================================
    5. CRUD ตารางที่ 2: อาคาร (Buildings)
    ========================================= */
    openBuildingModal(buildingId = null) {
        document.getElementById('building-form').reset();
        if (buildingId) {
            const b = buildingsData.find(x => Number(x.building_id) === Number(buildingId));
            if (!b) return;
            document.getElementById('form-building-id').value = b.building_id;
            document.getElementById('form-building-name').value = b.building_name;
            document.getElementById('form-building-desc').value = b.description || '';
            document.getElementById('building-modal-title').innerText = `แก้ไขข้อมูลอาคาร #${b.building_id}`;
        } else {
            document.getElementById('form-building-id').value = '';
            document.getElementById('building-modal-title').innerText = 'เพิ่มอาคารใหม่';
        }
        this.openModal('building-modal');
    },

    async saveBuilding() {
        const id = document.getElementById('form-building-id').value;
        const building_name = document.getElementById('form-building-name').value.trim();
        const description = document.getElementById('form-building-desc').value.trim();

        if (!building_name) return this.showToast('กรุณากรอกชื่ออาคาร', 'error');

        if (supabaseClient) {
            if (id) {
                const { error } = await supabaseClient.from('buildings').update({ building_name, description }).eq('building_id', id);
                if (error) return this.showToast(error.message, 'error');
            } else {
                const { error } = await supabaseClient.from('buildings').insert([{ building_name, description }]);
                if (error) return this.showToast(error.message, 'error');
            }
            await this.syncFromSupabase();
        } else {
            if (id) {
                const idx = buildingsData.findIndex(x => Number(x.building_id) === Number(id));
                buildingsData[idx] = { ...buildingsData[idx], building_name, description };
            } else {
                const newId = buildingsData.reduce((m, x) => Math.max(m, Number(x.building_id)), 0) + 1;
                buildingsData.push({ building_id: newId, building_name, description });
            }
            this.renderAllViews();
        }

        this.closeModal('building-modal');
        this.showToast('บันทึกข้อมูลอาคารสำเร็จ', 'success');
    },

    async deleteBuilding(buildingId) {
        if (!confirm('ยืนยันการลบอาคารนี้ใช่หรือไม่?')) return;
        if (supabaseClient) {
            const { error } = await supabaseClient.from('buildings').delete().eq('building_id', buildingId);
            if (error) return this.showToast('ลบไม่ได้ (อาจมีห้องน้ำผูกกับอาคารนี้อยู่): ' + error.message, 'error');
            await this.syncFromSupabase();
        } else {
            buildingsData = buildingsData.filter(b => Number(b.building_id) !== Number(buildingId));
            this.renderAllViews();
        }
        this.showToast('ลบอาคารเรียบร้อยแล้ว', 'success');
    },

    /* =========================================
    6. CRUD ตารางที่ 3: จุดอ้างอิงในอาคาร (Locations)
    ========================================= */
    openLocationModal(locationId = null) {
        document.getElementById('location-form').reset();
        this.populateBuildingDropdowns();
        if (locationId) {
            const loc = locationsData.find(x => Number(x.location_id) === Number(locationId));
            if (!loc) return;
            document.getElementById('form-location-id').value = loc.location_id;
            document.getElementById('form-location-building').value = loc.building_id;
            document.getElementById('form-location-floor').value = loc.floor;
            document.getElementById('form-location-room').value = loc.room_name;
            document.getElementById('form-location-desc').value = loc.description || '';
            document.getElementById('location-modal-title').innerText = `แก้ไขจุดอ้างอิง #${loc.location_id}`;
        } else {
            document.getElementById('form-location-id').value = '';
            document.getElementById('location-modal-title').innerText = 'เพิ่มจุดอ้างอิงในอาคาร';
        }
        this.openModal('location-modal');
    },

    async saveLocation() {
        const id = document.getElementById('form-location-id').value;
        const building_id = Number(document.getElementById('form-location-building').value);
        const floor = Number(document.getElementById('form-location-floor').value);
        const room_name = document.getElementById('form-location-room').value.trim();
        const description = document.getElementById('form-location-desc').value.trim();

        if (!room_name) return this.showToast('กรุณาระบุชื่อห้องหรือจุดอ้างอิง', 'error');

        const payload = { building_id, floor, room_name, description };
        if (supabaseClient) {
            if (id) {
                const { error } = await supabaseClient.from('locations').update(payload).eq('location_id', id);
                if (error) return this.showToast(error.message, 'error');
            } else {
                const { error } = await supabaseClient.from('locations').insert([payload]);
                if (error) return this.showToast(error.message, 'error');
            }
            await this.syncFromSupabase();
        } else {
            if (id) {
                const idx = locationsData.findIndex(x => Number(x.location_id) === Number(id));
                locationsData[idx] = { ...locationsData[idx], ...payload };
            } else {
                const newId = locationsData.reduce((m, x) => Math.max(m, Number(x.location_id)), 0) + 1;
                locationsData.push({ location_id: newId, ...payload });
            }
            this.renderAllViews();
        }

        this.closeModal('location-modal');
        this.showToast('บันทึกจุดอ้างอิงเรียบร้อยแล้ว', 'success');
    },

    async deleteLocation(locationId) {
        if (!confirm('ต้องการลบจุดอ้างอิงนี้ใช่หรือไม่?')) return;
        if (supabaseClient) {
            const { error } = await supabaseClient.from('locations').delete().eq('location_id', locationId);
            if (error) return this.showToast(error.message, 'error');
            await this.syncFromSupabase();
        } else {
            locationsData = locationsData.filter(l => Number(l.location_id) !== Number(locationId));
            this.renderAllViews();
        }
        this.showToast('ลบจุดอ้างอิงเรียบร้อยแล้ว', 'success');
    },

    /* =========================================
    7. CRUD ตารางที่ 4: สิ่งอำนวยความสะดวก (Amenities)
    ========================================= */
    openAmenityModal(amenityId = null) {
        document.getElementById('amenity-form').reset();
        if (amenityId) {
            const a = amenitiesData.find(x => Number(x.amenity_id) === Number(amenityId));
            if (!a) return;
            document.getElementById('form-amenity-id').value = a.amenity_id;
            document.getElementById('form-amenity-name').value = a.amenity_name;
            document.getElementById('amenity-modal-title').innerText = `แก้ไขสิ่งอำนวยความสะดวก #${a.amenity_id}`;
        } else {
            document.getElementById('form-amenity-id').value = '';
            document.getElementById('amenity-modal-title').innerText = 'เพิ่มสิ่งอำนวยความสะดวกใหม่';
        }
        this.openModal('amenity-modal');
    },

    async saveAmenity() {
        const id = document.getElementById('form-amenity-id').value;
        const amenity_name = document.getElementById('form-amenity-name').value.trim();

        if (!amenity_name) return this.showToast('กรุณากรอกชื่อสิ่งอำนวยความสะดวก', 'error');

        if (supabaseClient) {
            if (id) {
                const { error } = await supabaseClient.from('amenities').update({ amenity_name }).eq('amenity_id', id);
                if (error) return this.showToast(error.message, 'error');
            } else {
                const { error } = await supabaseClient.from('amenities').insert([{ amenity_name }]);
                if (error) return this.showToast(error.message, 'error');
            }
            await this.syncFromSupabase();
        } else {
            if (id) {
                const idx = amenitiesData.findIndex(x => Number(x.amenity_id) === Number(id));
                amenitiesData[idx] = { ...amenitiesData[idx], amenity_name };
            } else {
                const newId = amenitiesData.reduce((m, x) => Math.max(m, Number(x.amenity_id)), 0) + 1;
                amenitiesData.push({ amenity_id: newId, amenity_name });
            }
            this.renderAllViews();
        }

        this.closeModal('amenity-modal');
        this.showToast('บันทึกสิ่งอำนวยความสะดวกสำเร็จ', 'success');
    },

    async deleteAmenity(amenityId) {
        if (!confirm('ยืนยันการลบสิ่งอำนวยความสะดวกนี้ใช่หรือไม่?')) return;
        if (supabaseClient) {
            await supabaseClient.from('toilet_amenities').delete().eq('amenity_id', amenityId);
            const { error } = await supabaseClient.from('amenities').delete().eq('amenity_id', amenityId);
            if (error) return this.showToast(error.message, 'error');
            await this.syncFromSupabase();
        } else {
            amenitiesData = amenitiesData.filter(a => Number(a.amenity_id) !== Number(amenityId));
            this.renderAllViews();
        }
        this.showToast('ลบสิ่งอำนวยความสะดวกเรียบร้อยแล้ว', 'success');
    },

    /* =========================================
    8. ระบบแจ้งปัญหา & อัปโหลดรูปภาพ (Reports + Image Upload)
    ========================================= */
    openNewReportModal() {
        document.getElementById('new-report-form').reset();
        this.clearSelectedPhoto();
        const selectEl = document.getElementById('form-report-toilet');
        selectEl.innerHTML = toiletsData.map(t =>
            `<option value="${t.toilet_id}">${this.getToiletLabel(t.toilet_id)}</option>`
        ).join('');
        this.openModal('new-report-modal');
    },

    // ย่อและแปลงรูปภาพอัตโนมัติ เพื่อให้บันทึกได้ทั้งใน Supabase Storage และคอลัมน์ photo_url
    handlePhotoSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 700;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                    else { w = Math.round((w * maxDim) / h); h = maxDim; }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                currentPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                document.getElementById('upload-preview-img').src = currentPhotoDataUrl;
                document.getElementById('upload-placeholder').classList.add('hidden');
                document.getElementById('upload-preview-container').classList.remove('hidden');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    },

    clearSelectedPhoto() {
        currentPhotoDataUrl = '';
        document.getElementById('form-report-photo').value = '';
        document.getElementById('upload-placeholder').classList.remove('hidden');
        document.getElementById('upload-preview-container').classList.add('hidden');
    },

    async submitNewReport() {
        const toilet_id = Number(document.getElementById('form-report-toilet').value);
        const status_type = document.getElementById('form-report-type').value;
        const status_detail = document.getElementById('form-report-detail').value.trim();
        const fileInput = document.getElementById('form-report-photo');

        if (!toilet_id || !status_detail) {
            return this.showToast('กรุณาเลือกห้องน้ำและกรอกรายละเอียดปัญหา', 'error');
        }

        let finalPhotoUrl = currentPhotoDataUrl;

        // หากเชื่อมต่อ Supabase แล้ว และมี Bucket Storage จะลองอัปโหลดขึ้น Storage ก่อน
        if (supabaseClient && fileInput.files[0]) {
            const bucket = localStorage.getItem('plodploi_storage_bucket') || 'report-photos';
            const file = fileInput.files[0];
            const fileName = `report_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

            const { data: uploadData, error: uploadErr } = await supabaseClient
                .storage
                .from(bucket)
                .upload(fileName, file);

            if (!uploadErr && uploadData) {
                const { data: publicUrlData } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
                if (publicUrlData && publicUrlData.publicUrl) {
                    finalPhotoUrl = publicUrlData.publicUrl;
                }
            }
        }

        const firstUserId = usersData[0] ? usersData[0].user_id : 1;
        const payload = {
            toilet_id,
            user_id: firstUserId,
            status_type,
            status_detail,
            photo_url: finalPhotoUrl
        };

        // อัปเดตสถานะห้องน้ำตามประเภทที่แจ้งอัตโนมัติ
        const mappedToiletStatus = status_type === 'ปิดทำความสะอาด' ? 'ทำความสะอาด' : 'ชำรุด';

        if (supabaseClient) {
            const { error } = await supabaseClient.from('reports').insert([payload]);
            if (error) return this.showToast('ส่งรายงานไม่สำเร็จ: ' + error.message, 'error');
            await supabaseClient.from('toilets').update({ status: mappedToiletStatus }).eq('toilet_id', toilet_id);
            await this.syncFromSupabase();
        } else {
            const newId = reportsData.reduce((m, x) => Math.max(m, Number(x.report_id)), 1000) + 1;
            const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
            reportsData.unshift({ report_id: newId, created_at: nowStr, ...payload });
            const tIdx = toiletsData.findIndex(t => Number(t.toilet_id) === Number(toilet_id));
            if (tIdx > -1) toiletsData[tIdx].status = mappedToiletStatus;
            this.renderAllViews();
        }

        this.closeModal('new-report-modal');
        this.showToast('บันทึกรายงานปัญหาและรูปถ่ายเรียบร้อยแล้ว', 'success');
    },

    openReportDetail(reportId) {
        const r = reportsData.find(x => Number(x.report_id) === Number(reportId));
        if (!r) return;

        document.getElementById('detail-report-id').innerText = `(#${r.report_id})`;
        document.getElementById('detail-report-location').innerText = this.getToiletLabel(r.toilet_id);
        document.getElementById('detail-report-type').innerText = r.status_type;
        document.getElementById('detail-report-desc').innerText = r.status_detail || '-';

        const photoWrapper = document.getElementById('detail-photo-wrapper');
        const imgEl = document.getElementById('detail-report-img');
        if (r.photo_url) {
            imgEl.src = r.photo_url;
            photoWrapper.classList.remove('hidden');
        } else {
            photoWrapper.classList.add('hidden');
        }

        const toilet = toiletsData.find(t => Number(t.toilet_id) === Number(r.toilet_id));
        document.getElementById('detail-toilet-status').value = toilet ? toilet.status : 'ปกติ';

        const modal = document.getElementById('report-detail-modal');
        modal.setAttribute('data-report-id', r.report_id);
        modal.setAttribute('data-toilet-id', r.toilet_id);
        this.openModal('report-detail-modal');
    },

    async updateToiletStatusFromReport() {
        const modal = document.getElementById('report-detail-modal');
        const toiletId = Number(modal.getAttribute('data-toilet-id'));
        const newStatus = document.getElementById('detail-toilet-status').value;

        if (supabaseClient) {
            const { error } = await supabaseClient.from('toilets').update({ status: newStatus }).eq('toilet_id', toiletId);
            if (error) return this.showToast(error.message, 'error');
            await this.syncFromSupabase();
        } else {
            const tIdx = toiletsData.findIndex(t => Number(t.toilet_id) === toiletId);
            if (tIdx > -1) toiletsData[tIdx].status = newStatus;
            this.renderAllViews();
        }

        this.closeModal('report-detail-modal');
        this.showToast('อัปเดตสถานะห้องน้ำเรียบร้อยแล้ว', 'success');
    },

    async deleteReportFromModal() {
        const modal = document.getElementById('report-detail-modal');
        const reportId = Number(modal.getAttribute('data-report-id'));
        if (!confirm(`ต้องการลบใบแจ้งปัญหารหัส #${reportId} ใช่หรือไม่?`)) return;

        if (supabaseClient) {
            const { error } = await supabaseClient.from('reports').delete().eq('report_id', reportId);
            if (error) return this.showToast(error.message, 'error');
            await this.syncFromSupabase();
        } else {
            reportsData = reportsData.filter(r => Number(r.report_id) !== reportId);
            this.renderAllViews();
        }

        this.closeModal('report-detail-modal');
        this.showToast('ลบรายการแจ้งปัญหาสำเร็จ', 'success');
    },

    /* =========================================
    9. จัดการรีวิว ผู้ใช้งาน และตั้งค่า Supabase
    ========================================= */
    async deleteReview(reviewId) {
        if (!confirm('ยืนยันการลบข้อความรีวิวนี้ใช่หรือไม่?')) return;
        if (supabaseClient) {
            const { error } = await supabaseClient.from('reviews').delete().eq('review_id', reviewId);
            if (error) return this.showToast(error.message, 'error');
            await this.syncFromSupabase();
        } else {
            reviewsData = reviewsData.filter(r => String(r.review_id) !== String(reviewId));
            this.renderAllViews();
        }
        this.showToast('ลบรีวิวเรียบร้อยแล้ว', 'success');
    },

    async saveUser() {
        const display_name = document.getElementById('form-user-name').value.trim();
        const role = document.getElementById('form-user-role').value;
        const phone = document.getElementById('form-user-phone').value.trim();
        const isAdmin = document.getElementById('form-user-is-admin').checked;

        if (!display_name) return this.showToast('กรุณากรอกชื่อผู้ใช้', 'error');

        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('Users').insert([{ display_name, role, phone }]).select();
            if (error) return this.showToast(error.message, 'error');
            if (isAdmin && data && data[0]) {
                await supabaseClient.from('admin').insert([{ user_id: data[0].user_id, is_active: true }]);
            }
            await this.syncFromSupabase();
        } else {
            const newId = usersData.reduce((m, x) => Math.max(m, Number(x.user_id)), 0) + 1;
            usersData.push({ user_id: newId, display_name, role, phone });
            if (isAdmin) adminsData.push({ admin_id: Date.now(), user_id: newId, is_active: true });
            this.renderAllViews();
        }

        this.closeModal('user-modal');
        this.showToast('เพิ่มผู้ใช้งานสำเร็จ', 'success');
    },

    async deleteUser(userId) {
        if (!confirm('ยืนยันการลบผู้ใช้งานนี้?')) return;
        if (supabaseClient) {
            await supabaseClient.from('admin').delete().eq('user_id', userId);
            const { error } = await supabaseClient.from('Users').delete().eq('user_id', userId);
            if (error) return this.showToast(error.message, 'error');
            await this.syncFromSupabase();
        } else {
            usersData = usersData.filter(u => Number(u.user_id) !== Number(userId));
            this.renderAllViews();
        }
        this.showToast('ลบผู้ใช้งานเรียบร้อยแล้ว', 'success');
    },

    async saveSupabaseSettings() {
        const url = document.getElementById('setting-supabase-url').value.trim();
        const key = document.getElementById('setting-supabase-key').value.trim();
        const bucket = document.getElementById('setting-storage-bucket').value.trim() || 'report-photos';

        if (!url || !key) {
            return this.showToast('กรุณาวางทั้ง Project URL และ Publishable Key', 'error');
        }

        localStorage.setItem('plodploi_supabase_url', url);
        localStorage.setItem('plodploi_supabase_key', key);
        localStorage.setItem('plodploi_storage_bucket', bucket);

        this.loadSavedSettings();
        await this.syncFromSupabase();
        this.showToast('เชื่อมต่อฐานข้อมูล Supabase สำเร็จ!', 'success');
    },

    clearSupabaseSettings() {
        localStorage.removeItem('plodploi_supabase_url');
        localStorage.removeItem('plodploi_supabase_key');
        supabaseClient = null;
        document.getElementById('setting-supabase-url').value = '';
        document.getElementById('setting-supabase-key').value = '';
        this.updateConnectionBadge(false);
        this.renderAllViews();
        this.showToast('สลับกลับเป็นโหมดข้อมูลในเครื่องแล้ว', 'success');
    },

    /* --- Helpers --- */
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
        }, 3200);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());