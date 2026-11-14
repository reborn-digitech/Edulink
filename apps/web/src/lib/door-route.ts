import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { routeStamp, UPLOAD_DOOR_PATH } from "./route-header";

/**
 * THE UPLOAD DOOR'S OWN ROUTE STAMP (TA-137 and TA-244, decided 14 November 2026).
 *
 * The session's gate (role-gate.ts, read by getSession) learns which door a session is being resolved for from the
 * stamp the middleware writes on the request, and trusts that header only because the middleware overwrites whatever
 * a client sent. POST /api/v1/uploads is outside the middleware's matcher, so that the framework's 10 MB copy of the
 * body no longer cuts a phone's video short; on that one path nothing overwrites the header, and a client could write
 * the stamp of a door its role may open.
 *
 * So the door says which door it is, here, and getSession asks this BEFORE it looks at the header: inside
 * `asUploadDoor` the gate is given "POST /api/v1/uploads" whatever the request carries. One door and one fixed stamp:
 * there is no way to pass another, so no other handler can use this to be judged as a door it is not. It travels
 * downward with the call (AsyncLocalStorage), never on the request, and is pinned on `globalThis` for the reason
 * tenant-context.ts gives: a bundler may hold two copies of this module, and the door's copy and the session's must
 * share one store.
 */
const globalForDoor = globalThis as unknown as { __edulinkDoorRoute?: AsyncLocalStorage<string> };
const door = (globalForDoor.__edulinkDoorRoute ??= new AsyncLocalStorage<string>());

const UPLOAD_DOOR_STAMP = routeStamp("POST", UPLOAD_DOOR_PATH);

/** Runs the upload door's handler so that every session it resolves is gated as POST /api/v1/uploads. */
export function asUploadDoor<T>(run: () => Promise<T>): Promise<T> {
  return door.run(UPLOAD_DOOR_STAMP, run);
}

/** The stamp of the door this call is inside, or null anywhere else: then the middleware's header is the stamp. */
export function doorRoute(): string | null {
  return door.getStore() ?? null;
}
