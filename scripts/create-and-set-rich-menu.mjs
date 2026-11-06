import fs from 'fs';
import path from 'path';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YEm1FmH6TAw3gbCsCUkIdsVeowhTtRO1r7IfgQPMKOBPex3b52CYGuUPDJ8n6tGFBkMg1jHapy8/1M+bropNM/qSTSVe8zxfliaIKlvVBZ2Nylu+wRWT0pBzcFTfVwwNdn/bWGOADMNo1Eunx4x00wdB04t89/1O/w1cDnyilFU=';
const IMAGE_PATH = path.resolve('public/richmenu-2500x1686.png');
const RICH_MENU_SPEC_PATH = path.resolve('docs/rich-menu.json');

console.log('====================================================');
console.log('  PLODPLOI: LINE Rich Menu Deploy & Automation');
console.log('====================================================');

const headers = {
  Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
};

async function main() {
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`ERROR: Image file not found at ${IMAGE_PATH}`);
    process.exit(1);
  }
  const imageStats = fs.statSync(IMAGE_PATH);
  console.log(`Image file: ${IMAGE_PATH} (${(imageStats.size / 1024).toFixed(1)} KB)`);

  const spec = JSON.parse(fs.readFileSync(RICH_MENU_SPEC_PATH, 'utf8'));
  console.log(`Rich Menu Spec: ${spec.name} (${spec.size.width}x${spec.size.height})`);
  console.log(`Areas configured: ${spec.areas.length} zones:`);
  spec.areas.forEach((area, i) => {
    console.log(`  Zone ${i + 1}: x=${area.bounds.x}, y=${area.bounds.y}, w=${area.bounds.width}, h=${area.bounds.height}`);
    console.log(`    Action: ${area.action.type} | Label: ${area.action.label || '-'} | Text/URI: ${area.action.text || area.action.uri || area.action.data}`);
  });

  // Step 1: List existing rich menus before creation
  console.log('\n[Step 1] Fetching existing Rich Menus...');
  const listRes = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers });
  const listData = await listRes.json();
  const existingMenus = listData.richmenus || [];
  console.log(`Found ${existingMenus.length} existing rich menu(s) on channel.`);
  existingMenus.forEach(rm => console.log(` - ${rm.richMenuId}: ${rm.name}`));

  // Step 2: Create new Rich Menu structure
  console.log('\n[Step 2] Creating new Rich Menu via LINE Messaging API...');
  const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(spec),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.richMenuId) {
    console.error('Failed to create rich menu structure:', createData);
    process.exit(1);
  }
  const newRichMenuId = createData.richMenuId;
  console.log(`SUCCESS: Created Rich Menu with ID: ${newRichMenuId}`);

  // Step 3: Upload Image to Rich Menu
  console.log(`\n[Step 3] Uploading graphic image to ${newRichMenuId}...`);
  const imageBuffer = fs.readFileSync(IMAGE_PATH);
  const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${newRichMenuId}/content`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.text();
    console.error(`Failed to upload image (HTTP ${uploadRes.status}):`, uploadErr);
    process.exit(1);
  }
  console.log(`SUCCESS: Image uploaded successfully to ${newRichMenuId} (HTTP ${uploadRes.status})`);

  // Step 4: Set as Default Rich Menu for all users
  console.log(`\n[Step 4] Setting ${newRichMenuId} as Default for all users...`);
  const setDefaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${newRichMenuId}`, {
    method: 'POST',
    headers,
  });

  if (!setDefaultRes.ok) {
    const setErr = await setDefaultRes.text();
    console.error(`Failed to set default rich menu (HTTP ${setDefaultRes.status}):`, setErr);
    process.exit(1);
  }
  console.log(`SUCCESS: Default Rich Menu set to ${newRichMenuId}! (HTTP ${setDefaultRes.status})`);

  // Step 5: Verify Default Rich Menu
  console.log('\n[Step 5] Verifying current Default Rich Menu...');
  const verifyRes = await fetch('https://api.line.me/v2/bot/user/all/richmenu', { headers });
  if (verifyRes.ok) {
    const verifyData = await verifyRes.json();
    console.log(`Current verified Default Rich Menu ID: ${verifyData.richMenuId}`);
  } else {
    console.log(`Verify returned HTTP ${verifyRes.status}:`, await verifyRes.text());
  }

  // Step 6: Cleanup old rich menus
  console.log('\n[Step 6] Cleaning up old Rich Menus...');
  for (const rm of existingMenus) {
    if (rm.richMenuId !== newRichMenuId) {
      console.log(`Deleting old rich menu: ${rm.richMenuId} (${rm.name})...`);
      const delRes = await fetch(`https://api.line.me/v2/bot/richmenu/${rm.richMenuId}`, {
        method: 'DELETE',
        headers,
      });
      if (delRes.ok) {
        console.log(` - Deleted ${rm.richMenuId} successfully.`);
      } else {
        console.warn(` - Could not delete ${rm.richMenuId}: HTTP ${delRes.status}`);
      }
    }
  }

  console.log('\n====================================================');
  console.log('✅ ALL STEPS COMPLETED SUCCESSFULLY!');
  console.log(`Active Default Rich Menu ID: ${newRichMenuId}`);
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
