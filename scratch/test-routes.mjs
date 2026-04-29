
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8787',
});

async function testRoutes() {
  try {
    console.log('Testing /api/articles/test/approve...');
    const res = await api.post('/api/articles/test/approve');
    console.log('Result:', res.data);
  } catch (e) {
    console.log('Caught Error:', e.response?.status, e.response?.data);
  }

  try {
     console.log('Testing /api/news/test/approve...');
     const res2 = await api.post('/api/news/test/approve');
     console.log('Result:', res2.data);
  } catch (e) {
    console.log('Caught Error:', e.response?.status, e.response?.data);
  }
}

testRoutes();
