"use client";

import React from "react";

type IdempotencyEntry = {
  signature: string;
  key: string;
  createdAt: number;
};

const MAX_ENTRIES = 20;

function readEntries(storageKey: string): IdempotencyEntry[] {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is IdempotencyEntry =>
      Boolean(
        entry &&
        typeof entry === "object" &&
        "signature" in entry &&
        typeof entry.signature === "string" &&
        "key" in entry &&
        typeof entry.key === "string" &&
        "createdAt" in entry &&
        typeof entry.createdAt === "number",
      ),
    );
  } catch {
    return [];
  }
}

function writeEntries(storageKey: string, entries: IdempotencyEntry[]) {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // In-memory entries still protect retries while the current page remains mounted.
  }
}

export function usePersistentIdempotencyKeys(namespace: string) {
  const memoryEntriesRef = React.useRef<IdempotencyEntry[]>([]);
  const loadedStorageKeyRef = React.useRef<string | null>(null);
  const storageKey = `beaulab:idempotency:${namespace}`;
  const entries = React.useCallback(() => {
    if (typeof window !== "undefined" && loadedStorageKeyRef.current !== storageKey) {
      memoryEntriesRef.current = readEntries(storageKey);
      loadedStorageKeyRef.current = storageKey;
    }

    return memoryEntriesRef.current;
  }, [storageKey]);

  const getOrCreate = React.useCallback(
    (signature: string) => {
      const current = entries();
      const existing = current.find((entry) => entry.signature === signature);
      if (existing) return existing.key;

      const next = [...current, { signature, key: window.crypto.randomUUID(), createdAt: Date.now() }].slice(
        -MAX_ENTRIES,
      );
      memoryEntriesRef.current = next;
      writeEntries(storageKey, next);

      return next[next.length - 1].key;
    },
    [entries, storageKey],
  );

  const confirm = React.useCallback(
    (signature: string) => {
      const next = entries().filter((entry) => entry.signature !== signature);
      memoryEntriesRef.current = next;
      writeEntries(storageKey, next);
    },
    [entries, storageKey],
  );

  return React.useMemo(() => ({ getOrCreate, confirm }), [confirm, getOrCreate]);
}
