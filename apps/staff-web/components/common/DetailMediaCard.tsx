"use client";

import React from "react";
import { Download } from "@beaulab/ui-admin";
import { downloadFile } from "@/lib/common/api";

type DetailImageMediaCardProps = {
  fileName: string;
  fileUrl?: string | null;
  imageUrl?: string | null;
  sizeText?: string | null;
  badgeText?: string | null;
  aspectClassName?: string;
  className?: string;
  previewAlt?: string;
  unsupportedText?: string;
};

type DetailCompactMediaCardProps = {
  fileName: string;
  fileUrl?: string | null;
  downloadUrl?: string | null;
  sizeText?: string | null;
  previewUrl?: string | null;
  previewAlt?: string;
  previewSizeClassName?: string;
  previewMode?: "contain" | "cover";
  previewFallbackText?: string;
  showPreviewFrame?: boolean;
  showDownload?: boolean;
};

type DetailEmptyStateProps = {
  children: React.ReactNode;
};

export function DetailImageMediaCard({
  fileName,
  fileUrl,
  imageUrl,
  sizeText,
  badgeText,
  aspectClassName = "aspect-[4/3]",
  className = "",
  previewAlt = "",
  unsupportedText = "미리보기를 지원하지 않는 파일입니다.",
}: DetailImageMediaCardProps) {
  return (
    <div
      className={[
        "w-full max-w-[500px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:max-w-none dark:border-gray-800 dark:bg-gray-900",
        className,
      ]
        .join(" ")
        .trim()}
    >
      <div className={["relative overflow-hidden bg-gray-50 dark:bg-gray-900", aspectClassName].join(" ")}>
        {badgeText ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            {badgeText}
          </div>
        ) : null}

        {imageUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 p-3 dark:bg-gray-950/40">
            {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
            <img src={imageUrl} alt={previewAlt} className="h-auto w-auto max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {unsupportedText}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={fileName}>
            {fileName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {sizeText ? <p className="text-xs text-gray-500 dark:text-gray-400">{sizeText}</p> : null}
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400"
              >
                파일 보기
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailCompactMediaCard({
  fileName,
  fileUrl,
  downloadUrl,
  sizeText,
  previewUrl,
  previewAlt = "",
  previewSizeClassName = "h-20 w-20",
  previewMode = "contain",
  previewFallbackText = "파일",
  showPreviewFrame = true,
  showDownload = false,
}: DetailCompactMediaCardProps) {
  const previewClassName =
    previewMode === "cover"
      ? "h-full w-full object-cover"
      : "h-auto w-auto max-h-full max-w-full object-contain";

  return (
    <div className="flex w-full max-w-[500px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:max-w-none dark:border-gray-800 dark:bg-gray-900">
      <div
        className={[
          "shrink-0 overflow-hidden rounded-xl",
          previewSizeClassName,
          showPreviewFrame ? "bg-gray-50 dark:bg-gray-900" : "",
        ].join(" ")}
      >
        {previewUrl ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900">
            {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
            <img src={previewUrl} alt={previewAlt} className={previewClassName} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            {previewFallbackText}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={fileName}>
          {fileName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {sizeText ? <p className="text-xs text-gray-500 dark:text-gray-400">{sizeText}</p> : null}
          {fileUrl ? (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400"
              >
                파일 보기
              </a>
              {showDownload ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 border-b border-current pb-px text-xs font-medium leading-none text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    void downloadFile(downloadUrl ?? fileUrl ?? "", fileName);
                  }}
                  disabled={!downloadUrl && !fileUrl}
                >
                  <Download className="size-3.5" />
                  다운로드
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DetailEmptyState({ children }: DetailEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
      {children}
    </div>
  );
}
