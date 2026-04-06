const base = 'http://localhost:5174';
const root = 'http://localhost:3000';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = text; }
  return { url, status: res.status, ok: res.ok, payload, headers: Object.fromEntries(res.headers.entries()) };
}

async function run() {
  const results = [];
  const urls = [
    { url: root, opts: { method: 'GET' } },
    { url: `${base}/api/health`, opts: { method: 'GET' } },
    { url: `${base}/api/app-state`, opts: { method: 'GET' } },
    { url: `${base}/api/articles`, opts: { method: 'GET' } },
    { url: `${base}/api/magazines`, opts: { method: 'GET' } },
    { url: `${base}/api/ads`, opts: { method: 'GET' } },
    { url: `${base}/api/doesnotexist`, opts: { method: 'GET' } }
  ];

  for (const { url, opts } of urls) {
    try { results.push(await fetchJson(url, opts)); } catch (error) { results.push({ url, error: error.message }); }
  }

  try {
    const loginResult = await fetchJson(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@vartmaansarokar.com', password: 'PassworD@2026' })
    });
    results.push(loginResult);
    const token = loginResult.payload?.data?.token;
    if (token) {
      results.push(await fetchJson(`${base}/api/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      }));
    }
  } catch (error) {
    results.push({ url: `${base}/api/auth/login`, error: error.message });
  }

  try {
    results.push(await fetchJson(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail', password: '' })
    }));
  } catch (error) {
    results.push({ url: `${base}/api/auth/login invalid`, error: error.message });
  }

  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});