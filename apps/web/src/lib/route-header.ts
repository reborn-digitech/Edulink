/**
 * The request header the middleware writes on every request it sees — "<METHOD>
 * <pathname>" — so the session's role gate (role-gate.ts, read by getSession)
 * knows which door or page a session is being resolved for. Set by the
 * middleware, overwriting whatever a client sent, on every path it matches
 * (every page and every /api/v1 door). A client can only ever make its own
 * request narrower with it: the gate denies or passes, never widens.
 *
 * Its own file, importing nothing, because the middleware runs on the edge.
 */
export const ROUTE_HEADER = "x-edulink-route";
