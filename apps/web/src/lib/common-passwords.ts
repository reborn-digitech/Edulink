/**
 * The common-password rule, in one place for the server's gate (crypto.ts) and the sign-up meter
 * (password-strength.ts), which runs in the browser — so nothing here may import a server module.
 *
 * TA-288 (testing analysis of 13 November 2026): the list both copies held was eighteen words of eight or nine
 * characters, and the length rule refuses anything under ten first, so the rule could never refuse a password —
 * "password123", "1234567890" and "qwertyuiop" all passed. Now two lists:
 *
 *   WHOLE PASSWORDS of ten characters or more, from the usual most-used lists, compared whole.
 *
 *   STEMS — the words people pad to reach a length — compared once the trailing run of digits and symbols is
 *   taken off, so "password123", "Password@2024" and "qwerty123456" are each the stem they were made from.
 */
export const COMMON_PASSWORDS: readonly string[] = [
  "1234567890", "0123456789", "0987654321", "9876543210", "12345678910", "123456789a", "1234567890a",
  "1234512345", "1122334455", "1234554321", "1q2w3e4r5t", "1qaz2wsx3edc", "q1w2e3r4t5", "qwertyuiop",
  "asdfghjkl;", "zxcvbnm123", "abcdefghij", "abcd123456", "abc1234567", "iloveyou123", "password123",
  "passwordpassword", "qwertyqwerty", "letmein123", "welcome123", "iloveindia",
];

export const COMMON_STEMS: readonly string[] = [
  "password", "passw0rd", "pass", "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbnm", "abc", "abcd",
  "abcdef", "abcdefgh", "iloveyou", "welcome", "letmein", "admin", "administrator", "teacher", "student",
  "school", "principal", "football", "cricket", "baseball", "sunshine", "princess", "monkey", "dragon",
  "trustno", "india", "bharat", "test", "shalaghar", "edulink",
];

const WHOLE = new Set(COMMON_PASSWORDS);
const STEMS = new Set(COMMON_STEMS);

/** Whether `password` is one everybody tries first: on the list whole, or a common word padded with digits or symbols. */
export function isCommonPassword(password: string): boolean {
  const lower = password.trim().toLowerCase();
  if (WHOLE.has(lower)) return true;
  // The trailing run of anything but letters, in any script: "Password@2024" is "password", "पासवर्ड123" is "पासवर्ड".
  const stem = lower.replace(/[^\p{L}]+$/u, "");
  return stem.length > 0 && STEMS.has(stem);
}
