"use client";

import { useCallback, useEffect, useState } from "react";
import { call, type DoorFailure } from "./doors";

/**
 * One GET door, read when `path` is set (and again on `retry`): its answer or its failure, never both. A path of null
 * reads nothing (the panel while it is shut). The answer is set from the request's own callback, never in the effect's
 * body, and a request overtaken by a newer one is dropped.
 */
export function useDoor<T>(path: string | null): { data: T | null; failure: DoorFailure | null; retry: () => void; setData: (data: T) => void } {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<{ path: string; data: T | null; failure: DoorFailure | null } | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    void call<T>("GET", path).then((got) => {
      if (live) setAnswer({ path, data: got.ok ? got.data : null, failure: got.ok ? null : got });
    });
    return () => {
      live = false;
    };
  }, [path, round]);
  const retry = useCallback(() => setRound((n) => n + 1), []);
  const setData = useCallback((data: T) => setAnswer((a) => (a ? { ...a, data, failure: null } : a)), []);
  const mine = answer && answer.path === path ? answer : null;
  return { data: mine?.data ?? null, failure: mine?.failure ?? null, retry, setData };
}
