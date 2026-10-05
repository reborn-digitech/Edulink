/**
 * R-29 (5 Oct 2026, risks batch): a cold `next dev` compiles a route while a
 * request's interactive transaction is already open, and Prisma's defaults
 * (wait 2 s for a connection, 5 s for the whole transaction) cut it off: the
 * page sweep's `/root` and its neighbours went red on a cold server and
 * answered 200 alone (STREAMS-6, W-16). In development only, the client's
 * interactive transactions get room for a compile; production and the test
 * suite keep Prisma's defaults, so a slow transaction there still fails
 * where it would fail for a person. A caller's own `opts` (the bank's trigram
 * pass) still win over these.
 */
export const DEV_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 30_000 } as const;

export function transactionOptionsFor(nodeEnv: string | undefined): { maxWait: number; timeout: number } | undefined {
  return nodeEnv === "development" ? { ...DEV_TRANSACTION_OPTIONS } : undefined;
}
