import fs from 'fs';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YEm1FmH6TAw3gbCsCUkIdsVeowhTtRO1r7IfgQPMKOBPex3b52CYGuUPDJ8n6tGFBkMg1jHapy8/1M+bropNM/qSTSVe8zxfliaIKlvVBZ2Nylu+wRWT0pBzcFTfVwwNdn/bWGOADMNo1Eunx4x00wdB04t89/1O/w1cDnyilFU=';

console.log('====================================================');
console.log('LINE Rich Menu Creation & Deployment');
console.log('====================================================');

const richMenuData = JSON.parse(fs.readFileSync('docs/rich-menu.json', 'utf8'));

async function createRichMenu() {
  console.log('Creating Rich Menu structure via LINE Messaging API...');
  const res = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(richMenuData),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('Failed to create Rich Menu:', json);
    return null;
  }

  console.log('SUCCESS: Rich Menu created with ID:', json.richMenuId);
  return json.richMenuId;
}

async function listRichMenus() {
  const res = await fetch('https://api.line.me/v2/bot/richmenu/list', {
    headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
  });
  const json = await res.json();
  return json.richmenus || [];
}

const existing = await listRichMenus();
console.log(`Current existing rich menus on channel: ${existing.length}`);
existing.forEach((rm) => console.log(` - ID: ${rm.richMenuId} | Name: ${rm.name}`));

const newId = await createRichMenu();
if (newId) {
  console.log(`\nNext Steps:`);
  console.log(`1. Upload a 2500x1686 background image to Rich Menu:`);
  console.log(`   curl -v -X POST https://api-data.line.me/v2/bot/richmenu/${newId}/content \\`);
  console.log(`     -H "Authorization: Bearer <TOKEN>" \\`);
  console.log(`     -H "Content-Type: image/jpeg" \\`);
  console.log(`     -T /path/to/richmenu-image.jpg\n`);
  console.log(`2. Set as default Rich Menu for all users:`);
  console.log(`   curl -v -X POST https://api.line.me/v2/bot/user/all/richmenu/${newId} \\`);
  console.log(`     -H "Authorization: Bearer <TOKEN>"\n`);
}
console.log('====================================================\n');
