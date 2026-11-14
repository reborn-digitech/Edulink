import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { QueryClientContext } from "@tanstack/react-query";
import type { Me, RoleCode, SessionResponse } from "@edulink/contracts";
import { api, onSessionEndedOnServer } from "./api";
import { KEYS, keyStore } from "./storage";
import { clearQueue, setOutboxOwner } from "./outbox";
import { clearPickedFiles, clearSharedFiles } from "./download";
import { Image } from "expo-image";
import { unwrap } from "./query";
import { clearDeliveredNotices, forgetPushOnDevice, unregisterPush } from "./push";
import { runSessionEnd } from "./session-end";
import { claimFreshInstall } from "./install-platform";
import { useAdoptAccountLocale } from "./i18n";

/**
 * Who is signed in, from the phone's point of view.
 *
 * The token lives in secure storage and never in React state; what state
 * holds is `me` — the person, their contexts and what is active — fetched
 * from /api/v1/me on start and after every context switch. `status` is
 * "loading" until storage has been read once, so the router does not flash
 * the sign-in screen at someone who is signed in.
 */
export type SessionState =
  | { status: "loading"; me: null }
  | { status: "signed-out"; me: null }
  | { status: "signed-in"; me: Me };

type Session = SessionState & {
  /** Store a freshly issued session and load `me`. */
  accept(session: SessionResponse): Promise<void>;
  refresh(): Promise<void>;
  switchContext(next: { schoolId: string | null; role: RoleCode }): Promise<void>;
  signOut(): Promise<void>;
};

const Ctx = createContext<Session | null>(null);

/** What the keychain may still hold from an install that was deleted: everything of the person, not the preferences. */
const PERSON_KEYS = [KEYS.token, KEYS.session, KEYS.crash, KEYS.ssoVerifier, KEYS.lock] as const;

let installChecked: Promise<void> | null = null;
/**
 * Once per launch, before the token is read: on the first launch since an
 * install, whatever the keychain kept from a deleted install is forgotten
 * (PH-5), so a reinstall starts signed out rather than as the last person.
 */
function forgetPreviousInstall(): Promise<void> {
  if (!installChecked) {
    installChecked = claimFreshInstall().then(async (fresh) => {
      if (!fresh) return;
      for (const key of PERSON_KEYS) await keyStore().remove(key).catch(() => undefined);
    });
  }
  return installChecked;
}
/** Tests launch the app afresh. */
export function __resetInstallCheck(): void {
  installChecked = null;
}

/**
 * Everything of the person on this phone, gone, whichever way the session
 * ended (PH-2, campaign 2026-10-04): the files they shared, the bulletin's
 * photographs in expo-image's cache, a crash report not yet sent (it would
 * be posted as the next person's), the device's push registration, and the
 * token. The preferences stay. What keeps running for them (the driver's
 * trip tracking, PH-3) is stopped before this, by runSessionEnd, while the
 * outbox still stamps its last rows as theirs. The outbox is not here: Sign out drops the
 * person's rows, and a 401 holds them for the same person (lib/outbox.ts).
 * Each step on its own, so one that throws cannot leave the token behind.
 */
