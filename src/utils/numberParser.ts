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
 * Removes all comma separators (both English "," and Persian "،")
 */
function removeCommas(text: string): string {
  return text.replace(/,/g, "").replace(/،/g, "");
}

/**
 * Parses a number input from user, handling:
 * - Persian digits (۰-۹) → English digits (0-9)
 * - Comma separators (both "," and "،")
 * - Whitespace trimming
 *
 * @param input - The user input string
 * @returns The parsed number, or NaN if invalid
 *
 * @example
 * parseNumberInput("1,000") // 1000
 * parseNumberInput("۱،۰۰۰") // 1000
 * parseNumberInput(" 5000 ") // 5000
 * parseNumberInput("invalid") // NaN
 */
export function parseNumberInput(input: string): number {
  if (!input || typeof input !== "string") {
    return NaN;
  }

  // Trim whitespace
  let cleaned = input.trim();

  // Convert Persian digits to English
  cleaned = persianToEnglish(cleaned);

  // Remove comma separators (both English and Persian)
  cleaned = removeCommas(cleaned);

  // Parse as float to handle decimal numbers if needed
  const number = parseFloat(cleaned);

  return number;
}

/**
 * Validates if the parsed number is a valid positive number
 *
 * @param input - The user input string
 * @returns Object with isValid flag and the parsed number (or NaN)
 */
export function validateNumberInput(input: string): {
  isValid: boolean;
  number: number;
} {
  const number = parseNumberInput(input);
  const isValid = !isNaN(number) && number > 0 && isFinite(number);

  return {
    isValid,
    number: isValid ? number : NaN,
  };
}

