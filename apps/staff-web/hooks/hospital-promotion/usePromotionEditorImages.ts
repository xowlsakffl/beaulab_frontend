"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { deletePromotionEditorImages, uploadPromotionEditorImage } from "@/lib/hospital-promotion/api";

const TEMP_PREFIX = "/storage/hospital-promotion/editor-images/temp/";

function tempImageKey(url: string) {
  try {
    const path = new URL(url, "https://promotion.invalid").pathname;
    return path.startsWith(TEMP_PREFIX) ? path : null;
  } catch {
    return null;
  }
}

function contentImageKeys(content: string) {
  const document = new DOMParser().parseFromString(content, "text/html");
  return new Set(
    Array.from(document.querySelectorAll("img[src]"), (image) => tempImageKey(image.getAttribute("src") ?? "")).filter(
      (key): key is string => Boolean(key),
    ),
  );
}

export function usePromotionEditorImages(promotionId?: number) {
  const owned = React.useRef(new Map<string, string>());
  const mounted = React.useRef(false);
  const pendingSave = React.useRef<Set<string> | null>(null);
  const uncertainSave = React.useRef(new Set<string>());
  const uploading = React.useRef(0);
  const [isUploading, setIsUploading] = React.useState(false);

  const cleanup = React.useCallback(async (keys: string[]) => {
    const entries = keys
      .filter((key) => !uncertainSave.current.has(key))
      .flatMap((key) => {
        const url = owned.current.get(key);
        return url ? [{ key, url }] : [];
      });
    if (!entries.length) return;
    try {
      const response = await deletePromotionEditorImages(entries.map(({ url }) => url));
      if (isApiSuccess(response)) entries.forEach(({ key }) => owned.current.delete(key));
    } catch {
      // Keep failed cleanup entries tracked without broadening the deletion scope.
    }
  }, []);

  React.useEffect(() => {
    const tracked = owned.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      // An in-flight save may still adopt its images after navigation.
      void cleanup([...tracked.keys()].filter((key) => !pendingSave.current?.has(key)));
    };
  }, [cleanup]);

  const uploadImage = React.useCallback(
    async (file: File) => {
      if (!mounted.current || pendingSave.current) throw new Error("현재 이미지를 업로드할 수 없습니다.");
      uploading.current += 1;
      setIsUploading(true);
      try {
        const response = await uploadPromotionEditorImage(file, promotionId);
        if (!isApiSuccess(response)) throw new Error(response.error.message || "에디터 이미지 업로드에 실패했습니다.");
        const url = response.data.url?.trim();
        if (!url) throw new Error("에디터 이미지 업로드 URL이 비어 있습니다.");
        const key = tempImageKey(url);
        if (key) owned.current.set(key, url);
        if (!mounted.current) {
          if (key) await cleanup([key]);
          throw new Error("이미지 편집이 종료되었습니다.");
        }
        return { url };
      } finally {
        uploading.current -= 1;
        if (mounted.current) setIsUploading(uploading.current > 0);
      }
    },
    [cleanup, promotionId],
  );

  const beginSave = React.useCallback((content: string) => {
    if (uploading.current > 0) return false;
    pendingSave.current = contentImageKeys(content);
    return true;
  }, []);

  const finishSave = React.useCallback(
    (outcome: "saved" | "rejected" | "uncertain") => {
      if (outcome === "uncertain") {
        pendingSave.current?.forEach((key) => uncertainSave.current.add(key));
      }
      if (outcome === "saved") {
        pendingSave.current?.forEach((key) => owned.current.delete(key));
      }
      pendingSave.current = null;
      // Retain removed images during editing so editor undo remains valid.
      if (outcome === "saved" || !mounted.current) void cleanup([...owned.current.keys()]);
    },
    [cleanup],
  );

  return { uploadImage, isUploading, beginSave, finishSave };
}
