import { useEffect, useRef, useCallback, useState } from 'react';

interface UseSpeechOptions {
  onResult: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  enabled: boolean;
}

export function useSpeechRecognition({ onResult, onStart, onEnd, enabled }: UseSpeechOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const restartRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as typeof window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSupported(true);

    const rec = new SpeechRecognition();
    rec.lang = 'ja-JP';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      onStart?.();
    };

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join('');
      if (transcript.trim()) onResult(transcript.trim());
    };

    rec.onend = () => {
      setListening(false);
      onEnd?.();
      if (restartRef.current) {
        setTimeout(() => rec.start(), 300);
      }
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognitionRef.current = rec;
    return () => {
      restartRef.current = false;
      rec.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || !enabled) return;
    restartRef.current = true;
    try {
      recognitionRef.current.start();
    } catch {
      // already started
    }
  }, [enabled]);

  const stop = useCallback(() => {
    restartRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}

export function speak(text: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP';
  utt.rate = 1.05;
  utt.pitch = 1.1;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

export function stopSpeaking(): void {
  window.speechSynthesis?.cancel();
}
