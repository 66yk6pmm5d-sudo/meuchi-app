import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, ImagePlus, Send, Volume2, VolumeX } from 'lucide-react';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  loading: boolean;
  listening: boolean;
  speechSupported: boolean;
  autoSpeak: boolean;
  onToggleMic: () => void;
  onSend: (text: string) => void;
  onImageUpload: (file: File) => void;
  onToggleAutoSpeak: () => void;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-teal-800 flex items-center justify-center text-xs text-teal-200 mr-2 mt-1 shrink-0 font-bold">
          め
        </div>
      )}
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {msg.imageData && (
          <img
            src={msg.imageData}
            alt="uploaded"
            className="rounded-xl max-h-40 object-cover"
          />
        )}
        {msg.content && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-teal-700 text-white rounded-tr-sm'
                : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
            }`}
          >
            {msg.content}
          </div>
        )}
        <span className="text-zinc-600 text-[10px] px-1">
          {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function ChatView({
  messages,
  loading,
  listening,
  speechSupported,
  autoSpeak,
  onToggleMic,
  onSend,
  onImageUpload,
  onToggleAutoSpeak,
}: Props) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleSend() {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    onSend(t);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-teal-900 flex items-center justify-center text-sm font-bold text-teal-100 shadow-lg shadow-teal-900/50">
            め
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wide">めうち</p>
            <p className="text-teal-400 text-[11px]">
              {listening ? '聞いてるよ…' : 'いつでもどうぞ'}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleAutoSpeak}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          title={autoSpeak ? '音声オフ' : '音声オン'}
        >
          {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-2xl font-bold text-teal-100 shadow-xl shadow-teal-900/60">
              め
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              やあ、めうちだよ。<br />
              気軽に話しかけてね。
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-teal-800 flex items-center justify-center text-xs text-teal-200 shrink-0 font-bold">
              め
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-zinc-800/60">
        <div className="flex items-end gap-2">
          {/* Image upload */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all shrink-0"
          >
            <ImagePlus size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Text input */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="メッセージを入力…"
            rows={1}
            className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-1 focus:ring-teal-700 transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />

          {/* Send or Mic */}
          {draft.trim() ? (
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-teal-700 hover:bg-teal-600 flex items-center justify-center text-white transition-all shrink-0"
            >
              <Send size={16} />
            </button>
          ) : speechSupported ? (
            <button
              onClick={onToggleMic}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                listening
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-800/60 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {listening ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
          ) : null}
        </div>

        {/* Large mic button */}
        {speechSupported && !draft.trim() && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onToggleMic}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                listening
                  ? 'bg-teal-600 shadow-[0_0_32px_8px_rgba(13,148,136,0.35)]'
                  : 'bg-zinc-800 hover:bg-zinc-700 shadow-lg'
              }`}
            >
              {listening && (
                <span className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
              )}
              {listening ? (
                <Mic size={26} className="text-white" />
              ) : (
                <MicOff size={26} className="text-zinc-400" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
