import { useState } from 'react';
import { Eye, EyeOff, Trash2, Save } from 'lucide-react';
import type { AppSettings, UserMemory } from '../types';
import { getMemory, saveMemory } from '../lib/storage';

interface Props {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClearHistory: () => void;
}

export default function SettingsView({ settings, onSave, onClearHistory }: Props) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceEnabled);
  const [autoSpeak, setAutoSpeak] = useState(settings.autoSpeak);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [memory, setMemory] = useState<UserMemory>(() => getMemory());
  const [confirmClear, setConfirmClear] = useState(false);

  function handleSave() {
    onSave({ geminiApiKey: apiKey, voiceEnabled, autoSpeak });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleRemoveFact(i: number) {
    const updated = { ...memory, facts: memory.facts.filter((_, idx) => idx !== i) };
    setMemory(updated);
    saveMemory(updated);
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    onClearHistory();
    setConfirmClear(false);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 py-6 gap-6">
      <h2 className="text-white text-lg font-semibold">設定</h2>

      {/* API Key */}
      <section className="bg-zinc-800/60 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-zinc-300 text-sm font-medium">Gemini API キー</p>
        <div className="relative flex items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-zinc-900 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-1 focus:ring-teal-700"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-zinc-600 text-[11px] leading-relaxed">
          Google AI Studio からキーを取得してね。ローカルにのみ保存されるよ。
        </p>
      </section>

      {/* Voice settings */}
      <section className="bg-zinc-800/60 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-zinc-300 text-sm font-medium">音声</p>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-zinc-400 text-sm">音声認識を有効にする</span>
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors ${voiceEnabled ? 'bg-teal-600' : 'bg-zinc-700'} relative`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${voiceEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-zinc-400 text-sm">返答を自動で読み上げる</span>
          <button
            onClick={() => setAutoSpeak((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors ${autoSpeak ? 'bg-teal-600' : 'bg-zinc-700'} relative`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoSpeak ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
      </section>

      {/* Memory */}
      <section className="bg-zinc-800/60 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-zinc-300 text-sm font-medium">覚えていること</p>
        {memory.facts.length === 0 ? (
          <p className="text-zinc-600 text-sm">まだ何も覚えていないよ</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {memory.facts.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 text-sm">{f}</span>
                <button
                  onClick={() => handleRemoveFact(i)}
                  className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all ${
          saved
            ? 'bg-teal-800 text-teal-300'
            : 'bg-teal-700 hover:bg-teal-600 text-white'
        }`}
      >
        <Save size={16} />
        {saved ? '保存したよ！' : '設定を保存'}
      </button>

      {/* Clear history */}
      <button
        onClick={handleClear}
        className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all border ${
          confirmClear
            ? 'border-red-600 bg-red-900/20 text-red-400'
            : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
        }`}
      >
        <Trash2 size={16} />
        {confirmClear ? 'もう一度タップで削除するよ' : '会話履歴を消す'}
      </button>
    </div>
  );
}
