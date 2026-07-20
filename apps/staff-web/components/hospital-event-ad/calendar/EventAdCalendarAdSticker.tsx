"use client";

import Link from "next/link";
import { forwardRef } from "react";

export type EventAdCalendarStickerAd = {
  id: number;
  hospital_name: string;
  event_name: string;
  category_name?: string | null;
  allow_status_label: string;
  ad_status_label: string;
  manager_name: string;
};

type EventAdCalendarAdStickerProps = {
  ads: EventAdCalendarStickerAd[];
  countLabel: string;
  date: string;
  label: string;
  left: number;
  top: number;
  onClose: () => void;
};

export const EventAdCalendarAdSticker = forwardRef<HTMLElement, EventAdCalendarAdStickerProps>(
  function EventAdCalendarAdSticker({ ads, countLabel, date, label, left, top, onClose }, ref) {
    return (
      <aside
        ref={ref}
        className="absolute z-30 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
        style={{ left, top }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-bold text-gray-900">
              {label}
              <span className="whitespace-nowrap">{countLabel}</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
            aria-label="광고 목록 닫기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div className="mt-3 max-h-[17rem] space-y-2 overflow-y-auto pr-1">
          {ads.length > 0 ? (
            ads.map((ad) => (
              <Link
                key={ad.id}
                href={`/ads-manage/event-ads/${ad.id}`}
                className="relative block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="absolute top-2 right-3 shrink-0 text-[11px] font-semibold text-gray-500">
                  {ad.allow_status_label}
                </span>
                <p className="line-clamp-1 pr-14 text-xs font-semibold text-gray-800">{ad.hospital_name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{ad.event_name}</p>
                {ad.category_name ? (
                  <span className="mt-1 inline-flex w-fit rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] leading-4 font-bold text-brand-500">
                    {ad.category_name}
                  </span>
                ) : null}
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                  <span>{ad.ad_status_label}</span>
                  <span>{ad.manager_name}</span>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-lg bg-gray-50 px-3 py-6 text-center text-xs font-semibold text-gray-500">
              등록된 광고가 없습니다.
            </p>
          )}
        </div>
      </aside>
    );
  },
);
