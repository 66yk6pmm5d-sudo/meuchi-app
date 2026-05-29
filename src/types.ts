export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string;
  timestamp: number;
}

export interface Memo {
  id: string;
  content: string;
  source: 'image' | 'text';
  createdAt: number;
}

export interface UserMemory {
  preferences: Record<string, string>;
  facts: string[];
  lastUpdated: number;
}

export interface AppSettings {
  openrouterApiKey: string;
  voiceEnabled: boolean;
  autoSpeak: boolean;
}
