/**
 * A dotted path into a JSON answer: `totals.outstandingPaise`, `items[0].id`, `rows.length`. Undefined where the
 * path leads nowhere, so a Then can tell "absent" from "null".
 */
export function pick(value: unknown, path: string): unknown {
  if (path === "" || path === ".") return value;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let here: unknown = value;
  for (const part of parts) {
    if (here === null || here === undefined) return undefined;
    if (Array.isArray(here) && part === "length") {
      here = here.length;
      continue;
    }
    if (typeof here !== "object") return undefined;
    here = (here as Record<string, unknown>)[part];
  }
  return here;
}
