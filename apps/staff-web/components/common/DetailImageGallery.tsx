"use client";

import React from "react";

import type { HospitalMediaPreviewState } from "@/components/hospital/media/HospitalMediaPreviewModal";

export type DetailImageGalleryItem = {
  id: string | number;
  url?: string | null;
  title: string;
  badge?: React.ReactNode;
};

type DetailImageGalleryProps = {
  title: string;
  items: DetailImageGalleryItem[];
  empty: React.ReactNode;
  layout?: "grid" | "scroll";
  onPreview: (preview: HospitalMediaPreviewState) => void;
};

export function DetailImageGallery({
  title,
  items,
  empty,
  layout = "scroll",
  onPreview,
}: DetailImageGalleryProps) {
  const previewItems = React.useMemo(
    () =>
      items
        .filter((item): item is DetailImageGalleryItem & { url: string } => Boolean(item.url))
        .map((item) => ({
          url: item.url,
          title: item.title,
          isImage: true,
        })),
    [items],
  );

  const openPreview = React.useCallback(
    (item: DetailImageGalleryItem) => {
      if (!item.url) return;

      const index = Math.max(0, previewItems.findIndex((previewItem) => previewItem.url === item.url));
      const previewItem = previewItems[index] ?? {
        url: item.url,
        title: item.title,
        isImage: true,
      };

      onPreview({
        ...previewItem,
        items: previewItems.length > 0 ? previewItems : [previewItem],
        index,
      });
    },
    [onPreview, previewItems],
  );

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">{title}</p>
      {items.length > 0 ? (
        layout === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <DetailImageGalleryButton key={item.id} item={item} onClick={() => openPreview(item)} />
            ))}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="flex min-w-full gap-3">
              {items.map((item) => (
                <DetailImageGalleryButton
                  key={item.id}
                  item={item}
                  onClick={() => openPreview(item)}
                  className="shrink-0"
                  style={{ flex: "0 0 calc((100% - 2.25rem) / 4)" }}
                />
              ))}
            </div>
          </div>
        )
      ) : (
        empty
      )}
    </section>
  );
}

function DetailImageGalleryButton({
  item,
  className,
  style,
  onClick,
}: {
  item: DetailImageGalleryItem;
  className?: string;
  style?: React.CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!item.url}
      onClick={onClick}
      className={[
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-left disabled:cursor-default",
        item.url ? "cursor-pointer" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={style}
      aria-label={item.url ? `${item.title} 보기` : undefined}
    >
      {item.badge ? (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm  ">
          {item.badge}
        </span>
      ) : null}

      {item.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
        <img src={item.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="px-3 text-center text-xs text-gray-500 ">미리보기 없음</span>
      )}
    </button>
  );
}
