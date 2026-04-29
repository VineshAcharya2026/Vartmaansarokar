
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8787',
});

async function test() {
  try {
    const res = await api.get('/api/health');
    console.log('Health check:', res.data);
  } catch (e) {
    console.error('Health check failed:', e.message);
  }
}

test();
