import { api } from "./api";
import { KEYS, keyStore } from "./storage";
import { deviceInfo, type AppReportBody } from "./version";

/**
 * Crash reports, without a third-party SDK. An uncaught error is written to
 * the key store before the app dies — message, stack, the screen that was
 * up, the time — and posted on the next start once someone is signed in.
 * The key is removed only when the server has taken it: a refusal or no
 * network keeps it for the start after, and each start tries once. There is
 * nothing here a person did not already see: the app crashed on them.
 */
export type StoredCrash = { message: string; stack?: string; screen?: string; at: string };

export const STACK_LIMIT = 8000;

type Handler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = { getGlobalHandler?: () => Handler | undefined; setGlobalHandler: (handler: Handler) => void };

let currentScreen: string | undefined;
let previous: Handler | undefined;
let installed = false;
let attempted = false;

/** The root layout says which route is up, so a crash can name it. */
export function setCurrentScreen(name: string | null | undefined): void {
  currentScreen = name ?? undefined;
}

export function currentScreenName(): string | undefined {
  return currentScreen;
}

/** What is kept for an error: a message even when it was not an Error, a stack trimmed to the contract's limit. */
export function describeCrash(error: unknown, at = new Date()): StoredCrash {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const stack = error instanceof Error && error.stack ? error.stack.slice(0, STACK_LIMIT) : undefined;
  return { message: message.slice(0, 2000) || "Unknown error", stack, screen: currentScreen, at: at.toISOString() };
}

export async function recordCrash(error: unknown): Promise<void> {
  try {
    await keyStore().set(KEYS.crash, JSON.stringify(describeCrash(error)));
  } catch {
    /* storage refused: the crash is lost, the app is dying anyway */
  }
}

/**
 * Chains onto React Native's global handler: the crash is stored first,
 * then the previous handler (the red box in development, the native crash
 * in a release) runs as it always did. Installed once per start.
 */
export function installCrashReporter(): boolean {
  const utils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (installed || !utils?.setGlobalHandler) return false;
  installed = true;
  previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    void recordCrash(error).then(() => previous?.(error, isFatal));
  });
  return true;
}

/**
 * Posts the last start's crash, if there is one, as a CRASH report; keeps
 * it unless the server answered 2xx. At most one attempt per start, so a
 * session that refreshes its `me` does not post the same crash twice.
 */
export async function sendPendingCrash(): Promise<"none" | "sent" | "kept" | "skipped"> {
  if (attempted) return "skipped";
  attempted = true;
  const raw = await keyStore().get(KEYS.crash);
  if (!raw) return "none";
  let stored: StoredCrash;
  try {
    stored = JSON.parse(raw) as StoredCrash;
    if (typeof stored.message !== "string") throw new Error("shape");
  } catch {
    await keyStore().remove(KEYS.crash);
    return "none";
  }
  const body: AppReportBody = {
    kind: "CRASH",
    message: `${stored.message} (${stored.at})`.slice(0, 2000),
    screen: stored.screen?.slice(0, 200),
    stack: stored.stack?.slice(0, STACK_LIMIT),
    device: deviceInfo(),
  };
  const res = await api().post("/api/v1/app/report", body);
  if (!res.ok) return "kept";
  await keyStore().remove(KEYS.crash);
  return "sent";
}

/** Tests: a fresh start, and the handler the module found put back. */
export function __resetCrashReporter(): void {
  const utils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (installed && previous && utils) utils.setGlobalHandler(previous);
  installed = false;
  attempted = false;
  previous = undefined;
  currentScreen = undefined;
}
