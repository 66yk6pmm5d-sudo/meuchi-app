import { useState, useCallback } from 'react';
import { sendMessage } from '../lib/gemini';
import { getMessages, saveMessages, getMemory, saveMemory } from '../lib/storage';
import type { Message, UserMemory } from '../types';

function newId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

function extractMemoryUpdates(text: string, memory: UserMemory): UserMemory {
  const updated = { ...memory, facts: [...memory.facts] };
  const patterns = [
    /私は(.{2,20})が好き/,
    /(.{2,10})が苦手/,
    /名前は(.{1,10})です/,
    /(.{2,10})に住んで/,
    /(.{2,10})の仕事/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && !updated.facts.includes(m[0])) {
      updated.facts = [...updated.facts.slice(-19), m[0]];
    }
  }
  updated.lastUpdated = Date.now();
  return updated;
}

export function useChat(apiKey: string) {
  const [messages, setMessages] = useState<Message[]>(() => getMessages());
  const [loading, setLoading] = useState(false);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      saveMessages(next);
      return next;
    });
  }, []);

  const sendUserMessage = useCallback(
    async (text: string, imageBase64?: string, imageMime?: string): Promise<string> => {
      if (!apiKey) throw new Error('API key not set');

      const userMsg: Message = {
        id: newId(),
        role: 'user',
        content: text,
        imageData: imageBase64 ? `data:${imageMime};base64,${imageBase64}` : undefined,
        timestamp: Date.now(),
      };
      const memory = getMemory();
      const updatedMemory = extractMemoryUpdates(text, memory);
      saveMemory(updatedMemory);

      const currentMessages = getMessages();
      addMessage(userMsg);

      setLoading(true);
      try {
        const reply = await sendMessage(apiKey, text, currentMessages, updatedMemory, imageBase64, imageMime);
        const assistantMsg: Message = {
          id: newId(),
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        };
        addMessage(assistantMsg);
        return reply;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '不明なエラー';
        const errorMessage: Message = {
          id: newId(),
          role: 'assistant',
          content: `ごめん、エラーが起きてしまったよ…。\n${errorMsg}`,
          timestamp: Date.now(),
        };
        addMessage(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiKey, addMessage]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    saveMessages([]);
  }, []);

  return { messages, loading, sendUserMessage, clearHistory };
}
