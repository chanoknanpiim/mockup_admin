import crypto from 'crypto';

const WEBHOOK_URL = 'https://wotvrvrfpwinvaagwnle.supabase.co/functions/v1/line-webhook';
const CHANNEL_SECRET = '92f558f9918534d9ad8eef1c511078a7';

console.log('====================================================');
console.log('LINE Webhook Endpoint Diagnostic & E2E Test');
console.log('====================================================');
console.log(`Target URL : ${WEBHOOK_URL}`);
console.log('----------------------------------------------------');

// Test 1: GET Health Check
console.log('\n[TEST 1] Sending GET request (Health Check)...');
try {
  const getRes = await fetch(WEBHOOK_URL, { method: 'GET' });
  const getJson = await getRes.json();
  console.log(`Result: HTTP ${getRes.status}`);
  console.log('Response:', getJson);
} catch (err) {
  console.error('GET request error:', err.message);
}

// Test 2: POST Location Message Simulation (มธ. ท่าพระจันทร์)
console.log('\n[TEST 2] Simulating LINE Location Message Event (มธ. ท่าพระจันทร์)...');
const samplePayload = {
  destination: 'U_TEST_BOT_DESTINATION',
  events: [
    {
      type: 'message',
      message: {
        type: 'location',
        id: 'test-loc-12345',
        title: 'มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์',
        address: '2 ถนนพระจันทร์ แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ',
        latitude: 13.75633,
        longitude: 100.49080,
      },
      timestamp: Date.now(),
      source: {
        type: 'user',
        userId: 'U_TEST_LINE_USER_PLODPLOI',
      },
      replyToken: 'test_reply_token_non_empty',
    },
  ],
};

const rawBody = JSON.stringify(samplePayload);

// Compute HMAC-SHA256 Base64 signature
const signature = crypto
  .createHmac('sha256', CHANNEL_SECRET)
  .update(rawBody)
  .digest('base64');

console.log(`Generated x-line-signature: ${signature}`);

try {
  const postRes = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-line-signature': signature,
    },
    body: rawBody,
  });

  const postText = await postRes.text();
  console.log(`Result: HTTP ${postRes.status}`);
  console.log(`Response Body: ${postText}`);

  if (postRes.status === 200) {
    console.log('\n SUCCESS: Edge Function processed the Location event successfully (200 OK)!');
  } else {
    console.log('\n FAILED: Unexpected status code');
  }
} catch (err) {
  console.error('POST request error:', err.message);
}

console.log('====================================================\n');
