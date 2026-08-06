export const BUSINESS_NUMBER_DIGIT_LENGTH = 10;
export const BUSINESS_NUMBER_FORMATTED_LENGTH = 12;

export function normalizeBusinessNumber(value: string): string {
  return value.replace(/\D+/g, "");
}

export function formatBusinessNumberInput(value: string): string {
  const digits = normalizeBusinessNumber(value).slice(0, BUSINESS_NUMBER_DIGIT_LENGTH);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function isCompleteBusinessNumber(value: string): boolean {
  return normalizeBusinessNumber(value).length === BUSINESS_NUMBER_DIGIT_LENGTH;
}