async function forgetPerson(): Promise<void> {
  const steps: (() => Promise<unknown>)[] = [
    clearSharedFiles,
    // The bulletin's photographs sit in expo-image's disk cache (decision
    // 0002, gap 2, the part that stayed open): gone with the person too.
    // The web target has no disk cache to clear.
    () => Image.clearDiskCache(),
    () => Image.clearMemoryCache(),
    forgetPushOnDevice,
    // What the pickers and the camera copied, and the notices in the tray and the icon's count (TA-348).
    clearPickedFiles,
    clearDeliveredNotices,
  ];
  for (const step of steps) {
    try {
      await step();
    } catch {
      // Best effort; the keys below go regardless.
    }
  }
  for (const key of PERSON_KEYS) await keyStore().remove(key).catch(() => undefined);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading", me: null });
  // The query cache, when there is a provider (a test may render the session alone).
  const queryClient = useContext(QueryClientContext);
  // How many reads of /me are under way, and whether Sign out is: a 401 met meanwhile starts no second read (TA-145).
  const reading = useRef(0);
  const signingOut = useRef(false);

  const loadMe = useCallback(async () => {
    reading.current++;
    try {
      await forgetPreviousInstall();
      const token = await keyStore().get(KEYS.token);
      if (!token) {
        setOutboxOwner(null);
        setState({ status: "signed-out", me: null });
        return;
      }
      const result = await api().get<Me>("/api/v1/me");
      if (result.ok) {
        // The outbox learns who is here before anything can flush it.
        setOutboxOwner({ userId: result.data.user.id, schoolId: result.data.active.schoolId, membershipId: result.data.active.membershipId });
        setState({ status: "signed-in", me: result.data });
        return;
      }
      if (result.status === 401) {
        // The session ended on the server. The phone is left as clean as Sign
        // out leaves it, but the person's queued rows are held, not sent to
        // anyone else (PH-1): they go when the same person signs in again.
        await runSessionEnd();
        setOutboxOwner(null);
        await forgetPerson();
        setState({ status: "signed-out", me: null });
        return;
      }
      // Offline or a server hiccup: keep whatever we had; a signed-in person
      // with no network is still signed in.
      setState((prev) => (prev.status === "signed-in" ? prev : { status: "signed-out", me: null }));
    } finally {
      reading.current--;
    }
  }, []);

  useEffect(() => {
    // The one read of storage on start; it sets state after an await (the
    // rule no longer flags it since the read became a try/finally, TA-145).
    void loadMe();
  }, [loadMe]);

  // A session that ends on the server is noticed wherever a 401 meets it (TA-145, 13 Nov 2026): any request that
  // carried the bearer, the outbox's replay and the events stream report it here, and /api/v1/me confirms it, so the
  // phone is left as a 401 on /me always left it (the token and the person's things gone, their queued rows held).
  // Before, only /me and an open stream noticed, and every other screen showed its refusal with a Retry for good.
  // And the app's return to the front reads /me again, so a session revoked while it slept is noticed at once.
  const signedIn = state.status === "signed-in";
  useEffect(() => {
    if (!signedIn) return;
    onSessionEndedOnServer(() => {
      if (reading.current > 0 || signingOut.current) return;
      void loadMe();
    });
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && reading.current === 0 && !signingOut.current) void loadMe();
    });
    return () => {
      onSessionEndedOnServer(null);
      sub.remove();
    };
  }, [signedIn, loadMe]);

  // A phone with no language chosen on it takes the account's (A3-states-16, risks batch 5 Oct 2026), so a new
  // phone agrees with the one the choice was made on; a choice made here is kept (lib/i18n.tsx).
  const adoptAccountLocale = useAdoptAccountLocale();
  const accountLocale = state.status === "signed-in" ? state.me.user.locale : null;
  useEffect(() => {
    if (accountLocale) void adoptAccountLocale(accountLocale);
  }, [accountLocale, adoptAccountLocale]);

  const value = useMemo<Session>(
    () => ({
      ...state,
      async accept(session) {
        await keyStore().set(KEYS.token, session.token);
        await keyStore().set(KEYS.session, JSON.stringify({ sessionId: session.sessionId, expiresAt: session.expiresAt }));
        await loadMe();
      },
      refresh: loadMe,
      async switchContext(next) {
        unwrap(await api().post<Me>("/api/v1/me/context", next));
        await loadMe();
        // What the screens read belongs to the context just left (TA-148, TA-164, 13 Nov 2026): the keys name neither
        // the school nor the role, so Classes and Today listed the last school's rows. The cache is reset: every
        // query loses its data, and those on screen are read again under the new context.
        void queryClient?.resetQueries();
      },
      async signOut() {
        signingOut.current = true;
        try {
          // While the token is still good: the server forgets this device's
          // push token, then the session.
          await unregisterPush();
          await api().post("/api/v1/auth/logout");
        } catch {
          // Offline: the phone still forgets the person below.
        }
        // Tracking stops before the queue goes, so the last positions it
        // sends on stopping are dropped with the rest.
        await runSessionEnd();
        try {
          // What this person queued and did not send goes with them.
          await clearQueue();
        } catch {
          // The outbox's database refused: signing out still goes on.
        }
        setOutboxOwner(null);
        await forgetPerson();
        setState({ status: "signed-out", me: null });
        signingOut.current = false;
      },
    }),
    [state, loadMe, queryClient],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}

/** The active role, or null while loading or signed out. */
export function useRole(): RoleCode | null {
  const s = useSession();
  return s.status === "signed-in" ? s.me.active.role : null;
}

/**
 * The session when there is a provider, else null: for a hook a screen may
 * use under a test's bare providers (the events stream, which hands an
 * ended session to `refresh` — /api/v1/me answers 401, the token goes, the
 * gate sends the person to sign in).
 */
export function useSessionIfAny(): Session | null {
  return useContext(Ctx);
}
