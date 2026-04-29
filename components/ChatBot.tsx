import React from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../utils/app';
import { fetchApi } from '../utils/api';

type Message = { from: 'user' | 'bot' | 'system'; text: string };

const ChatBot: React.FC = () => {
  const { t } = useTranslation();
  const [url, setUrl] = React.useState('');
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);

  const append = (message: Message) => setMessages((prev) => [...prev, message]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    append({ from: 'user', text: userText });
    setInput('');
    append({ from: 'bot', text: t('chat.noResponse') });
  };

  const handleQuickScrape = async () => {
    if (!url.trim()) return;
    append({ from: 'system', text: t('chat.fetchingContent') });
    try {
      const query = new URLSearchParams({ url: url.trim() });
      const data = await fetchApi<{ items?: { title?: string }[] }>(API_BASE + '/api/proxy/rss?' + query.toString());
      const titles = (data.items || []).map((item) => item.title).filter(Boolean) as string[];
      if (titles.length === 0) {
        append({ from: 'system', text: t('chat.noResponse') });
        return;
      }
      append({ from: 'system', text: `${t('chat.titlePrefix')} ${titles[0]}` });
      append({ from: 'system', text: `${t('chat.textPrefix')} ${titles.slice(1, 6).join(' | ')}` });
    } catch (err) {
      append({ from: 'system', text: `${t('chat.failedToScrape')} ${String(err)}` });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-4">{t('chat.title')}</h2>
      <p className="text-sm text-gray-500 mb-4">{t('chat.subtitle')}</p>

      <div className="flex gap-2 mb-4">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('chat.websitePlaceholder')} className="flex-1 border rounded-lg px-3 py-2" />
        <button onClick={handleQuickScrape} className="bg-gray-100 px-4 rounded-lg">{t('chat.fetch')}</button>
      </div>

      <div className="border rounded-lg p-4 h-80 overflow-auto mb-4 bg-gray-50">
        {messages.length === 0 && <div className="text-gray-400">{t('chat.emptyState')}</div>}
        {messages.map((message, index) => (
          <div key={index} className={`mb-3 ${message.from === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg ${message.from === 'user' ? 'bg-[#800000] text-white' : message.from === 'bot' ? 'bg-white text-gray-900 border' : 'bg-yellow-50 text-gray-800'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('chat.inputPlaceholder')} className="flex-1 border rounded-lg px-3 py-2" onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }} />
        <button onClick={() => void handleSend()} disabled={loading} className="bg-[#800000] text-white px-4 rounded-lg">{loading ? t('chat.thinking') : t('chat.send')}</button>
      </div>
    </div>
  );
};

export default ChatBot;
