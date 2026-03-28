import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 5174;

function extractText(html) {
  const $ = cheerio.load(html);
  // remove script and style
  $('script,style,noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return text;
}

app.get('/api/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'missing url query param' });
  try {
    const resp = await fetch(String(url), { headers: { 'User-Agent': 'site-scraper/1.0' }, redirect: 'follow' });
    const html = await resp.text();
    const $ = cheerio.load(html);
    const title = ($('title').first().text() || '').trim();
    const text = extractText(html).slice(0, 200000);
    res.json({ title, text });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/chat', async (req, res) => {
  const { url, message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'missing message' });

  let pageText = '';
  if (url) {
    try {
      const resp = await fetch(String(url), { headers: { 'User-Agent': 'site-scraper/1.0' } });
      const html = await resp.text();
      pageText = extractText(html).slice(0, 15000); // limit
    } catch (err) {
      // continue without page text
      console.error('scrape error', err);
    }
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured in env' });

  const systemPrompt = `You are a helpful assistant that answers questions about the provided website content. If a URL is given, use only the provided text extracted from that page (do not invent facts). If the user's question is outside the page's scope, say you don't know and offer to answer more generally.`;

  const combined = `WEBSITE_CONTENT:\n${pageText}`;

  try {
    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: combined },
        { role: 'user', content: message }
      ],
      max_tokens: 800,
      temperature: 0.2
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error });

    const answer = data.choices?.[0]?.message?.content || '';
    res.json({ answer, raw: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
