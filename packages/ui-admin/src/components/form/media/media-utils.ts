import React from "react";
import type { ExistingMediaItem } from "./MediaUploader.types";

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

export function buildExistingMediaToken(item: ExistingMediaItem) {
  return `existing:${String(item.id)}`;
}

export function buildNewMediaToken(fileId: string) {
  return `new:${fileId}`;
}

export function normalizeMediaOrder(order: string[] | undefined, defaultOrder: string[]) {
  const validTokenSet = new Set(defaultOrder);
  const nextOrder: string[] = [];
  const pushedTokenSet = new Set<string>();

  for (const token of order ?? []) {
    if (!validTokenSet.has(token) || pushedTokenSet.has(token)) {
      continue;
    }

    nextOrder.push(token);
    pushedTokenSet.add(token);
  }

  for (const token of defaultOrder) {
    if (pushedTokenSet.has(token)) {
      continue;
    }

    nextOrder.push(token);
    pushedTokenSet.add(token);
  }

  return nextOrder;
}

export function useObjectUrlRegistry() {
  const objectUrlByTokenRef = React.useRef(new Map<string, string>());

  React.useEffect(
    () => () => {
      if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") return;

      objectUrlByTokenRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlByTokenRef.current.clear();
    },
    [],
  );

  const getObjectUrl = React.useCallback((token: string, file: File) => {
    const existingUrl = objectUrlByTokenRef.current.get(token);
    if (existingUrl) return existingUrl;
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return null;

    const url = URL.createObjectURL(file);
    objectUrlByTokenRef.current.set(token, url);

    return url;
  }, []);

  const retainObjectUrls = React.useCallback((tokens: Set<string>) => {
    if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") return;

    objectUrlByTokenRef.current.forEach((url, token) => {
      if (tokens.has(token)) return;

      URL.revokeObjectURL(url);
      objectUrlByTokenRef.current.delete(token);
    });
  }, []);

  return { getObjectUrl, retainObjectUrls };
}

export function useStableFileId() {
  const fileIdsRef = React.useRef(new WeakMap<File, string>());
  const nextIdRef = React.useRef(0);

  return React.useCallback((file: File) => {
    const existingId = fileIdsRef.current.get(file);
    if (existingId) {
      return existingId;
    }

    nextIdRef.current += 1;
    const nextId = `media-file-${nextIdRef.current}`;
    fileIdsRef.current.set(file, nextId);
    return nextId;
  }, []);
}
