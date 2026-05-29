import type { Message, UserMemory } from '../types';

const SYSTEM_PROMPT = `あなたは「めうち」というAI相棒。落ち着いた親友として短く自然な日本語で返答して。`;

const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildHistory(messages: Message[]): ChatMessage[] {
  return messages.slice(-5).map((m) => ({
    role: m.role === 'user' ? 'user' as const : 'assistant' as const,
    content: m.content,
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
  _imageBase64?: string,
  _imageMime?: string
): Promise<string> {
  const systemMsg: ChatMessage = {
    role: 'system',
    content: buildSystemWithMemory(memory),
  };

  const historyMsgs = buildHistory(history);
  const userMsg: ChatMessage = { role: 'user', content: userText };

  const messages: ChatMessage[] = [systemMsg, ...historyMsgs, userMsg];

  const body = {
    model: MODEL,
    messages,
    temperature: 0.9,
    max_tokens: 512,
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = (errData as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
      console.error('OpenRouter API error:', errorMsg, errData);
      throw new Error(errorMsg);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      error?: { message?: string };
    };

    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.error('OpenRouter API response:', JSON.stringify(data, null, 2));
      return 'うまく返答できなかったよ…もう一度試してみてね。';
    }
    return text;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

export async function analyzeImage(
  _apiKey: string,
  _imageBase64: string,
  _imageMime: string,
  _prompt: string
): Promise<string> {
  return 'このモデルは画像解析に対応していないよ。テキストで教えてもらえればメモにするよ。';
}
