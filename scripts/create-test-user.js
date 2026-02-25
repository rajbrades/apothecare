#!/usr/bin/env node

/**
 * Create a test user account
 * Usage: node scripts/create-test-user.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY') {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const testEmail = 'test@apothecare.com';
  const testPassword = 'Test123456!';

  console.log('🔧 Creating test user...');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
  console.log('');

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Practitioner'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  User already exists - you can log in with these credentials');
        console.log('');
        console.log('📧 Email:', testEmail);
        console.log('🔑 Password:', testPassword);
        process.exit(0);
      }
      throw authError;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create practitioner record
    const { data: practData, error: practError } = await supabase
      .from('practitioners')
      .insert({
        auth_user_id: authData.user.id,
        email: testEmail,
        full_name: 'Test Practitioner',
        license_type: 'md',
        license_number: 'TEST12345',
        license_state: 'CA',
        npi: '1234567890',
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        practice_name: 'Test Functional Medicine Clinic',
        specialty_focus: ['hormone_optimization', 'gi_health'],
        years_in_practice: 5,
        subscription_tier: 'pro',
        subscription_status: 'active',
        preferred_evidence_sources: ['ifm', 'a4m', 'pubmed']
      })
      .select()
      .single();

    if (practError) throw practError;

    console.log('✅ Practitioner profile created:', practData.id);
    console.log('');
    console.log('🎉 Test account ready!');
    console.log('');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/auth/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
