/**
 * Password feedback for the signup meter.
 *
 * Scores on length and variety of character classes, and hard-caps the score
 * when the password contains the person's own name/email or is a known-common
 * choice. Runs on the client for instant feedback; `passwordProblems` in
 * crypto.ts is the authoritative server-side gate — this is UX, that is policy.
 */

const COMMON = new Set([
  "password", "12345678", "123456789", "qwertyui", "letmein1", "iloveyou",
  "football", "baseball", "sunshine", "princess", "welcome1", "abc12345",
  "password1", "monkey12", "trustno1", "dragon12", "school12", "teacher1",
]);

export type Strength = {
  /** 0–4 */
  score: number;
  label: string;
  problems: string[];
};

export function passwordStrength(password: string, context: string[] = []): Strength {
  const problems: string[] = [];

  if (password.length < 10) problems.push("Use at least 10 characters.");
  if (password.length > 200) problems.push("That is too long — 200 characters max.");
  if (/^\s|\s$/.test(password)) problems.push("Remove the space at the start or end.");
  if (COMMON.has(password.toLowerCase())) {
    problems.push("That is one of the most common passwords. Pick something else.");
  }
  if (password.length > 0 && /^(.)\1+$/.test(password)) {
    problems.push("Repeating one character is not enough.");
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
  if (containsContext) problems.push("Do not include your name or email in your password.");

  if (problems.length > 0) {
    return { score: Math.min(1, password.length > 0 ? 1 : 0), label: problems[0]!, problems };
  }

  let score = 1;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes >= 3) score++;

  score = Math.min(4, score);
  const labels = [
    "Too short",
    "Weak — make it longer",
    "Getting there",
    "Good password",
    "Excellent password",
  ];

  return { score, label: labels[score]!, problems: [] };
}
