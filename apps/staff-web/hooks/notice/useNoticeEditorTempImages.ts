"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import { extractTempNoticeEditorImageUrls } from "@/lib/notice/form";

type NoticeEditorImageUploadResponse = {
  url?: string | null;
  is_temporary?: boolean;
};

export function useNoticeEditorTempImages() {
  const trackedTempUrlsRef = React.useRef<string[]>([]);

  const cleanupUrls = React.useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;

    const response = await api.raw<{ deleted_count: number }>("/notices/editor-images", {
      method: "DELETE",
      body: { urls },
    });

    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "에디터 임시 이미지 정리에 실패했습니다.");
    }
  }, []);

  const uploadImage = React.useCallback(async (file: File, noticeId?: number | null) => {
    const formData = new FormData();
    formData.append("image", file);
    if (noticeId && Number.isFinite(noticeId) && noticeId > 0) {
      formData.append("notice_id", String(noticeId));
    }

    const response = await api.post<NoticeEditorImageUploadResponse>("/notices/editor-images", formData);
    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "에디터 이미지 업로드에 실패했습니다.");
    }

    const url = response.data.url?.trim();
    if (!url) {
      throw new Error("에디터 이미지 업로드 URL이 비어 있습니다.");
    }

    if (response.data.is_temporary) {
      trackedTempUrlsRef.current = Array.from(new Set([...trackedTempUrlsRef.current, url]));
    }

    return { url };
  }, []);

  const cleanupRemovedTempImages = React.useCallback(
    async (content: string) => {
      const currentUrls = new Set(extractTempNoticeEditorImageUrls(content));
      const removedUrls = trackedTempUrlsRef.current.filter((url) => !currentUrls.has(url));

      if (removedUrls.length === 0) return;

      trackedTempUrlsRef.current = trackedTempUrlsRef.current.filter((url) => currentUrls.has(url));

      try {
        await cleanupUrls(removedUrls);
      } catch {
        trackedTempUrlsRef.current = Array.from(new Set([...trackedTempUrlsRef.current, ...removedUrls]));
      }
    },
    [cleanupUrls],
  );

  const cleanupAllTempImages = React.useCallback(async () => {
    const urls = [...trackedTempUrlsRef.current];
    if (urls.length === 0) return;

    trackedTempUrlsRef.current = [];

    try {
      await cleanupUrls(urls);
    } catch {
      trackedTempUrlsRef.current = urls;
    }
  }, [cleanupUrls]);

  const clearTrackedTempImages = React.useCallback(() => {
    trackedTempUrlsRef.current = [];
  }, []);

  return {
    uploadImage,
    cleanupRemovedTempImages,
    cleanupAllTempImages,
    clearTrackedTempImages,
  };
}
