import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';

// Retrieve token from osxkeychain if not in process.env
let token = process.env.GH_TOKEN;
if (!token) {
  try {
    const raw = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential-osxkeychain get', {
      encoding: 'utf-8'
    });
    const match = raw.match(/password=([^\s]+)/);
    if (match) token = match[1];
  } catch (e) {
    console.error('Failed to get token from osxkeychain:', e.message);
  }
}

if (!token) {
  console.error('No GitHub token found. Please set GH_TOKEN.');
  process.exit(1);
}

const env = { ...process.env, GH_TOKEN: token };

const issues = [
  // DONE (1-9)
  {
    title: "Phase 0: Set up Architecture, LINE OA, Supabase & Vercel Environments",
    column: "Done",
    isClosed: true,
    labels: ["phase", "infrastructure"],
    body: `### รายละเอียดการดำเนินงาน
- สร้างและตั้งค่า LINE Official Account (PLODPLOI - มธ.ท่าพระจันทร์) & LINE Messaging API
- ลงทะเบียน LINE Developers Console, สร้าง LINE Login Channel & LIFF App
- สร้าง Supabase Project (Region: Singapore - ap-southeast-1) พร้อม PostgreSQL Database & PostGIS Extension
- ติดตั้งโปรเจกต์ Next.js 14+ (App Router), Tailwind CSS, TypeScript, Leaflet Maps
- เชื่อมต่อ Git Monorepo เข้ากับ Vercel Production Deployment และตั้งค่า Environment Variables ครบถ้วน

### ผลลัพธ์
- [x] LINE OA พร้อม Messaging API และ Rich Menu
- [x] Supabase Cloud Database + Auth + Storage พร้อมใช้งาน
- [x] Vercel Production Web URL: https://mockupadmin.vercel.app`
  },
  {
    title: "Phase 1: Database Schema & PostGIS Implementation",
    column: "Done",
    isClosed: true,
    labels: ["database", "phase"],
    body: `### รายละเอียดการดำเนินงาน
- ออกแบบ Database Schema และสร้างตารางหลัก: \`buildings\`, \`toilets\`, \`toilet_reviews\`, \`toilet_reports\`, \`admin_profiles\`
- เปิดใช้งานส่วนขยาย \`postgis\` บน PostgreSQL
- สร้าง Spatial Index (GIST) บนฟิลด์ตำแหน่งภูมิศาสตร์ \`coordinates\` (geography/geometry)
- สร้าง RPC Function \`get_nearby_toilets(user_lat, user_lng, max_dist_meters)\` คำนวณระยะทางและกรองห้องน้ำใกล้ตัวแบบเรียลไทม์
- ติดตั้ง Row Level Security (RLS) และ Security Policies สำหรับ Users และ Admins

### ผลลัพธ์
- [x] Schema & RLS policies deploy สำเร็จ
- [x] PostGIS Spatial Search ทำงานได้อย่างแม่นยำ`
  },
  {
    title: "Phase 1.2: Seed Initial Campus Toilet Data (10 จุด มธ. ท่าพระจันทร์)",
    column: "Done",
    isClosed: true,
    labels: ["database", "enhancement"],
    body: `### รายละเอียดการดำเนินงาน
สำรวจและบันทึกข้อมูลอาคารและจุดบริการห้องน้ำจริง 10 แห่งทั่วมหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์:
1. **ตึกโดมบริหาร (Dome Administration Building)** ชั้น 1
2. **คณะนิติศาสตร์ (Faculty of Law)** ชั้น 1
3. **คณะพาณิชยศาสตร์และการบัญชี (TBS)** ชั้น 1
4. **คณะรัฐศาสตร์ (Faculty of Political Science)** ชั้น 1
5. **คณะเศรษฐศาสตร์ (Faculty of Economics)** ชั้น 1
6. **อาคารเรียนรวมสังคมศาสตร์ (SC Building)** ชั้น 1
7. **หอสมุดปรีดี พนมยงค์ (Pridi Banomyong Library)** ชั้น B1
8. **โรงอาหารกลาง / อาคารเอนกประสงค์ 1** ชั้น 1
9. **อาคารเอนกประสงค์ 2 (Multi-Purpose Building 2)** ชั้น 1
10. **อาคารศูนย์ภาษาและคอมพิวเตอร์ / ริมแม่น้ำเจ้าพระยา** ชั้น 1

บันทึกพิกัดจริงระดับละติจูด/ลองจิจูด (Google Maps WGS84) พร้อมสิ่งอำนวยความสะดวก (สายฉีดชำระ, ทิชชู่, สบู่, ทางลาดผู้พิการ)

### ผลลัพธ์
- [x] พิกัดและข้อมูลอาคารทั้ง 10 จุดบันทึกลงใน Database เรียบร้อยสมบูรณ์`
  },
  {
    title: "Phase 2: Develop Edge Function line-webhook & LINE Messaging API",
    column: "Done",
    isClosed: true,
    labels: ["backend", "line-oa", "phase"],
    body: `### รายละเอียดการดำเนินงาน
- พัฒนา Supabase Edge Function \`line-webhook\` ด้วย Deno & TypeScript
- ตรวจสอบ LINE Signature verification (HMAC-SHA256) ป้องกัน Unauthorized requests
- จัดการ Event: \`location\` (ค้นหาห้องน้ำใกล้ฉัน), \`message\` (Quick Reply / Text Commands), \`postback\` (การให้คะแนนและเลือกฟังก์ชัน)
- แสดงผลการค้นหาด้วย LINE Flex Message Carousel (รูปภาพอาคาร, ชื่อห้องน้ำ, ระยะทางเดิน, เวลาเปิด-ปิด, ปุ่มเปิดแผนที่ LIFF)
- ระบบ Fallback และ Notification เมื่อผู้ใช้อยู่นอกเขต มธ. ท่าพระจันทร์ (> 1,000 เมตร)

### ผลลัพธ์
- [x] Deploy ขึ้น Supabase Edge Functions Version 9 ACTIVE`
  },
  {
    title: "Phase 3: Develop User Web (LIFF) with Leaflet Maps",
    column: "Done",
    isClosed: true,
    labels: ["frontend", "liff", "phase"],
    body: `### รายละเอียดการดำเนินงาน
- พัฒนา Web Application สำหรับผู้ใช้ผ่าน LINE Front-end Framework (LIFF SDK)
- เชื่อมต่อแผนที่แบบ Interactive ด้วย Leaflet & OpenStreetMap พร้อม Custom Markers แยกสถานะห้องน้ำ
- ระบบค้นหาและตัวกรองห้องน้ำ (แยกเพศ/รวม, ชั้น, สิ่งอำนวยความสะดวก, ทางลาดผู้พิการ, สถานะเปิด/ปิด)
- รองรับ Deep Linking (\`?toiletId=...\`) เพื่อ Focus หมุดและเปิด Bottom Sheet แสดงรายละเอียดห้องน้ำทันที
- หน้าแบบฟอร์มส่งรีวิว (\`/liff/review\`) และแจ้งปัญหาห้องน้ำชำรุด (\`/liff/report\`) พร้อมอัปโหลดรูปภาพหลักฐาน

### ผลลัพธ์
- [x] ใช้งานได้ผ่าน LIFF ID \`2012397593-ADI98PZS\` บนมือถือจริง`
  },
  {
    title: "Phase 4: Build Admin Dashboard (Next.js + Supabase)",
    column: "Done",
    isClosed: true,
    labels: ["admin", "frontend", "phase"],
    body: `### รายละเอียดการดำเนินงาน
- พัฒนา Admin Dashboard สำหรับผู้ดูแลระบบมหาวิทยาลัย (Next.js + Tailwind CSS)
- ระบบ Authentication & Role-Based Access Control (Admin Roles ผ่านตาราง \`admin_profiles\`)
- หน้า Overview แสดงสถิติและตัวชี้วัด (Total Toilets, Active Issues, Average Rating, User Reports)
- หน้าจัดการข้อมูลห้องน้ำ (CRUD Toilets & Buildings) พร้อมระบุพิกัดบนแผนที่
- หน้าจัดการรายงานปัญหาห้องน้ำชำรุด (Update Status: Pending -> In Progress -> Resolved)
- หน้ารวบรวมรีวิวและความพึงพอใจของผู้ใช้งาน

### ผลลัพธ์
- [x] แอดมินสามารถ Login เข้าจัดการข้อมูลได้ที่ \`https://mockupadmin.vercel.app/admin\``
  },
  {
    title: "Bugfix: Vercel Deployment Protection & Production Domain Routing",
    column: "Done",
    isClosed: true,
    labels: ["bug", "deployment"],
    body: `### รายละเอียดการดำเนินงาน
- ตรวจสอบและแก้ไขปัญหา Vercel Authentication / Deployment Protection ที่ส่งผลให้ Endpoint ภายนอกเข้าถึงไม่ได้
- แก้ไขการกำหนด Routing ใน \`middleware.ts\` และ Route Guards เพื่อรองรับการทำงานของ LIFF และ Webhooks
- ปรับคอนฟิก Production Domain ให้เชื่อมโยงกับ LINE Developers Console (LIFF Endpoint URL) อย่างถูกต้อง

### ผลลัพธ์
- [x] ปลดล็อกการเข้าถึงหน้าเว็บภายนอกสำเร็จ`
  },
  {
    title: "Enhancement: Align Real Building Coordinates & Geofencing (1km Cutoff)",
    column: "Done",
    isClosed: true,
    labels: ["enhancement", "backend"],
    body: `### รายละเอียดการดำเนินงาน
- ปรับปรุงพิกัด GPS ทั้ง 10 อาคารในฐานข้อมูลให้ตรงกับอาคารจริงของมหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์
- เพิ่ม Geofencing Cutoff ใน \`line-webhook\` (1,000 เมตรจากจุดกึ่งกลาง มธ. ท่าพระจันทร์)
- ตอบกลับข้อความแนะนำและแจ้งเตือนอย่างสุภาพเมื่อผู้ใช้ส่งพิกัดจากนอกพื้นที่บริการ

### ผลลัพธ์
- [x] ปรับพิกัดตรงจุด 100% พร้อมข้อความแนะนำผู้ใช้เมื่ออยู่นอกพื้นที่`
  },
  {
    title: "Enhancement: Deep Linking (?toiletId) & LIFF Bottom Sheet Modal",
    column: "Done",
    isClosed: true,
    labels: ["enhancement", "frontend", "liff"],
    body: `### รายละเอียดการดำเนินงาน
- ปรับปรุง \`src/app/liff/page.tsx\` และ \`src/components/LeafletMap.tsx\` รองรับ Query Parameter \`?toiletId=\`
- เมื่อผู้ใช้กด "ดูแผนที่" หรือ "นำทาง" จาก LINE Flex Message ระบบจะเปิดแผนที่ ซูมไปยังหมุดอาคาร และเปิด Bottom Sheet Modal ทันที
- รองรับ Query Parameter \`tab=report\` นำทางไปยังหน้าแจ้งปัญหาห้องน้ำ (\`/liff/report\`) โดยตรง
- แก้ไข Geolocation Error Handling: แสดงผลตำแหน่งเริ่มต้นกลาง มธ. ท่าพระจันทร์ แทนการแสดงแถบ Error สีแดงเมื่อ GPS ขัดข้อง

### ผลลัพธ์
- [x] การเชื่อมโยงจาก LINE แชทสู่เว็บ LIFF ราบรื่นไร้รอยต่อ`
  },

  // IN PROGRESS (10-13)
  {
    title: "Documentation: Final Project Academic Report (9 หัวข้อ 8-15 หน้า A4) [ทีม 3 คน]",
    column: "In Progress",
    isClosed: false,
    labels: ["documentation"],
    body: `### รายละเอียดการดำเนินงาน
จัดทำรายงานเชิงวิชาการฉบับสมบูรณ์ รายวิชา DX212 (ความยาว 8-15 หน้ากระดาษ A4 ตามเกณฑ์การประเมิน)
ครอบคลุม 9 หัวข้อหลัก:
1. บทนำและที่มาของปัญหา (Problem Statement & Campus Needs)
2. วัตถุประสงค์และขอบเขตโครงงาน (Objectives & Scope)
3. การออกแบบสถาปัตยกรรมระบบ (System Architecture & Tech Stack)
4. การออกแบบฐานข้อมูลและเชิงพื้นที่ (Database Schema & PostGIS Design)
5. การพัฒนาส่วนติดต่อผู้ใช้ (LINE OA, LIFF & Leaflet Map)
6. การพัฒนาระบบผู้ดูแลระบบ (Admin Dashboard & Operational Workflows)
7. การทดสอบระบบและการควบคุมคุณภาพ (Testing & Quality Assurance)
8. แผนการใช้งานจริงและผลตอบรับเบื้องต้น (Deployment & Initial Feedback)
9. สรุปผล บทเรียนที่ได้รับ และทิศทางการพัฒนาต่อ (Conclusion & Future Work)

สรุปบทบาทหน้าที่และการมีส่วนร่วมของสมาชิกทั้ง 3 คนในทีม

### สถานะ
- [ ] กำลังดำเนินการรวบรวมและเรียบเรียงเนื้อหาเอกสาร`
  },
  {
    title: "Presentation: Final Slide Deck Preparation for Demo (คาบ 15)",
    column: "In Progress",
    isClosed: false,
    labels: ["documentation"],
    body: `### รายละเอียดการดำเนินงาน
- ออกแบบและจัดเตรียมสไลด์นำเสนอโครงงานฉบับสมบูรณ์ สำหรับการ Demo ในคาบที่ 15
- โครงสร้างสไลด์: Problem -> Solution Architecture -> Key Highlights -> Live Demonstration Flow -> Lessons Learned
- เตรียม Scenario และ User Flow สำหรับ Live Demo (ค้นหาห้องน้ำผ่าน LINE -> เปิด LIFF -> แจ้งปัญหา -> แอดมินรับเรื่องใน Dashboard)

### สถานะ
- [ ] กำลังจัดทำสไลด์และเตรียมลำดับการสาธิต`
  },
  {
    title: "Phase 5: End-to-End System Integration Testing (E2E)",
    column: "In Progress",
    isClosed: false,
    labels: ["testing", "phase"],
    body: `### รายละเอียดการดำเนินงาน
- ทดสอบการทำงานร่วมกันระหว่าง LINE Messaging API, Supabase Edge Functions, LIFF Web App และ Admin Dashboard
- ทดสอบบนอุปกรณ์จริง (iOS และ Android) ในบริบทการใช้งานจริงรอบมหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์
- ตรวจสอบความถูกต้องของ Flex Message, Deep Linking, การบันทึก Review และ Report เข้า Database

### สถานะ
- [ ] ดำเนินการทดสอบรอบสุดท้ายบนอุปกรณ์จริง`
  },
  {
    title: "Phase 6.1: LINE OA Rich Menu & Bot Response Mode Configuration",
    column: "In Progress",
    isClosed: false,
    labels: ["line-oa", "phase"],
    body: `### รายละเอียดการดำเนินงาน
- ออกแบบและติดตั้ง Rich Menu บน LINE Official Account Manager
- กำหนด Action แต่ละปุ่มให้ถูกต้อง (เปิด LIFF, ส่งพิกัด, แจ้งปัญหา/รีวิว, ค้นหาห้องน้ำ)
- ตั้งค่า Response Mode ใน LINE OA Console (ปิด Auto-response อัตโนมัติ เพื่อให้ Webhook ตอบกลับอย่างสมบูรณ์)

### สถานะ
- [ ] ปรับตั้งค่า Response Mode และปุ่ม Rich Menu`
  },

  // TODO (14-15)
  {
    title: "Phase 6.2: User Acceptance Testing (UAT) with 10-20 Campus Users",
    column: "Todo",
    isClosed: false,
    labels: ["testing", "phase"],
    body: `### รายละเอียดการดำเนินงาน
- จัดทำการทดสอบการยอมรับของผู้ใช้ (UAT) ร่วมกับนักศึกษาและบุคลากร มธ. ท่าพระจันทร์ จำนวน 10-20 คน
- ประเมินความพึงพอใจการใช้งาน ความแม่นยำของพิกัด และความง่ายในการแจ้งปัญหาห้องน้ำ
- รวบรวมข้อเสนอแนะเพื่อนำมาปรับปรุงระบบ

### สถานะ
- [ ] รอดำเนินการหลังจาก E2E เสร็จสมบูรณ์`
  },
  {
    title: "Individual Reflection: บันทึกการสะท้อนตนเองรายบุคคลสำหรับส่งอาจารย์",
    column: "Todo",
    isClosed: false,
    labels: ["documentation"],
    body: `### รายละเอียดการดำเนินงาน
- บันทึกการเรียนรู้และการสะท้อนตนเอง (Individual Reflection) ของสมาชิกแต่ละคน
- สะท้อนกระบวนการทำงานร่วมกัน การแก้ไขปัญหาเฉพาะหน้า และทักษะทางเทคนิคที่ได้รับจากการพัฒนาโปรเจกต์ PLODPLOI

### สถานะ
- [ ] รอดำเนินการเขียนสรุปรายบุคคล`
  }
];

