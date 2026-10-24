/**
 * THE CATALOG AS THE SCENARIOS' CONTRACT (QA campaign, layer 3). `src/lib/api-catalog` is the truth for the docs,
 * the sweep and the phone's access gate; here it is also the truth a scenario's answer is held to: the door the
 * request reached is found by method and path template, and its `response` schema must parse the body.
 */
import { ENDPOINTS, type Endpoint } from "../../src/lib/api-catalog";

const compiled = ENDPOINTS.map((e) => ({
  e,
  params: (e.path.match(/\{[^}]+\}/g) ?? []).length,
  re: new RegExp(`^${e.path.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{[^}]+\}/g, "[^/]+")}$`),
}));

/** The catalog's door for this request, the most specific when two templates match (fewest parameters). */
export function doorFor(method: string, path: string): Endpoint | null {
  const bare = path.split("?")[0]!;
  const hits = compiled.filter((c) => c.e.method === method && c.re.test(bare)).sort((a, b) => a.params - b.params);
  return hits[0]?.e ?? null;
}

/** Whether the catalog lists this method and template exactly (for the scenarios that ask whether a door exists). */
export function listed(method: string, template: string): boolean {
  return ENDPOINTS.some((e) => e.method === method && e.path === template);
}

/** Parses the body with the door's response schema; the issues as one line each, or [] when it parses. */
export function contractIssues(e: Endpoint, body: unknown): string[] {
  const parsed = e.response.safeParse(body);
  if (parsed.success) return [];
  return parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
}
