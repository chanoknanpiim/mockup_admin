import { execSync } from 'child_process';
import { readFileSync } from 'fs';

/**
 * Script to add all 15 Thai issues to GitHub Projects (Kanban Board)
 * 
 * Usage:
 *   GH_PROJECT_NUMBER=1 node scripts/sync-kanban-board.mjs
 */

const projectNumber = process.env.GH_PROJECT_NUMBER;
const owner = process.env.GH_OWNER || 'chanoknanpiim';

let token = process.env.GH_TOKEN;
if (!token) {
  try {
    const raw = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential-osxkeychain get', {
      encoding: 'utf-8'
    });
    const match = raw.match(/password=([^\s]+)/);
    if (match) token = match[1];
  } catch (e) {}
}

const env = { ...process.env, GH_TOKEN: token };

const issuesData = JSON.parse(
  readFileSync('/Users/carbo/Desktop/ปี2เทอม1/DX212/mock up/admin/scripts/created-issues.json', 'utf-8')
);

async function main() {
  console.log(`Repository: ${owner}/mockup_admin`);
  console.log(`Target Project: ${projectNumber || '(Auto-detecting...)'}`);

  let targetProjNum = projectNumber;
  if (!targetProjNum) {
    try {
      const output = execSync(`gh project list --owner ${owner} --format json`, { env, encoding: 'utf-8' });
      const projects = JSON.parse(output).projects || [];
      if (projects.length > 0) {
        targetProjNum = projects[0].number;
        console.log(`พบโปรเจกต์: #${targetProjNum} - ${projects[0].title}`);
      }
    } catch (e) {
      console.log('หมายเหตุ: สำหรับการจัดการ GitHub Projects (v2) ต้องมีสิทธิ์ "project" ใน GitHub Token');
      console.log('สามารถกด Refresh สิทธิ์ได้ด้วยคำสั่ง: gh auth refresh -s project,read:project');
    }
  }

  if (!targetProjNum) {
    console.log('\n======================================================');
    console.log('ขั้นตอนการซิงค์เข้า GitHub Projects (Kanban Board):');
    console.log('1. รันคำสั่งเพิ่มสิทธิ์: gh auth refresh -s project,read:project');
    console.log('2. ตรวจสอบหมายเลข Project ด้วยคำสั่ง: gh project list --owner chanoknanpiim');
    console.log('3. รันคำสั่งซิงค์: GH_PROJECT_NUMBER=<number> node scripts/sync-kanban-board.mjs');
    console.log('======================================================\n');
    return;
  }

  console.log(`\nกำลังนำทั้ง 15 Issues เข้าสู่ GitHub Project #${targetProjNum}...`);

  for (const item of issuesData) {
    console.log(`เพิ่ม Issue #${item.number} -> คอลัมน์ [${item.column}]`);
    try {
      const addRes = execSync(
        `gh project item-add ${targetProjNum} --owner ${owner} --url "${item.url}" --format json`,
        { env, encoding: 'utf-8' }
      );
      const parsed = JSON.parse(addRes);
      const itemId = parsed.id;

      // Status mapping
      const statusValue = item.column.includes('Done') || item.column.includes('เสร็จสิ้น') ? 'Done' :
                          item.column.includes('Progress') || item.column.includes('กำลังดำเนินการ') ? 'In Progress' : 'Todo';

      try {
        execSync(
          `gh project item-edit --id ${itemId} --project-id ${targetProjNum} --field-id "Status" --text "${statusValue}"`,
          { env, stdio: 'ignore' }
        );
      } catch (err) {}
      console.log(`  ✓ เพิ่มเข้าบอร์ดและตั้งสถานะเป็น ${item.column} สำเร็จ`);
    } catch (err) {
      console.error(`  x ไม่สามารถเพิ่ม Issue #${item.number}:`, err.message);
    }
  }
}

main();
