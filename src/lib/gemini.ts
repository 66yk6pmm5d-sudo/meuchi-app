import type { Message, UserMemory } from '../types';

const SYSTEM_PROMPT = `あなたは「めうち」というAI相棒。落ち着いた親友として短く自然な日本語で返答して。`;

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

function buildHistory(messages: Message[]): GeminiContent[] {
  return messages.slice(-5).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: m.content ? [{ text: m.content }] : [],
  }));
}

function buildSystemWithMemory(memory: UserMemory): string {
  const facts = memory.facts.length
    ? `\n\n【ユーザーについて覚えていること】\n${memory.facts.join('\n')}`
    : '';
  const prefs = Object.keys(memory.preferences).length
    ? `\n\n【ユーザーの好み】\n${Object.entries(memory.preferences)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')}`
    : '';
  return SYSTEM_PROMPT + facts + prefs;
}

export async function sendMessage(
  apiKey: string,
  userText: string,
  history: Message[],
  memory: UserMemory,
  imageBase64?: string,
  imageMime?: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const userParts: GeminiPart[] = [];
  if (imageBase64 && imageMime) {
    userParts.push({ inlineData: { mimeType: imageMime, data: imageBase64 } });
  }
  if (userText) userParts.push({ text: userText });

  const historyContents = buildHistory(history);
  const contents: GeminiContent[] = historyContents.length > 0
    ? [...historyContents, { role: 'user', parts: userParts }]
    : [{ role: 'user', parts: userParts }];

  const body = {
    system_instruction: { parts: [{ text: buildSystemWithMemory(memory) }] },
    contents,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 512,
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = (errData as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
      console.error('Gemini API error:', errorMsg, errData);
      throw new Error(errorMsg);
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      error?: { message?: string };
    };

    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Gemini API response:', JSON.stringify(data, null, 2));
      return 'うまく返答できなかったよ…もう一度試してみてね。';
    }
    return text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

export async function analyzeImage(
  apiKey: string,
  imageBase64: string,
  imageMime: string,
  prompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: imageMime, data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
