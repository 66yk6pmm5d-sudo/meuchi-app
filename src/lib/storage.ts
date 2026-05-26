import type { Message, Memo, UserMemory, AppSettings } from '../types';

const KEYS = {
  messages: 'meuchy_messages',
  memos: 'meuchy_memos',
  memory: 'meuchy_memory',
  settings: 'meuchy_settings',
};

export function getMessages(): Message[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.messages) || '[]');
  } catch {
    return [];
  }
}

export function saveMessages(messages: Message[]): void {
  localStorage.setItem(KEYS.messages, JSON.stringify(messages.slice(-200)));
}

export function getMemos(): Memo[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.memos) || '[]');
  } catch {
    return [];
  }
}

export function saveMemos(memos: Memo[]): void {
  localStorage.setItem(KEYS.memos, JSON.stringify(memos));
}

export function getMemory(): UserMemory {
  try {
    return JSON.parse(localStorage.getItem(KEYS.memory) || 'null') || {
      preferences: {},
      facts: [],
      lastUpdated: Date.now(),
    };
  } catch {
    return { preferences: {}, facts: [], lastUpdated: Date.now() };
  }
}

export function saveMemory(memory: UserMemory): void {
  localStorage.setItem(KEYS.memory, JSON.stringify(memory));
}

export function getSettings(): AppSettings {
  try {
    return JSON.parse(localStorage.getItem(KEYS.settings) || 'null') || {
      geminiApiKey: '',
      voiceEnabled: true,
      autoSpeak: true,
    };
  } catch {
    return { geminiApiKey: '', voiceEnabled: true, autoSpeak: true };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
