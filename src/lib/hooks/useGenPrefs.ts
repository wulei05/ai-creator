'use client';

import { useEffect, useRef } from 'react';

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: object) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Image prefs ───────────────────────────────────────────────

export interface ImagePrefs {
  model: string;
  aspectRatio: string;
}

const IMAGE_KEY = 'gen_prefs_image';

export function loadImagePrefs(): ImagePrefs {
  return safeGet<ImagePrefs>(IMAGE_KEY, { model: '', aspectRatio: '1:1' });
}

export function useImagePrefsSaver(prefs: ImagePrefs) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (prefs.model) safeSet(IMAGE_KEY, prefs);
  }, [prefs]);
}

// ── Video prefs ───────────────────────────────────────────────

export interface VideoPrefs {
  model: string;
  aspectRatio: string;
  duration: number;
}

const VIDEO_KEY = 'gen_prefs_video';

export function loadVideoPrefs(): VideoPrefs {
  return safeGet<VideoPrefs>(VIDEO_KEY, { model: '', aspectRatio: '16:9', duration: 5 });
}

export function useVideoPrefsSaver(prefs: VideoPrefs) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (prefs.model) safeSet(VIDEO_KEY, prefs);
  }, [prefs]);
}
