/**
 * useChartMemory
 * ──────────────
 * Persists chart preferences to localStorage so every setting is remembered
 * across page reloads / browser restarts.
 *
 * Usage:
 *   const [value, setValue] = useChartMemory('key', defaultValue);
 *
 * Works like useState but also syncs to localStorage under the namespace
 * "chart_memory.<key>".
 */
import { useState, useEffect, useCallback } from 'react';

const NS = 'chart_memory';

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(`${NS}.${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(`${NS}.${key}`, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or private browsing – fail silently
  }
}

export function useChartMemory(key, defaultValue) {
  const [state, setStateInner] = useState(() => readStorage(key, defaultValue));

  // Wrap setter so every update also writes to localStorage
  const setState = useCallback(
    (updater) => {
      setStateInner((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        writeStorage(key, next);
        return next;
      });
    },
    [key]
  );

  // If the key changes (unlikely but safe), re-read storage
  useEffect(() => {
    setStateInner(readStorage(key, defaultValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [state, setState];
}

/** Convenience: clear all chart memory (e.g. from a "Reset" button) */
export function clearChartMemory() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(`${NS}.`))
    .forEach((k) => localStorage.removeItem(k));
}