const results = [];

// Get existing issues
const existingRaw = execSync('gh issue list --repo chanoknanpiim/mockup_admin --state all --limit 100 --json number,title,url,state', { env, encoding: 'utf-8' });
const existingIssues = JSON.parse(existingRaw);

for (let i = 0; i < issues.length; i++) {
  const item = issues[i];
  console.log(`Processing [${i + 1}/${issues.length}]: ${item.title}`);
  
  const found = existingIssues.find(ex => ex.title.trim().toLowerCase() === item.title.trim().toLowerCase());
  
  let issueUrl = '';
  let issueNumber = null;

  // Temporary file for body to avoid shell escaping issues
  const tempFile = `/tmp/gh_issue_body_${i}.md`;
  writeFileSync(tempFile, item.body, 'utf-8');

  if (found) {
    issueNumber = found.number;
    issueUrl = found.url;
    console.log(`  -> Found existing Issue #${issueNumber}: ${issueUrl}`);
    // Update body and labels
    const labelArg = item.labels.join(',');
    execSync(`gh issue edit ${issueNumber} --repo chanoknanpiim/mockup_admin --body-file "${tempFile}" --add-label "${labelArg}"`, { env });
  } else {
    const labelArg = item.labels.join(',');
    const output = execSync(`gh issue create --repo chanoknanpiim/mockup_admin --title "${item.title.replace(/"/g, '\\"')}" --body-file "${tempFile}" --label "${labelArg}"`, { env, encoding: 'utf-8' }).trim();
    issueUrl = output.split('\n').filter(l => l.startsWith('http'))[0] || output;
    const match = issueUrl.match(/\/issues\/(\d+)/);
    issueNumber = match ? parseInt(match[1], 10) : null;
    console.log(`  -> Created Issue #${issueNumber}: ${issueUrl}`);
  }

  // Handle open/closed status for Done issues
  if (item.isClosed) {
    try {
      execSync(`gh issue close ${issueNumber} --repo chanoknanpiim/mockup_admin --reason "completed"`, { env, stdio: 'ignore' });
      console.log(`  -> Marked as completed (closed)`);
    } catch (e) {
      // Ignore if already closed
    }
  }

  results.push({
    number: issueNumber,
    title: item.title,
    column: item.column,
    labels: item.labels,
    url: issueUrl
  });
}

writeFileSync('/Users/carbo/Desktop/ปี2เทอม1/DX212/mock up/admin/scripts/created-issues.json', JSON.stringify(results, null, 2), 'utf-8');
console.log('\n--- ALL ISSUES PROCESSED SUCCESSFULLY ---');
console.table(results.map(r => ({ '#': r.number, Column: r.column, Title: r.title.slice(0, 45) + '...' })));
