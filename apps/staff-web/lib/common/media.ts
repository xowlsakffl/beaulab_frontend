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
