const API_BASE = 'https://vartmaan-sarokaar-api.vineshjm.workers.dev';

async function run() {
  console.log('\n========================================');
  console.log('  VartmaanSarokar - Full System Audit');
  console.log('========================================\n');

  // --- 1. LOGIN ---
  let token, userId;
  try {
    const res = await fetch(`${API_BASE}/api/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@vartmaansarokar.com', password: 'PassworD@2026' })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || d.message);
    token = d.token; userId = d.user.id;
    console.log(`✅ [1] LOGIN       OK  (role: ${d.user.role})`);
  } catch(e) { console.error(`❌ [1] LOGIN       FAIL  → ${e.message}`); process.exit(1); }

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // --- 2. CREATE ARTICLE ---
  let articleId;
  try {
    const res = await fetch(`${API_BASE}/api/news`, {
      method: 'POST', headers,
      body: JSON.stringify({ title: 'E2E Test Article', content: 'Body text', category: 'National News', featured: false, requires_subscription: false })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || d.message);
    articleId = d.article?.id;
    console.log(`✅ [2] CREATE NEWS  OK  (id: ${articleId})`);
  } catch(e) { console.error(`❌ [2] CREATE NEWS  FAIL  → ${e.message}`); }

  // --- 3. UPDATE ARTICLE ---
  if (articleId) {
    try {
      const res = await fetch(`${API_BASE}/api/news/${articleId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ title: 'E2E Updated Title', content: 'Updated body', category: 'National News' })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || d.message);
      console.log(`✅ [3] UPDATE NEWS  OK  (status: ${d.article?.status})`);
    } catch(e) { console.error(`❌ [3] UPDATE NEWS  FAIL  → ${e.message}`); }
  }

  // --- 4. MEDIA UPLOAD ---
  let uploadedUrl;
  try {
    const form = new FormData();
    form.append('file', new Blob(['%PDF-test'], { type: 'application/pdf' }), 'e2e-test.pdf');
    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || d.message);
    uploadedUrl = `${API_BASE}${d.media?.url}`;
    console.log(`✅ [4] MEDIA UPLOAD OK  (url: ${d.media?.url})`);
  } catch(e) { console.error(`❌ [4] MEDIA UPLOAD FAIL  → ${e.message}`); }

  // --- 5. PUBLISH MAGAZINE ---
  try {
    const pdfUrl = uploadedUrl || `${API_BASE}/api/files/uploads/test.pdf`;
    const res = await fetch(`${API_BASE}/api/magazines`, {
      method: 'POST', headers,
      body: JSON.stringify({
        title: 'E2E Test Magazine',
        issue_number: 'Vol. E2E',
        cover_image: '',
        pdf_url: pdfUrl,
        pages: [],
        page_images: [],
        price_digital: 0,
        price_physical: 499,
        gated_page: 2,
        is_free: 1,
        blur_paywall: 0
      })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || d.message);
    console.log(`✅ [5] MAGAZINE     OK  (id: ${d.magazine?.id}, status: ${d.magazine?.status})`);
  } catch(e) { console.error(`❌ [5] MAGAZINE     FAIL  → ${e.message}`); }

  // --- 6. DELETE TEST ARTICLE ---
  if (articleId) {
    try {
      const res = await fetch(`${API_BASE}/api/news/${articleId}`, { method: 'DELETE', headers });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || d.message);
      console.log(`✅ [6] DELETE NEWS  OK`);
    } catch(e) { console.error(`❌ [6] DELETE NEWS  FAIL  → ${e.message}`); }
  }

  console.log('\n========================================\n');
}

run();
