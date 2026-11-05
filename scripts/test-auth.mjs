import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wotvrvrfpwinvaagwnle.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Jw87Rp6PXwOFTW0v2Arlnw_RghodbjG';

const email = (process.argv[2] && !process.argv[2].startsWith('-')) ? process.argv[2] : 'plodploith@gmail.com';
const password = process.argv[3] || process.argv[2] || 'test-check-password';

console.log('====================================================');
console.log('Supabase Auth Terminal Diagnostic');
console.log('====================================================');
console.log(`Endpoint : ${SUPABASE_URL}`);
console.log(`Testing Email : ${email.trim().toLowerCase()}`);
console.log('----------------------------------------------------');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  console.log(`Attempting signInWithPassword...`);
  const startTime = Date.now();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password === email ? 'test-check-password' : password,
  });
  const elapsed = Date.now() - startTime;

  if (error) {
    console.log(`\n[RESPONSE] Status ${error.status || 400} (${elapsed}ms)`);
    console.log(`  Error Code   : ${error.code || 'N/A'}`);
    console.log(`  Error Name   : ${error.name}`);
    console.log(`  Error Message: "${error.message}"`);
    console.log('\n[DIAGNOSIS]');
    if (error.code === 'invalid_credentials' || error.message.includes('Invalid login credentials')) {
      console.log('  -> Supabase API reached successfully.');
      console.log('  -> Result: รหัสผ่านไม่ตรงกับที่บันทึกอยู่ใน Supabase Auth (Invalid login credentials)');
      console.log('     หรือมีการเปลี่ยนรหัสผ่านแต่ยังไม่ตรงกับที่กรอก');
    } else if (error.message.includes('Email not confirmed')) {
      console.log('  -> Result: บัญชียังไม่ได้ยืนยันอีเมล (Email not confirmed)');
    } else {
      console.log(`  -> Result: ${error.message}`);
    }
  } else {
    console.log(`\n[SUCCESS] Authentication Succeeded! (${elapsed}ms)`);
    console.log(`  User ID      : ${data.user?.id}`);
    console.log(`  Email        : ${data.user?.email}`);
    console.log(`  Confirmed At : ${data.user?.confirmed_at}`);
    console.log(`  Last Sign-in : ${data.user?.last_sign_in_at}`);

    console.log('\nChecking admin_profiles table for role authorization...');
    const { data: profile, error: pError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (pError) {
      console.log(`  Error reading admin_profiles: ${pError.message}`);
    } else if (!profile) {
      console.log('  WARNING: No row found in admin_profiles! (User is Unauthorized)');
    } else {
      console.log(`  Role         : ${profile.role}`);
      console.log(`  Is Active    : ${profile.is_active}`);
      if (profile.is_active && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'moderator')) {
        console.log('  STATUS       : AUTHORIZED ADMIN (เข้าสู่ระบบได้สมบูรณ์)');
      } else {
        console.log('  STATUS       : UNAUTHORIZED (ไม่มีสิทธิ์ผู้ดูแล)');
      }
    }
  }
  console.log('====================================================\n');
}

runTest();
