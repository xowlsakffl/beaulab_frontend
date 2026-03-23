import type { ReadonlyURLSearchParams } from "next/navigation";

type BuildReturnToPathOptions = {
  searchParams: Pick<ReadonlyURLSearchParams, "get">;
  fallbackPath: string;
  allowedPrefix?: string;
  highlightId?: number;
};

export function buildReturnToPath({
  searchParams,
  fallbackPath,
  allowedPrefix = fallbackPath,
  highlightId,
}: BuildReturnToPathOptions) {
  const rawReturnTo = searchParams.get("returnTo");
  const safeBasePath = rawReturnTo?.startsWith(allowedPrefix) ? rawReturnTo : fallbackPath;
  const [basePath, rawQuery = ""] = safeBasePath.split("?");
  const nextSearchParams = new URLSearchParams(rawQuery);

  if (highlightId !== undefined) {
    nextSearchParams.set("highlight", String(highlightId));
  }

  const nextQuery = nextSearchParams.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}
