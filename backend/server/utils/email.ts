/**
 * Minimal transactional email — uses Resend HTTP API when configured, otherwise no-op (dev log only).
 */

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev';

  if (apiKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html ?? `<pre>${escapeHtml(params.text)}</pre>`
      })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[email] Resend error', res.status, errText);
      }
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[email stub]', { to: params.to, subject: params.subject });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
