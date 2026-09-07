import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Me, RoleCode, SessionResponse } from "@edulink/contracts";
import { api } from "./api";
import { KEYS, keyStore } from "./storage";
import { unwrap } from "./query";
import { unregisterPush } from "./push";

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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading", me: null });

  const loadMe = useCallback(async () => {
    const token = await keyStore().get(KEYS.token);
    if (!token) {
      setState({ status: "signed-out", me: null });
      return;
    }
    const result = await api().get<Me>("/api/v1/me");
    if (result.ok) {
      setState({ status: "signed-in", me: result.data });
      return;
    }
    if (result.status === 401) {
      await keyStore().remove(KEYS.token);
      setState({ status: "signed-out", me: null });
      return;
    }
    // Offline or a server hiccup: keep whatever we had; a signed-in person
    // with no network is still signed in.
    setState((prev) => (prev.status === "signed-in" ? prev : { status: "signed-out", me: null }));
  }, []);

  useEffect(() => {
    // The one read of storage on start; it sets state after an await, which
    // is the pattern the rule cannot see through.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMe();
  }, [loadMe]);

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
      },
      async signOut() {
        await unregisterPush();
        await api().post("/api/v1/auth/logout");
        await keyStore().remove(KEYS.token);
        await keyStore().remove(KEYS.session);
        setState({ status: "signed-out", me: null });
      },
    }),
    [state, loadMe],
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
