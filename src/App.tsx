import { useState, useCallback, useEffect } from 'react';
import { MessageCircle, FileText, Settings } from 'lucide-react';
import ChatView from './components/ChatView';
import MemosView from './components/MemosView';
import SettingsView from './components/SettingsView';
import { useChat } from './hooks/useChat';
import { useSpeechRecognition, speak, stopSpeaking } from './hooks/useSpeech';
import { getSettings, saveSettings, getMemos, saveMemos } from './lib/storage';
import { analyzeImage } from './lib/gemini';
import type { AppSettings, Memo } from './types';

type Tab = 'chat' | 'memos' | 'settings';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [tab, setTab] = useState<Tab>('chat');

  const { messages, loading, sendUserMessage, clearHistory } = useChat(settings.geminiApiKey);

  const handleVoiceResult = useCallback(
    async (text: string) => {
      if (!settings.geminiApiKey) return;
      try {
        stopSpeaking();
        const reply = await sendUserMessage(text);
        if (settings.autoSpeak) {
          speak(reply);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [settings.geminiApiKey, settings.autoSpeak, sendUserMessage]
  );

  const { listening, supported, toggle, stop } = useSpeechRecognition({
    onResult: handleVoiceResult,
    enabled: settings.voiceEnabled,
  });

  useEffect(() => {
    if (!settings.voiceEnabled && listening) stop();
  }, [settings.voiceEnabled, listening, stop]);

  const handleSendText = useCallback(
    async (text: string) => {
      if (!settings.geminiApiKey) {
        alert('設定画面でGemini APIキーを入力してね');
        setTab('settings');
        return;
      }
      try {
        stopSpeaking();
        const reply = await sendUserMessage(text);
        if (settings.autoSpeak) {
          speak(reply);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [settings.geminiApiKey, settings.autoSpeak, sendUserMessage]
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!settings.geminiApiKey) {
        alert('設定画面でGemini APIキーを入力してね');
        setTab('settings');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        const mime = file.type;

        try {
          stopSpeaking();
          const analysisPrompt =
            '画像に何が写っているか教えて。テキスト・レシート・予定などがあれば内容も読み取ってね。返答は日本語で、簡潔にまとめてね。';
          const description = await analyzeImage(settings.geminiApiKey, base64, mime, analysisPrompt);

          const memo: Memo = {
            id: Math.random().toString(36).slice(2) + Date.now(),
            content: description,
            source: 'image',
            createdAt: Date.now(),
          };
          const memos = getMemos();
          saveMemos([memo, ...memos]);

          const reply = await sendUserMessage(
            '画像を送ったよ。内容をメモに保存したから確認してね。',
            base64,
            mime
          );
          if (settings.autoSpeak) {
            speak(reply);
          }
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    },
    [settings.geminiApiKey, settings.autoSpeak, sendUserMessage]
  );

  const handleSaveSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const handleToggleAutoSpeak = useCallback(() => {
    const updated = { ...settings, autoSpeak: !settings.autoSpeak };
    setSettings(updated);
    saveSettings(updated);
    if (!updated.autoSpeak) stopSpeaking();
  }, [settings]);

  return (
    <div className="min-h-screen bg-zinc-950 flex justify-center">
      <div className="w-full max-w-md flex flex-col h-screen relative">
        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {tab === 'chat' && (
            <ChatView
              messages={messages}
              loading={loading}
              listening={listening}
              speechSupported={supported}
              autoSpeak={settings.autoSpeak}
              onToggleMic={toggle}
              onSend={handleSendText}
              onImageUpload={handleImageUpload}
              onToggleAutoSpeak={handleToggleAutoSpeak}
            />
          )}
          {tab === 'memos' && <MemosView apiKey={settings.geminiApiKey} />}
          {tab === 'settings' && (
            <SettingsView
              settings={settings}
              onSave={handleSaveSettings}
              onClearHistory={clearHistory}
            />
          )}
        </div>

        {/* Bottom nav */}
        <nav className="border-t border-zinc-800/60 bg-zinc-950 flex">
          {(
            [
              { id: 'chat', label: 'チャット', Icon: MessageCircle },
              { id: 'memos', label: 'メモ', Icon: FileText },
              { id: 'settings', label: '設定', Icon: Settings },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                tab === id ? 'text-teal-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
