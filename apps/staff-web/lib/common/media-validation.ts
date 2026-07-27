export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImageFileTypeValidationMode = "extension-and-mime" | "extension-or-mime";

export type ImageFileValidationRule = {
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[] | ReadonlySet<string>;
  typeValidationMode?: ImageFileTypeValidationMode;
  maxBytes?: number;
  exactWidth?: number;
  exactHeight?: number;
  minWidth?: number;
  minHeight?: number;
  square?: boolean;
  aspectRatio?: {
    width: number;
    height: number;
    tolerance?: number;
  };
};

export async function validateImageFileRule(file: File, rule: ImageFileValidationRule) {
  if (!isAllowedImageFileType(file, rule)) return false;
  if (rule.maxBytes !== undefined && file.size > rule.maxBytes) return false;

  if (!needsImageDimensions(rule)) return true;

  const dimensions = await readImageDimensions(file);
  if (!dimensions) return false;
  if (rule.exactWidth !== undefined && dimensions.width !== rule.exactWidth) return false;
  if (rule.exactHeight !== undefined && dimensions.height !== rule.exactHeight) return false;
  if (rule.minWidth !== undefined && dimensions.width < rule.minWidth) return false;
  if (rule.minHeight !== undefined && dimensions.height < rule.minHeight) return false;
  if (rule.square && dimensions.width !== dimensions.height) return false;
  if (rule.aspectRatio && !matchesImageAspectRatio(dimensions, rule.aspectRatio)) return false;

  return true;
}

export async function validateImageFileRuleMessage(file: File, rule: ImageFileValidationRule, message: string) {
  return (await validateImageFileRule(file, rule)) ? null : message;
}

export async function validateImageFilesRuleMessage(
  files: readonly File[],
  rule: ImageFileValidationRule,
  message: string,
) {
  for (const file of files) {
    const validationMessage = await validateImageFileRuleMessage(file, rule, message);
    if (validationMessage) return validationMessage;
  }

  return null;
}

export function isAllowedImageFileType(file: File, rule: ImageFileValidationRule) {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = rule.allowedExtensions.some((extension) => lowerName.endsWith(extension));
  const hasAllowedMimeType = !file.type || toMimeTypeSet(rule.allowedMimeTypes).has(file.type.toLowerCase());

  if (rule.typeValidationMode === "extension-or-mime") {
    return hasAllowedExtension || hasAllowedMimeType;
  }

  return hasAllowedExtension && hasAllowedMimeType;
}

export function readImageDimensions(file: File): Promise<ImageDimensions | null> {
  if (typeof window === "undefined" || typeof Image === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      const result = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      cleanup();
      resolve(result);
    };

    image.onerror = () => {
      cleanup();
      resolve(null);
    };

    image.src = objectUrl;
  });
}

function needsImageDimensions(rule: ImageFileValidationRule) {
  return Boolean(
    rule.exactWidth !== undefined ||
    rule.exactHeight !== undefined ||
    rule.minWidth !== undefined ||
    rule.minHeight !== undefined ||
    rule.square ||
    rule.aspectRatio !== undefined,
  );
}

function matchesImageAspectRatio(
  dimensions: ImageDimensions,
  rule: NonNullable<ImageFileValidationRule["aspectRatio"]>,
) {
  if (dimensions.width <= 0 || dimensions.height <= 0 || rule.width <= 0 || rule.height <= 0) return false;

  const expectedRatio = rule.width / rule.height;
  const actualRatio = dimensions.width / dimensions.height;
  const defaultTolerance = 1 / (Math.max((dimensions.width + dimensions.height) / 2, dimensions.height) + 1);

  return Math.abs(actualRatio - expectedRatio) <= (rule.tolerance ?? defaultTolerance);
}

function toMimeTypeSet(mimeTypes: readonly string[] | ReadonlySet<string>) {
  if (Array.isArray(mimeTypes)) {
    return new Set(mimeTypes.map((mimeType) => mimeType.toLowerCase()));
  }

  return new Set(Array.from(mimeTypes, (mimeType) => mimeType.toLowerCase()));
}
