export function formatOperationHistoryValue(value: unknown, display?: string | null): string {
  if (Array.isArray(value) && value.length === 0) return "-";
  if (typeof display === "string" && display.trim() !== "") return display;
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (typeof value === "string" || typeof value === "number") return String(value);

  try {
    return JSON.stringify(value, null, 2) ?? "-";
  } catch {
    return String(value);
  }
}
