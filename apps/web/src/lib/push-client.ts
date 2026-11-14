/**
 * The browser's half of "a browser's notices belong to the sign-in that turned
 * them on" (TA-041, decided 14 November 2026). Runs in a page, never on the
 * server; the push toggle, the sign-out form and the root layout's runtime
 * share it so the three cannot drift apart.
 *
 * WHAT THE BROWSER REMEMBERS. One value in localStorage: the id of the person
 * who turned notices on in this browser. The server removes a registration
 * with its sign-in (a sign-out from another device at once, a sign-in that ran
 * out a week later with its row), and the browser's own subscription outlives
 * both; without the note, the page could not tell "my notices, whose sign-in
 * ended" from "somebody else's, left behind", and would have to either leave
 * the first silent until the person found the switch or hand the second to
 * whoever signed in next. It is written when a person turns notices on or the
 * server links their registration, and removed when they turn notices off or
 * sign out. It names nobody: an opaque id, of use only on this origin.
 */

const OWNER_KEY = "edulink:push-owner";
const JSON_HEADERS = { "content-type": "application/json" };
/** How long Sign out waits for the browser and the server before it goes ahead regardless. */
const SIGN_OUT_WAIT_MS = 3_000;

function store(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // A browser that refuses storage (a locked-down profile) throws on the read itself.
    return null;
  }
}

/** Who turned notices on in this browser, or null when nobody is remembered. */
export function pushOwner(): string | null {
  try {
    return store()?.getItem(OWNER_KEY) ?? null;
  } catch {
    return null;
  }
}

export function rememberPushOwner(userId: string): void {
  try {
    store()?.setItem(OWNER_KEY, userId);
  } catch {
    // Storage full or refused: the registration still works; only the automatic start after a remote sign-out is lost.
  }
}

export function forgetPushOwner(): void {
  try {
    store()?.removeItem(OWNER_KEY);
  } catch {
    // Nothing was kept, then.
  }
}

/** The subscription this browser holds, or null: no worker (a dev build), no push support, or notices never turned on. */
async function browserSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager?.getSubscription()) ?? null;
}

/** Hands the browser's subscription to the server for the person signed in: the "turn on" write, under this sign-in. */
export async function registerPush(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON() as { keys?: { p256dh?: string; auth?: string } };
  if (!json.keys?.p256dh || !json.keys.auth) return false;
  const response = await fetch("/api/push", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ endpoint: subscription.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }),
  });
  return response.ok;
}

async function relink(owner: string): Promise<boolean> {
  const subscription = await browserSubscription();
  if (!subscription) return false;
  const response = await fetch("/api/push", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ endpoint: subscription.endpoint }) });
  if (!response.ok) return false;
  const answer = (await response.json().catch(() => null)) as { linked?: boolean } | null;
  if (answer?.linked) {
    rememberPushOwner(owner);
    return true;
  }
  // The server holds nothing of this person's for this browser. Registered again by itself only when this same
  // person turned notices on here and never turned them off or signed out; anybody else uses the switch.
  if (pushOwner() !== owner) return false;
  return registerPush(subscription);
}

const linking = new Map<string, Promise<boolean>>();

/**
 * A signed-in page's step on every load: make this browser's notices this
 * sign-in's, if they are this person's. Answers whether they now are. Never
 * throws, and one call at a time per person, so the runtime and the settings
 * switch on the same page ask once.
 */
export function relinkPush(owner: string): Promise<boolean> {
  const running = linking.get(owner);
  if (running) return running;
  const work = relink(owner)
    .catch(() => false)
    .finally(() => linking.delete(owner));
  linking.set(owner, work);
  return work;
}

/**
 * Sign out's first step: this browser's notices are switched off and the
 * server is told, before the sign-out is posted (the server needs the cookie
 * to know whose registration it is removing). Never throws and never waits
 * longer than `waitMs`: a browser that will not answer must not keep a person
 * signed in on a shared computer. The server removes the sign-in's
 * registration with the sign-out as well, so a step that did not finish, or a
 * page whose script never ran, still leaves nothing that is sent to.
 */
export async function switchOffPush(waitMs: number = SIGN_OUT_WAIT_MS): Promise<void> {
  forgetPushOwner();
  const work = (async () => {
    const subscription = await browserSubscription();
    if (!subscription) return;
    await Promise.all([
      fetch("/api/push", { method: "DELETE", headers: JSON_HEADERS, body: JSON.stringify({ endpoint: subscription.endpoint }), keepalive: true }).catch(() => null),
      subscription.unsubscribe().catch(() => false),
    ]);
  })().catch(() => {});
  await Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, waitMs))]);
}
