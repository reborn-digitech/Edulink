import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * Password feedback for the signup meter.
 *
 * Scores on length and variety of character classes, and hard-caps the score
 * when the password contains the person's own name/email or is a known-common
 * choice. Runs on the client for instant feedback; `passwordProblems` in
 * crypto.ts is the authoritative server-side gate — this is UX, that is policy.
 *
 * ⚠ RETURNS KEYS, NOT SENTENCES, and the SAME keys crypto.ts mints for the
 * same problems: the meter and the server gate describe one rule in one voice,
 * in the reader's language. The consuming form owns the words via t().
 */

const COMMON = new Set([
  "password", "12345678", "123456789", "qwertyui", "letmein1", "iloveyou",
  "football", "baseball", "sunshine", "princess", "welcome1", "abc12345",
  "password1", "monkey12", "trustno1", "dragon12", "school12", "teacher1",
]);

export type Strength = {
  /** 0–4 */
  score: number;
  labelKey: TranslationKey;
  problemKeys: TranslationKey[];
};

export function passwordStrength(password: string, context: string[] = []): Strength {
  const problemKeys: TranslationKey[] = [];

  if (password.length < 10) problemKeys.push("refusal.pwAtLeast10");
  if (password.length > 200) problemKeys.push("refusal.pwTooLong");
  if (/^\s|\s$/.test(password)) problemKeys.push("refusal.pwTrimSpace");
  if (COMMON.has(password.toLowerCase())) {
    problemKeys.push("refusal.pwTooCommon");
  }
  if (password.length > 0 && /^(.)\1+$/.test(password)) {
    problemKeys.push("refusal.pwRepeats");
  }

  const lower = password.toLowerCase();
  let containsContext = false;
  for (const term of context) {
    // Also test the local part of an email, since "priya@school.org" makes
    // "priya123" a trivially guessable password.
    for (const piece of [term, term.split("@")[0] ?? ""]) {
      const t = piece.trim().toLowerCase();
      if (t.length >= 4 && lower.includes(t)) containsContext = true;
    }
  }
  if (containsContext) problemKeys.push("refusal.pwContainsName");

  if (problemKeys.length > 0) {
    return {
      score: Math.min(1, password.length > 0 ? 1 : 0),
      labelKey: problemKeys[0]!,
      problemKeys,
    };
  }

  let score = 1;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes >= 3) score++;

  score = Math.min(4, score);
  const labelKeys: TranslationKey[] = [
    "refusal.pwMeterTooShort",
    "refusal.pwMeterWeak",
    "refusal.pwMeterGettingThere",
    "refusal.pwMeterGood",
    "refusal.pwMeterExcellent",
  ];

  return { score, labelKey: labelKeys[score]!, problemKeys: [] };
}
