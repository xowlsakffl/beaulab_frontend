"use client";

import { Card } from "@beaulab/ui-admin";

import { AddCircleButton } from "@/components/common/AddCircleButton";

export type AdminNotesCardItem = {
  id?: number | string | null;
  note?: string | null;
  creator_name?: string | null;
  created_at?: string | null;
};

type AdminNotesCardProps<TNote extends AdminNotesCardItem> = {
  notes: TNote[];
  loading?: boolean;
  onAdd?: (() => void) | null;
  formatDateTime: (value?: string | null) => string;
  className?: string;
};

const stateBoxClassName =
  "flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500";

function noteKey(note: AdminNotesCardItem, index: number) {
  return note.id ?? `${note.created_at ?? "unknown"}-${index}`;
}

export function AdminNotesCard<TNote extends AdminNotesCardItem>({
  notes,
  loading = false,
  onAdd,
  formatDateTime,
  className,
}: AdminNotesCardProps<TNote>) {
  return (
    <Card className={className}>
      <div className={`relative mb-4 min-h-7 border-b border-gray-200 pb-3 ${onAdd ? "pr-9" : ""}`}>
        <h3 className="text-sm font-bold text-gray-900">관리자 메모</h3>
        {onAdd ? <AddCircleButton label="관리자 메모 추가" onClick={onAdd} className="absolute top-0 right-0" /> : null}
      </div>

      {loading ? (
        <div className={stateBoxClassName}>메모를 불러오는 중입니다.</div>
      ) : notes.length > 0 ? (
        <div className="max-h-44 min-h-24 space-y-3 overflow-y-auto pr-1">
          {notes.map((note, index) => (
            <div
              key={noteKey(note, index)}
              className="grid grid-cols-[6.5rem_5rem_minmax(0,1fr)] gap-3 text-xs text-gray-600"
            >
              <span>{formatDateTime(note.created_at)}</span>
              <span>{note.creator_name || "-"}</span>
              <span className="break-words">{note.note || "-"}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={stateBoxClassName}>등록된 관리자 메모가 없습니다.</div>
      )}
    </Card>
  );
}
