import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

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

const env = { ...process.env, GH_TOKEN: token };
const repo = 'chanoknanpiim/mockup_admin';

const thaiIssues = [
  {
    number: 1,
    title: "Phase 0: ติดตั้งสถาปัตยกรรมระบบ, LINE OA, สภาพแวดล้อม Supabase และ Vercel",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **LINE OA & Messaging API:** สร้างและตั้งค่าบัญชีทางการ PLODPLOI พร้อมเชื่อมต่อ Messaging API
- **LIFF Application:** ลงทะเบียน LINE Developers Console และสร้าง LINE Login Channel สำหรับเปิดหน้าเว็บ LIFF
- **Supabase Cloud:** สร้างโปรเจกต์ Supabase (ภูมิภาคสิงคโปร์ - ap-southeast-1) พร้อม PostgreSQL Database และส่วนขยาย PostGIS
- **โครงสร้าง Monorepo:** พัฒนาด้วย Next.js 14+ (App Router), Tailwind CSS, TypeScript และ Leaflet Maps
- **Vercel Production:** เชื่อมต่อ Repository เข้ากับ Vercel Production Deployment และตั้งค่า Environment Variables ครบถ้วน

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์ (พร้อมใช้งานบน Production)`
  },
  {
    number: 2,
    title: "Phase 1: ออกแบบโครงสร้างฐานข้อมูลและติดตั้งส่วนขยาย PostGIS",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **PostGIS Extension:** ติดตั้งและเปิดใช้งานส่วนขยาย PostGIS บน PostgreSQL
- **ตารางฐานข้อมูลหลัก:** สร้างตาราง \`buildings\`, \`toilets\`, \`toilet_reviews\`, \`toilet_reports\`, \`admin_profiles\`
- **Spatial Indexing & RPC:** สร้างดัชนีเชิงพื้นที่ (GIST Index) บนฟิลด์ \`coordinates\` และฟังก์ชัน RPC \`get_nearby_toilets\` สำหรับคำนวณระยะทางแบบเรียลไทม์
- **ความปลอดภัย (RLS):** กำหนด Row Level Security (RLS) และ Security Policies ควบคุมสิทธิ์การอ่าน-เขียนของ Users และ Admins อย่างรัดกุม

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์`
  },
  {
    number: 3,
    title: "Phase 1.2: นำเข้าข้อมูลพิกัดห้องน้ำเริ่มต้น (10 อาคาร มธ. ท่าพระจันทร์)",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
สำรวจและบันทึกข้อมูลตำแหน่งพิกัดจริง สิ่งอำนวยความสะดวก และคำอธิบาย 10 จุดเริ่มต้นใน มธ. ท่าพระจันทร์:
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

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์`
  },
  {
    number: 4,
    title: "Phase 2: พัฒนา Edge Function line-webhook และ LINE Messaging API",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **HMAC Signature Verification:** ตรวจสอบลายเซ็น LINE Signature ป้องกันการส่งข้อมูลปลอมแปลงจากภายนอก
- **Event Handling:** จัดการ Event เมื่อผู้ใช้ส่งพิกัดตำแหน่ง (Location Message), ข้อความค้นหา และการกดปุ่ม Quick Reply
- **การคำนวณพิกัดและระยะทาง:** ค้นหาห้องน้ำใกล้เคียงและส่งผลลัพธ์ผ่าน LINE Flex Carousel ที่สวยงาม
- **การควบคุมรัศมี (Geofencing):** ตรวจสอบและแจ้งเตือนอย่างสุภาพเมื่อผู้ใช้อยู่นอกรัศมีบริการ มธ. ท่าพระจันทร์ (> 1,000 เมตร)

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์ (Deploy บน Supabase Edge Functions Version 9 ACTIVE)`
  },
  {
    number: 5,
    title: "Phase 3: พัฒนาเว็บแอปพลิเคชันฝั่งผู้ใช้ (LIFF) ด้วยแผนที่ Leaflet",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **หน้าเว็บ \`/liff\`:** พัฒนาเว็บแอปพลิเคชันที่ทำงานอย่างไร้รอยต่อภายในแอปพลิเคชัน LINE ด้วย LIFF SDK
- **Interactive Map:** แสดงแผนที่มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์ ด้วย Leaflet & OpenStreetMap พร้อมหมุดแสดงสถานะห้องน้ำ
- **Geolocation API & Fallback:** ดึงพิกัดปัจจุบันของผู้ใช้ พร้อมระบบ Silent Fallback เป็นใจกลาง มธ. ท่าพระจันทร์ เมื่อไม่ได้รับสิทธิ์เข้าถึง GPS
- **ฟอร์มรีวิวและแจ้งปัญหา:** รองรับการส่งคะแนนรีวิว (\`/liff/review\`) และการแจ้งปัญหาห้องน้ำชำรุดพร้อมแนบรูปถ่าย (\`/liff/report\`)

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์`
  },
  {
    number: 6,
    title: "Phase 4: สร้างระบบแดชบอร์ดผู้ดูแลระบบ (Next.js + Supabase Auth)",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **ระบบสิทธิ์แอดมิน (RBAC):** ตรวจสอบสิทธิ์ผู้ดูแลระบบผ่านตาราง \`admin_profiles\` ป้องกันผู้ใช้ทั่วไปเข้าถึง
- **หน้าภาพรวม (Overview):** แสดงสถิติจำนวนห้องน้ำ รายงานปัญหาที่รอดำเนินการ และคะแนนรีวิวเฉลี่ย
- **การจัดการห้องน้ำ (CRUD Toilets):** เพิ่ม ลบ แก้ไขข้อมูลห้องน้ำ อาคาร ชั้น และสิ่งอำนวยความสะดวก
- **ระบบติดตามการแจ้งซ่อม:** ตรวจสอบและอัปเดตสถานะการแจ้งซ่อมแบบเรียลไทม์ (Pending -> In Progress -> Resolved)

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์ (เข้าใช้งานได้ที่ https://mockupadmin.vercel.app/admin)`
  },
  {
    number: 7,
    title: "การแก้ไข: ปิดระบบ Deployment Protection ของ Vercel และเชื่อมต่อ Production Domain",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **ปลดล็อก Vercel Protection:** แก้ปัญหาหน้าเว็บเด้งไปที่หน้า "Log in to Vercel" เมื่อผู้ใช้เปิดผ่าน LINE โดยการปิด Deployment Protection
- **การกำหนดค่า Routing:** ปรับปรุง \`middleware.ts\` และ Route Guards ให้ผู้ใช้ทั่วไปสามารถเข้าถึงหน้า LIFF และ API สาธารณะได้โดยไม่ต้องล็อกอิน
- **เชื่อมต่อ Production Domain:** ผูกโดเมนหลัก \`https://mockupadmin.vercel.app\` เข้ากับ LINE Developers Console (LIFF Endpoint URL) อย่างถูกต้อง

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์`
  },
  {
    number: 8,
    title: "การปรับปรุง: ปรับพิกัด 10 อาคารให้ตรงกับ Google Maps จริง และจำกัดระยะค้นหา (1 กม.)",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **ความแม่นยำพิกัด GPS:** นำเข้าพิกัดจริงของอาคารทั้ง 10 แห่งทั่วมหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์ อ้างอิงจาก Google Maps
- **ระบบ Geofencing Cutoff:** เพิ่มเงื่อนไขตัดระยะค้นหาที่ 1,000 เมตรจากใจกลาง มธ. ท่าพระจันทร์
- **ข้อความแจ้งเตือน:** ตอบกลับข้อความแจ้งเตือนและคำแนะนำอย่างสุภาพเมื่อผู้ใช้ส่งพิกัดที่อยู่นอกพื้นที่ให้บริการ

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์`
  },
  {
    number: 9,
    title: "การปรับปรุง: ระบบ Deep Link (?toiletId) และหน้าต่างสรุปข้อมูล (Bottom Sheet Modal)",
    column: "เสร็จสิ้น (Done)",
    isClosed: true,
    body: `### รายละเอียดการดำเนินงาน
- **รองรับ Deep Link:** พัฒนาให้หน้ารองรับ Query Parameter \`?toiletId=...\` เมื่อผู้ใช้กด "ดูแผนที่" หรือ "นำทาง" จาก LINE Chat
- **การนำทางบนแผนที่:** แผนที่บน LIFF จะเลื่อนและซูมระดับ 18 ไปยังหมุดอาคารที่เลือกโดยอัตโนมัติ
- **Bottom Sheet Modal:** เปิดแผ่นป๊อปอัปด้านล่างแสดงรายละเอียดห้องน้ำ เวลาเปิด-ปิด สถานะ และสิ่งอำนวยความสะดวกทันที
- **ทางลัดแจ้งปัญหา (\`tab=report\`):** นำทางผู้ใช้ไปยังหน้าฟอร์มแจ้งซ่อม (\`/liff/report\`) ได้อย่างรวดเร็ว

### สถานะ
- [x] เสร็จสิ้นสมบูรณ์`
  },
  {
    number: 10,
    title: "เอกสารรายงาน: จัดทำรายงานโครงงานฉบับสมบูรณ์ 9 หัวข้อ (8-15 หน้า A4) [สมาชิก 3 คน]",
    column: "กำลังดำเนินการ (In Progress)",
    isClosed: false,
    body: `### รายละเอียดการดำเนินงาน
ร่างเนื้อหารายงานเชิงวิชาการฉบับสมบูรณ์ รายวิชา DX212 ความยาว 8-15 หน้ากระดาษ A4 ตามเกณฑ์การประเมิน ครอบคลุม 9 หัวข้อหลัก:
1. **ข้อมูลทีมและบทบาทหน้าที่:** รายชื่อสมาชิก 3 คน พร้อมหน้าที่ความรับผิดชอบ
2. **ที่มาของปัญหาและกลุ่มเป้าหมาย (Problem Statement & Persona):** ปัญหาความยากในการหาห้องน้ำใน มธ. ท่าพระจันทร์
3. **ขอบเขตการพัฒนาขั้นต่ำ (MVP Scope):** ฟีเจอร์หลักของ LINE OA, LIFF และ Admin
4. **การเปรียบเทียบคู่แข่ง (Competitive Analysis):** ข้อได้เปรียบของการใช้ LINE Native เทียบกับแอปพลิเคชันทั่วไป
5. **เรื่องราวของผู้ใช้งาน (User Stories):** กรณีการใช้งานของนักศึกษา บุคลากร ผู้พิการ และผู้ดูแลระบบ
6. **โฟลว์หน้าจอผู้ใช้งาน 4 สถานะ (UI Flow):** Initial, Loading, Success, Error
7. **การออกแบบฐานข้อมูล (ER Diagram & RLS Policy):** ความสัมพันธ์ของตารางและนโยบายความปลอดภัยข้อมูล
8. **สถาปัตยกรรมระบบ (System Architecture):** การออกแบบและ Deploy สถาปัตยกรรม (Deploy แบบ A บน Vercel + Supabase)
9. **สรุปผลงานและทิศทางการพัฒนาต่อ:** สรุปผลการทดสอบและข้อเสนอแนะในการต่อยอด

### สถานะ
- [ ] กำลังดำเนินการเรียบเรียงเนื้อหาเอกสารร่วมกันในทีม`
  },
  {
    number: 11,
    title: "การนำเสนอ: จัดทำสไลด์สรุปสำหรับนำเสนอสดในคาบเรียนที่ 15",
    column: "กำลังดำเนินการ (In Progress)",
    isClosed: false,
    body: `### รายละเอียดการดำเนินงาน
- **ออกแบบสไลด์นำเสนอ:** จัดเตรียมสไลด์นำเสนอที่กระชับ สวยงาม และตรงประเด็นสำหรับการ Demo สดในคาบเรียนที่ 15
- **สรุปสถาปัตยกรรมและโค้ดสำคัญ:** ไฮไลต์การทำงานของ PostGIS, Supabase Edge Functions, LIFF Deep Link และ Admin Dashboard
- **เตรียมขั้นตอน Live Demonstration:** ลำดับการสาธิตตั้งแต่ส่งพิกัดใน LINE -> เปิด LIFF Map -> แจ้งปัญหาห้องน้ำ -> แอดมินรับเรื่องและอัปเดตสถานะในระบบ
- **เตรียมข้อมูลตอบคำถาม:** เตรียมข้อมูลเชิงลึกทางเทคนิคสำหรับตอบคำถามรายบุคคลของอาจารย์ผู้ตรวจ

### สถานะ
- [ ] กำลังจัดทำสไลด์และซ้อมขั้นตอนการนำเสนอ`
  },
  {
    number: 12,
    title: "Phase 5: ทดสอบการทำงานทั้งระบบจากต้นทางถึงปลายทาง (End-to-End Testing)",
    column: "กำลังดำเนินการ (In Progress)",
    isClosed: false,
    body: `### รายละเอียดการดำเนินงาน
- **ทดสอบบนสมาร์ตโฟนจริง:** ทดสอบฟังก์ชันการทำงานบนระบบปฏิบัติการทั้ง iOS และ Android
- **ตรวจสอบการโต้ตอบของริชเมนู:** ทดสอบการกดปุ่มทั้ง 3 บน Rich Menu (หาห้องน้ำใกล้ฉัน, แจ้งปัญหา & รีวิว, แผนที่ทั้งหมด)
- **ทดสอบฟอร์มการแจ้งซ่อม:** ตรวจสอบความถูกต้องของการส่งข้อมูลรายงานห้องน้ำชำรุด การอัปโหลดรูปภาพ และการแจ้งเตือนไปยังแอดมิน
- **ตรวจสอบความแม่นยำของแผนที่:** ทดสอบการเปิด Deep Link และการนำทางไปยังพิกัดห้องน้ำจริงรอบมหาวิทยาลัย

### สถานะ
- [ ] กำลังดำเนินการทดสอบรอบสุดท้ายบนอุปกรณ์จริง`
  },
  {
    number: 13,
    title: "Phase 6.1: ตั้งค่าริชเมนูบน LINE OA และสลับโหมดตอบกลับเป็นบอต",
    column: "กำลังดำเนินการ (In Progress)",
    isClosed: false,
    body: `### รายละเอียดการดำเนินงาน
- **สลับโหมดตอบกลับเป็น Bot:** ปรับ Response Mode ใน LINE OA Console จาก Chat เป็น Bot
- **ปิดข้อความตอบกลับอัตโนมัติ:** ปิด Auto-response เริ่มต้นของ LINE เพื่อให้ข้อความทั้งหมดถูกส่งต่อให้ Webhook ประมวลผล
- **เปิดใช้งาน Webhook:** ตรวจสอบสถานะ Webhook URL ให้เป็น Active และ Verify ผ่าน
- **เชื่อมโยง Action ริชเมนู:** ตรวจสอบ Action ของปุ่มบน Rich Menu ทั้งหมดให้ส่งพิกัดหรือเปิด LIFF ได้อย่างถูกต้อง

### สถานะ
- [ ] กำลังดำเนินการตรวจสอบและปรับตั้งค่าใน LINE OA Console`
  },
  {
    number: 14,
    title: "Phase 6.2: การทดสอบการยอมรับของผู้ใช้ (UAT) กับกลุ่มตัวอย่าง 10-20 คนในมหาวิทยาลัย",
    column: "รอดำเนินการ (Todo)",
    isClosed: false,
    body: `### รายละเอียดการดำเนินงาน
- **คัดเลือกกลุ่มตัวอย่าง:** เชิญนักศึกษา อาจารย์ และบุคลากรใน มธ. ท่าพระจันทร์ จำนวน 10-20 คน ร่วมทดสอบใช้งานจริง
- **การเก็บผลการทดสอบ:** ให้นักศึกษาทดลองค้นหาห้องน้ำ นำทาง และทดลองแจ้งซ่อมผ่านระบบจริง
- **แบบประเมินความพึงพอใจ:** รวบรวมข้อมูลคะแนนความพึงพอใจ ความแม่นยำของพิกัด และข้อเสนอแนะในการปรับปรุง

### สถานะ
- [ ] แผนงานในลำดับถัดไป (หลังจาก E2E เสร็จสิ้น)`
  },
  {
    number: 15,
    title: "การประเมินตนเอง: จัดทำบันทึกการสะท้อนตนเองรายบุคคลสำหรับส่งอาจารย์",
    column: "รอดำเนินการ (Todo)",
    isClosed: false,
    body: `### รายละเอียดการดำเนินงาน
- **บันทึกการสะท้อนตนเอง (Individual Reflection):** สมาชิกแต่ละคนในทีมจัดทำบันทึกสิ่งที่ได้เรียนรู้จากการทำโครงงาน
- **การวิเคราะห์กระบวนการทำงาน:** บันทึกปัญหา อุปสรรค วิธีการแก้ปัญหาเฉพาะหน้า และบทเรียนที่ได้รับ
- **การพัฒนาทักษะ:** สรุปทักษะทางเทคนิค (Full-stack, Cloud, Geolocation) และทักษะการทำงานร่วมกัน (Teamwork & Communication)

### สถานะ
- [ ] แผนงานในลำดับถัดไป`
  }
];

console.log(`Updating ${thaiIssues.length} issues in ${repo} to Thai...`);

for (const item of thaiIssues) {
  const tempFile = `/tmp/gh_issue_thai_${item.number}.md`;
  writeFileSync(tempFile, item.body, 'utf-8');

  console.log(`Updating Issue #${item.number}: ${item.title}`);
  
  // Update Title and Body
  execSync(
    `gh issue edit ${item.number} --repo ${repo} --title "${item.title.replace(/"/g, '\\"')}" --body-file "${tempFile}"`,
    { env }
  );

  // Set state
  if (item.isClosed) {
    try {
      execSync(`gh issue close ${item.number} --repo ${repo} --reason "completed"`, { env, stdio: 'ignore' });
    } catch (e) {}
  } else {
    try {
      execSync(`gh issue reopen ${item.number} --repo ${repo}`, { env, stdio: 'ignore' });
    } catch (e) {}
  }
}

console.log('\n--- ALL ISSUES UPDATED TO THAI SUCCESSFULLY ---');
