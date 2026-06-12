const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type MediaVariantPreference = "original" | "medium" | "thumb";

type MediaVariant = {
  url?: string | null;
  path?: string | null;
};

type MediaLike = {
  url?: string | null;
  path?: string | null;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  metadata?: unknown;
};

export function resolveMediaAssetUrl(
  media?: MediaLike | null,
  preferredVariant: MediaVariantPreference = "original",
): string | null {
  const variantUrl = preferredVariant === "original" ? null : resolveVariantUrl(media, preferredVariant);
  if (variantUrl) return variantUrl;

  if (preferredVariant === "thumb") {
    const mediumUrl = resolveVariantUrl(media, "medium");
    if (mediumUrl) return mediumUrl;
  }

  const rawUrl = media?.url?.trim();
  if (rawUrl) return rawUrl;

  return resolveStoragePath(media?.path);
}

export async function preloadImageUrls(urls: Array<string | null | undefined>, timeoutMs = 250): Promise<void> {
  if (typeof window === "undefined") return;

  const uniqueUrls = Array.from(new Set(urls.filter((url): url is string => Boolean(url))));
  if (uniqueUrls.length === 0) return;

  await Promise.race([
    Promise.allSettled(uniqueUrls.map(preloadImageUrl)),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function preloadImageUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });
}

function resolveVariantUrl(media?: MediaLike | null, variantName?: "thumb" | "medium"): string | null {
  if (!media || !variantName) return null;

  const directUrl = variantName === "thumb" ? media.thumbnail_url?.trim() : media.medium_url?.trim();
  if (directUrl) return directUrl;

  const variants = metadataVariants(media.metadata);
  const variant = variants?.[variantName];
  const variantUrl = variant?.url?.trim();
  if (variantUrl) return variantUrl;

  return resolveStoragePath(variant?.path);
}

function metadataVariants(metadata: unknown): Record<string, MediaVariant> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const variants = (metadata as { variants?: unknown }).variants;
  if (!variants || typeof variants !== "object" || Array.isArray(variants)) {
    return null;
  }

  return variants as Record<string, MediaVariant>;
}

function resolveStoragePath(path?: string | null): string | null {
  const rawPath = path?.trim();
  if (!rawPath) return null;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (!API_BASE_URL) return rawPath;
  if (rawPath.startsWith("/storage/")) return `${API_BASE_URL}${rawPath}`;
  if (rawPath.startsWith("storage/")) return `${API_BASE_URL}/${rawPath}`;
  if (rawPath.startsWith("/")) return `${API_BASE_URL}${rawPath}`;

  return `${API_BASE_URL}/storage/${rawPath}`;
}
