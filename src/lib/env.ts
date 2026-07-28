import "server-only";

/**
 * Environment checks.
 *
 * Exists because of a bug found the honest way: the VAPID keys in `.env` were
 * empty, and the only symptom was a console.warn nobody reads. Every push
 * notification the app "sent" went nowhere, and every test still passed.
 *
 * So: missing push config is a hard failure in production and a loud, specific
 * warning in development. A feature that silently does nothing is worse than
 * one that refuses to start.
 */

export type EnvProblem = { key: string; message: string; fatal: boolean };

/**
 * A production BUILD served from localhost is the documented way to test the
 * service worker, offline mode and push — `next start` sets NODE_ENV=production
 * even on a laptop. Treating that as a real deployment made the app refuse to
 * boot for its own verification workflow, so "deployed" means production build
 * AND a non-localhost origin.
 */
function isDeployed(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!url) return true; // no origin configured at all: assume the worst
  return !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);
}

export function checkEnv(): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const isProd = isDeployed();

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!publicKey || !privateKey) {
    problems.push({
      key: "VAPID",
      message:
        "Web Push is disabled: NEXT_PUBLIC_VAPID_PUBLIC_KEY and/or VAPID_PRIVATE_KEY are empty. Run `npm run vapid` and paste both into .env.",
      fatal: isProd,
    });
  } else {
    // A P-256 public key is 65 bytes base64url-encoded (87 chars); the private
    // key is 32 bytes (43 chars). Wrong lengths mean a truncated copy-paste,
    // which fails later with an opaque crypto error.
    if (publicKey.length !== 87) {
      problems.push({
        key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
        message: `Expected 87 characters, got ${publicKey.length}. It looks truncated — re-run \`npm run vapid\`.`,
        fatal: isProd,
      });
    }
    if (privateKey.length !== 43) {
      problems.push({
        key: "VAPID_PRIVATE_KEY",
        message: `Expected 43 characters, got ${privateKey.length}. It looks truncated — re-run \`npm run vapid\`.`,
        fatal: isProd,
      });
    }
  }

  if (!process.env.DATABASE_URL?.trim()) {
    problems.push({ key: "DATABASE_URL", message: "DATABASE_URL is not set.", fatal: true });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    problems.push({
      key: "NEXT_PUBLIC_APP_URL",
      message:
        "NEXT_PUBLIC_APP_URL is not set. Magic links and invitation emails will point at localhost.",
      fatal: isProd,
    });
  } else if (isProd && appUrl.startsWith("http://") && !appUrl.includes("localhost")) {
    problems.push({
      key: "NEXT_PUBLIC_APP_URL",
      message:
        "NEXT_PUBLIC_APP_URL is http:// in production. Service workers, push and installability all require HTTPS.",
      fatal: true,
    });
  }

  if (isProd && (process.env.EMAIL_TRANSPORT ?? "devbox") === "devbox") {
    // Only fires for a genuinely deployed origin — a local production build
    // keeps the dev mailbox, which is how the email flows get tested at all.
    problems.push({
      key: "EMAIL_TRANSPORT",
      message:
        'EMAIL_TRANSPORT is "devbox" in production: no email will actually be sent, and /dev/mailbox is disabled. Implement a real transport in src/lib/email.ts.',
      fatal: true,
    });
  }

  return problems;
}

/**
 * Call once at startup. Throws on anything fatal so a misconfigured deploy
 * fails at boot rather than at the first parent who does not get told their
 * child was absent.
 */
export function assertEnv(): void {
  const problems = checkEnv();
  if (problems.length === 0) return;

  for (const problem of problems) {
    const line = `[env] ${problem.key}: ${problem.message}`;
    if (problem.fatal) console.error(line);
    else console.warn(line);
  }

  const fatal = problems.filter((p) => p.fatal);
  if (fatal.length > 0) {
    throw new Error(
      `Refusing to start: ${fatal.length} environment problem(s). ${fatal.map((p) => p.key).join(", ")}`,
    );
  }
}
