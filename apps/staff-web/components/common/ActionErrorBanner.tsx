export function ActionErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
      {message}
    </div>
  );
}
