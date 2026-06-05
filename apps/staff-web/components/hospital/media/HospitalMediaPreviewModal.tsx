"use client";

import React from "react";

import {
  ChevronLeft,
  ChevronRight,
  Modal,
  ModalBody,
  ModalHeader,
  ModalPanel,
  ModalTitle,
} from "@beaulab/ui-admin";

export type HospitalMediaPreviewItem = {
  url: string;
  title: string;
  isImage: boolean;
};

export type HospitalMediaPreviewState = HospitalMediaPreviewItem & {
  items?: HospitalMediaPreviewItem[];
  index?: number;
};

const EMPTY_MEDIA_PREVIEW_ITEMS: HospitalMediaPreviewItem[] = [];

type HospitalMediaPreviewModalProps = {
  preview: HospitalMediaPreviewState | null;
  onChange: (preview: HospitalMediaPreviewState) => void;
  onClose: () => void;
};

export function HospitalMediaPreviewModal({
  preview,
  onChange,
  onClose,
}: HospitalMediaPreviewModalProps) {
  const items = preview?.items?.length ? preview.items : EMPTY_MEDIA_PREVIEW_ITEMS;
  const activeIndex = preview?.index ?? 0;
  const canNavigate = Boolean(preview && items.length > 1);

  const navigateTo = React.useCallback(
    (nextIndex: number) => {
      if (!preview || !canNavigate) return;

      const normalizedIndex = (nextIndex + items.length) % items.length;
      const nextItem = items[normalizedIndex];
      if (!nextItem) return;

      onChange({
        ...nextItem,
        items,
        index: normalizedIndex,
      });
    },
    [canNavigate, items, onChange, preview],
  );

  const navigateRelative = React.useCallback(
    (direction: -1 | 1) => {
      navigateTo(activeIndex + direction);
    },
    [activeIndex, navigateTo],
  );

  React.useEffect(() => {
    if (!canNavigate) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateRelative(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateRelative(1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canNavigate, navigateRelative]);

  if (!preview) return null;

  const currentPreview = items[activeIndex] ?? preview;

  return (
    <Modal isOpen={Boolean(preview)} onClose={onClose} className="mx-4 w-full max-w-5xl">
      <ModalPanel className="max-h-[92vh] overflow-hidden">
        <ModalHeader>
          <ModalTitle className="truncate text-base">
            {currentPreview.title}
            {canNavigate ? (
              <span className="ml-2 text-sm font-medium text-gray-500">
                {activeIndex + 1} / {items.length}
              </span>
            ) : null}
          </ModalTitle>
        </ModalHeader>

        <ModalBody className="min-h-0 overflow-auto rounded-2xl bg-gray-100 p-4">
          {currentPreview.isImage ? (
            <div className="relative flex min-h-[60vh] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL or local object URL */}
              <img src={currentPreview.url} alt={currentPreview.title} className="max-h-[76vh] max-w-full object-contain" />
              {canNavigate ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigateRelative(-1)}
                    className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-white"
                    aria-label="이전 이미지"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateRelative(1)}
                    className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-white"
                    aria-label="다음 이미지"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <iframe
              src={currentPreview.url}
              title={currentPreview.title}
              className="h-[76vh] w-full rounded-xl border border-gray-200 bg-white"
            />
          )}
        </ModalBody>
      </ModalPanel>
    </Modal>
  );
}
