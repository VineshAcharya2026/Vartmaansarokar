import React from 'react';

type Message = { from: 'user' | 'bot' | 'system'; text: string };

const ChatBot: React.FC = () => {
  const [url, setUrl] = React.useState('');
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);

  const append = (m: Message) => setMessages(prev => [...prev, m]);

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    append({ from: 'user', text: userText });
    setInput('');
    setLoading(true);
    try {
      const resp = await fetch(API_BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url || undefined, message: userText })
      });
      const data = await resp.json();
      if (data.answer) append({ from: 'bot', text: data.answer });
      else append({ from: 'bot', text: 'No response from server.' });
    } catch (err) {
      append({ from: 'bot', text: 'Error contacting server: ' + String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScrape = async () => {
    if (!url) return;
    append({ from: 'system', text: 'Fetching page content...' });
    try {
      const q = new URLSearchParams({ url });
      const r = await fetch(API_BASE + '/api/scrape?' + q.toString());
      const d = await r.json();
      if (d.title) append({ from: 'system', text: `Title: ${d.title}` });
      if (d.text) append({ from: 'system', text: `Page text (trimmed): ${d.text.slice(0, 1000)}...` });
    } catch (err) {
      append({ from: 'system', text: 'Failed to scrape: ' + String(err) });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-4">Website ChatBot</h2>
      <p className="text-sm text-gray-500 mb-4">Enter a website URL (optional) and ask questions about it.</p>

      <div className="flex gap-2 mb-4">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="flex-1 border rounded-lg px-3 py-2" />
        <button onClick={handleQuickScrape} className="bg-gray-100 px-4 rounded-lg">Fetch</button>
      </div>

      <div className="border rounded-lg p-4 h-80 overflow-auto mb-4 bg-gray-50">
        {messages.length === 0 && <div className="text-gray-400">No messages yet — ask something!</div>}
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 ${m.from === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg ${m.from === 'user' ? 'bg-blue-600 text-white' : m.from === 'bot' ? 'bg-white text-gray-900 border' : 'bg-yellow-50 text-gray-800'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the site..." className="flex-1 border rounded-lg px-3 py-2" onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
        <button onClick={handleSend} disabled={loading} className="bg-[#800000] text-white px-4 rounded-lg">{loading ? 'Thinking...' : 'Send'}</button>
      </div>
    </div>
  );
};

export default ChatBot;
