import fs from 'fs';
import path from 'path';

const API_BASE = 'https://vartmaan-sarokaar-api.vineshjm.workers.dev';

async function runTests() {
  console.log('--- Starting API Verification ---');
  let token = '';

  // 1. Test Login
  try {
    console.log('1. Testing Login...');
    const loginRes = await fetch(`${API_BASE}/api/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@vartmaansarokar.com', password: 'PassworD@2026' })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login Failed!', loginRes.status, loginData);
      return;
    }
    
    token = loginData.token;
    console.log('✅ Login Successful! Token received.');
  } catch (e) {
    console.error('❌ Login Error:', e);
    return;
  }

  // 2. Test fetching media (protected route)
  try {
    console.log('\n2. Testing Media Fetch (to verify token usage)...');
    const mediaRes = await fetch(`${API_BASE}/api/media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (mediaRes.ok) {
       console.log('✅ Media fetch successful! Status:', mediaRes.status);
    } else {
       const text = await mediaRes.text();
       console.error('❌ Media fetch failed. Status:', mediaRes.status, text);
    }
  } catch(e) {
     console.error('❌ Media Fetch Error:', e);
  }

  // 3. Test dummy file upload
  try {
    console.log('\n3. Testing Media Upload...');
    const formData = new FormData();
    const blob = new Blob(['%PDF-dummy-content'], { type: 'application/pdf' });
    formData.append('file', blob, 'test-upload.pdf');

    const uploadRes = await fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      console.log('✅ Upload successful! Media response:', uploadData);
    } else {
      const text = await uploadRes.text();
      console.error('❌ Upload failed. Status:', uploadRes.status, text);
    }
  } catch(e) {
    console.error('❌ Upload Error:', e);
  }

  console.log('--- Verification Complete ---');
}

runTests();