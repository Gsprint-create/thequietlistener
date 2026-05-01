import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = (req.body ?? {}) as { message?: string };
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'empty_message' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply:
        "I’m here, listening. (No API key configured.) What feels most important right now?",
      warning: 'no_api_key',
    });
  }

  const system =
    'You are The Quiet Listener—calm, empathetic, and non-judgmental. Reflect briefly, then ask ONE open question. Avoid advice/diagnosis. 2–3 short sentences.';

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message },
      ],
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    return res.status(200).json({
      reply:
        "I’m here, even if I couldn’t reach the AI just now. What would make the next hour a little easier?",
      warning: `upstream_${r.status}`,
      detail: text.slice(0, 500),
    });
  }

  const j = await r.json();
  const text = j?.choices?.[0]?.message?.content?.trim();
  return res.status(200).json({
    reply:
      text ||
      "I’m here, listening. What feels most important about this right now?",
  });
}
