/**
 * Converts Persian digits (۰-۹) to English digits (0-9)
 */
function persianToEnglish(text: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  let result = text;
  for (let i = 0; i < persianDigits.length; i++) {
    result = result.replace(new RegExp(persianDigits[i], "g"), englishDigits[i]);
  }
  return result;
}

/**
 * Validates and normalizes phone number format
 * 
 * Rules:
 * - Phone number can be in English or Persian digits (converted to English)
 * - Phone number can start with + or 0
 * - Length should be between 8 and 15 digits (excluding + if present)
 * - Only digits allowed, except + at the beginning
 *
 * @param phone - The phone number string
 * @returns Object with isValid flag and normalized phone number
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  normalizedPhone?: string;
} {
  if (!phone || typeof phone !== "string") {
    return { isValid: false };
  }

  // Convert Persian digits to English
  let cleaned = persianToEnglish(phone.trim());

  // Check if it starts with +
  const hasPlus = cleaned.startsWith("+");
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  // Remove all non-digit characters
  const digitsOnly = cleaned.replace(/\D/g, "");

  // Validate: should only contain digits (after removing +)
  if (digitsOnly.length === 0) {
    return { isValid: false };
  }

  // Check length: 8-15 digits
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return { isValid: false };
  }

  // Return normalized phone number (with + if it was present, or add + if it starts with 0)
  let normalizedPhone: string;
  if (hasPlus) {
    normalizedPhone = `+${digitsOnly}`;
  } else if (digitsOnly.startsWith("0")) {
    // If starts with 0, keep it as is (no +)
    normalizedPhone = digitsOnly;
  } else {
    // If doesn't start with + or 0, add +
    normalizedPhone = `+${digitsOnly}`;
  }

  return {
    isValid: true,
    normalizedPhone,
  };
}
