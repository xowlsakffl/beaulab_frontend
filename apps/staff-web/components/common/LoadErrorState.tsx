"use client";

type LoadErrorStateProps = {
  title: string;
  message?: string | null;
};

export function LoadErrorState({ title, message }: LoadErrorStateProps) {
  return (
    <div className="flex min-h-[calc(100dvh-180px)] items-center justify-center">
      <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
        <div className="space-y-2">
          <p className="text-base font-bold text-gray-900">{title}</p>
          {message ? <p className="text-sm text-gray-500">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
