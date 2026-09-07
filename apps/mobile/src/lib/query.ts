import { QueryClient } from "@tanstack/react-query";

/**
 * Server state lives in React Query. Five minutes fresh: a register or a
 * feed re-fetches on focus, not on every render; a 401 is never retried
 * (the session provider signs the person out instead); everything else gets
 * one retry, because a phone's network flickers.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        retry: (count, error) => !(error instanceof ApiRefused && error.status === 401) && count < 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}

/** Thrown by query functions so screens can show the envelope's sentence. */
export class ApiRefused extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRefused";
  }
}

/** Unwraps an ApiResult into data or an ApiRefused, for use inside queryFn/mutationFn. */
export function unwrap<T>(result: { ok: true; data: T } | { ok: false; status: number; error: string; code?: string }): T {
  if (result.ok) return result.data;
  throw new ApiRefused(result.status, result.error, result.code);
}
