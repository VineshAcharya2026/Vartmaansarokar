import fs from 'fs';

const API_BASE = 'https://vartmaan-sarokaar-api.vineshjm.workers.dev';

async function testUpdate() {
  console.log('--- Testing Article Update API ---');
  
  // 1. Get token
  const loginRes = await fetch(`${API_BASE}/api/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@vartmaansarokar.com', password: 'PassworD@2026' })
  });
  const { token, user } = await loginRes.json();
  console.log(`✅ Logged in as ${user.role} - ${user.email}`);

  // 2. Fetch all news
  const newsRes = await fetch(`${API_BASE}/api/news/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const newsData = await newsRes.json();
  const articles = newsData.news || [];
  if (!articles.length) {
    console.log('No articles to test update with!');
    
    // Create one
    const createRes = await fetch(`${API_BASE}/api/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'Test Article', content: 'Test Content' })
    });
    const createData = await createRes.json();
    articles.push(createData.article);
    console.log('Created dummy article with ID:', createData.article.id);
  }

  const articleToEdit = articles[0];
  console.log('Will edit article ID:', articleToEdit.id);

  // 3. Perform Update
  const newTitle = `Updated Title ${Date.now()}`;
  console.log('Sending PUT to update title to:', newTitle);
  
  const updateRes = await fetch(`${API_BASE}/api/news/${articleToEdit.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title: newTitle })
  });

  const updateData = await updateRes.json();
  console.log('Update Status:', updateRes.status);
  console.log('Update Response:', updateData);

  // 4. Verify
  const verifyRes = await fetch(`${API_BASE}/api/news/${articleToEdit.id}`);
  const verifyData = await verifyRes.json();
  if (verifyData.article?.title === newTitle) {
    console.log('✅ Update persisted to DB successfully!');
  } else {
    console.error('❌ Update failed silently in DB. Original title:', verifyData.article?.title);
  }
}

testUpdate();
