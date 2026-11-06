import fs from 'fs';
import path from 'path';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YEm1FmH6TAw3gbCsCUkIdsVeowhTtRO1r7IfgQPMKOBPex3b52CYGuUPDJ8n6tGFBkMg1jHapy8/1M+bropNM/qSTSVe8zxfliaIKlvVBZ2Nylu+wRWT0pBzcFTfVwwNdn/bWGOADMNo1Eunx4x00wdB04t89/1O/w1cDnyilFU=';

// Look for IMG_0765 in public folder
let imagePath = path.resolve('public/IMG_0765.JPG');
if (!fs.existsSync(imagePath)) {
  imagePath = path.resolve('public/IMG_0765.jpg');
}

if (!fs.existsSync(imagePath)) {
  console.error(`FATAL: Could not find IMG_0765.JPG or IMG_0765.jpg in public/!`);
  process.exit(1);
}

const stats = fs.statSync(imagePath);
console.log('========================================================');
console.log('  PLODPLOI: DEPLOY AUTHENTIC RICH MENU (IMG_0765.JPG)');
console.log('========================================================');
console.log(`Image Source: ${imagePath}`);
console.log(`File Size: ${(stats.size / 1024).toFixed(1)} KB`);

// We know the dimensions are 1200x810
const richMenuSpec = {
  size: {
    width: 1200,
    height: 810
  },
  selected: true,
  name: "PlodPloi Official Menu",
  chatBarText: "เมนูหลัก",
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 400,
        height: 810
      },
      action: {
        type: "uri",
        label: "แจ้งปัญหาและรีวิว",
        uri: "https://liff.line.me/2012397593-ADI98PZS?tab=report"
      }
    },
    {
      bounds: {
        x: 400,
        y: 0,
        width: 400,
        height: 810
      },
      action: {
        type: "location",
        label: "ค้นหาห้องน้ำใกล้ตัว"
      }
    },
    {
      bounds: {
        x: 800,
        y: 0,
        width: 400,
        height: 810
      },
      action: {
        type: "message",
        label: "กรองห้องน้ำ",
        text: "กรองห้องน้ำ"
      }
    }
  ]
};

const headers = {
  Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
};

async function main() {
  // Step 1: List existing menus
  console.log('\n[Step 1] Fetching current rich menus on LINE OA...');
  const listRes = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers });
  if (!listRes.ok) {
    console.error('Failed to list rich menus:', listRes.status, await listRes.text());
    process.exit(1);
  }
  const listData = await listRes.json();
  const existingMenus = listData.richmenus || [];
  console.log(`Found ${existingMenus.length} existing rich menu(s):`);
  existingMenus.forEach(rm => console.log(` - ID: ${rm.richMenuId} | Name: ${rm.name}`));

  // Step 2: Create new rich menu
  console.log('\n[Step 2] Creating new rich menu structure (1200x810)...');
  const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(richMenuSpec),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.richMenuId) {
    console.error('Failed to create rich menu:', createData);
    process.exit(1);
  }
  const newRichMenuId = createData.richMenuId;
  console.log(`✓ Created Rich Menu ID: ${newRichMenuId}`);

  // Step 3: Upload image
  console.log(`\n[Step 3] Uploading authentic image (${imagePath}) to ${newRichMenuId}...`);
  const imageBuffer = fs.readFileSync(imagePath);
  const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${newRichMenuId}/content`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'image/jpeg',
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    console.error(`Failed to upload image: HTTP ${uploadRes.status}`, await uploadRes.text());
    process.exit(1);
  }
  console.log(`✓ Image uploaded successfully to ${newRichMenuId} (HTTP ${uploadRes.status})`);

  // Step 4: Set as Default for all users
  console.log(`\n[Step 4] Setting ${newRichMenuId} as Default for all users...`);
  const setDefaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${newRichMenuId}`, {
    method: 'POST',
    headers,
  });

  if (!setDefaultRes.ok) {
    console.error(`Failed to set default: HTTP ${setDefaultRes.status}`, await setDefaultRes.text());
    process.exit(1);
  }
  console.log(`✓ Rich menu ${newRichMenuId} set as DEFAULT for all users!`);

  // Step 5: Verify default
  console.log('\n[Step 5] Verifying default rich menu on LINE OA...');
  const verifyRes = await fetch('https://api.line.me/v2/bot/user/all/richmenu', { headers });
  const verifyData = await verifyRes.json();
  console.log(`✓ Current active default Rich Menu ID: ${verifyData.richMenuId}`);

  // Step 6: Delete old menus
  console.log('\n[Step 6] Deleting previous rich menus...');
  for (const m of existingMenus) {
    if (m.richMenuId !== newRichMenuId) {
      console.log(` - Deleting old menu ${m.richMenuId} (${m.name})...`);
      const delRes = await fetch(`https://api.line.me/v2/bot/richmenu/${m.richMenuId}`, {
        method: 'DELETE',
        headers,
      });
      if (delRes.ok) {
        console.log(`   ✓ Deleted ${m.richMenuId}`);
      } else {
        console.warn(`   ✗ Could not delete ${m.richMenuId}: HTTP ${delRes.status}`);
      }
    }
  }

  console.log('\n========================================================');
  console.log('✅ AUTHENTIC RICH MENU DEPLOYED AND ACTIVATED SUCCESSFULLY!');
  console.log(`Active Menu ID: ${newRichMenuId}`);
  console.log('========================================================\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
