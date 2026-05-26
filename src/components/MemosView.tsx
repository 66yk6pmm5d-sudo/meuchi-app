import { useState } from 'react';
import { Trash2, FileText, Camera, Plus } from 'lucide-react';
import type { Memo } from '../types';
import { getMemos, saveMemos } from '../lib/storage';

interface Props {
  apiKey: string;
}

export default function MemosView({ apiKey: _apiKey }: Props) {
  const [memos, setMemos] = useState<Memo[]>(() => getMemos());
  const [newMemo, setNewMemo] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function addMemo() {
    const text = newMemo.trim();
    if (!text) return;
    const memo: Memo = {
      id: Math.random().toString(36).slice(2) + Date.now(),
      content: text,
      source: 'text',
      createdAt: Date.now(),
    };
    const updated = [memo, ...memos];
    setMemos(updated);
    saveMemos(updated);
    setNewMemo('');
  }

  function deleteMemo(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    const updated = memos.filter((m) => m.id !== id);
    setMemos(updated);
    saveMemos(updated);
    setConfirmDelete(null);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 py-6 gap-4">
      <h2 className="text-white text-lg font-semibold">メモ</h2>

      {/* Add memo */}
      <div className="bg-zinc-800/60 rounded-2xl p-3 flex gap-2">
        <textarea
          value={newMemo}
          onChange={(e) => setNewMemo(e.target.value)}
          placeholder="メモを追加…"
          rows={2}
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 text-sm resize-none outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) addMemo();
          }}
        />
        <button
          onClick={addMemo}
          disabled={!newMemo.trim()}
          className="self-end w-8 h-8 rounded-full bg-teal-700 hover:bg-teal-600 disabled:bg-zinc-700 disabled:text-zinc-600 text-white flex items-center justify-center transition-all shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Memo list */}
      {memos.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
          <FileText size={36} className="text-zinc-700" />
          <p className="text-zinc-600 text-sm">
            まだメモはないよ。<br />
            画像を送るとめうちが読み取って<br />メモに追加できるよ。
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {memos.map((memo) => (
            <li key={memo.id} className="bg-zinc-800/60 rounded-2xl p-4 flex gap-3">
              <div className="mt-0.5 shrink-0">
                {memo.source === 'image' ? (
                  <Camera size={15} className="text-teal-400" />
                ) : (
                  <FileText size={15} className="text-zinc-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {memo.content}
                </p>
                <p className="text-zinc-600 text-[11px] mt-1">
                  {new Date(memo.createdAt).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={() => deleteMemo(memo.id)}
                className={`shrink-0 mt-0.5 transition-colors ${
                  confirmDelete === memo.id
                    ? 'text-red-400'
                    : 'text-zinc-700 hover:text-zinc-400'
                }`}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
