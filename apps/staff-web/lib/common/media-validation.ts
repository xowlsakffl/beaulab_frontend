export type ImageFileTypeValidationMode = "extension-and-mime" | "extension-or-mime";

export type ImageFileValidationRule = {
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[] | ReadonlySet<string>;
  typeValidationMode?: ImageFileTypeValidationMode;
  maxBytes?: number;
};

export async function validateImageFileRule(file: File, rule: ImageFileValidationRule) {
  if (!isAllowedImageFileType(file, rule)) return false;
  if (rule.maxBytes !== undefined && file.size > rule.maxBytes) return false;

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

function toMimeTypeSet(mimeTypes: readonly string[] | ReadonlySet<string>) {
  if (Array.isArray(mimeTypes)) {
    return new Set(mimeTypes.map((mimeType) => mimeType.toLowerCase()));
  }

  return new Set(Array.from(mimeTypes, (mimeType) => mimeType.toLowerCase()));
}
