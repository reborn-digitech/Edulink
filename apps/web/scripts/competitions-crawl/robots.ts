/**
 * robots.txt, read the way the major crawlers read it (RFC 9309): the group whose user-agent names
 * this crawler ("Shalaghar" or "Shalaghar-competitions", namesCrawler) if there is one, else the "*" group; Allow and Disallow with "*" and "$";
 * the longest matching rule wins and a tie goes to Allow; an empty Disallow allows everything. A
 * Crawl-delay above the crawler's own one-second gap is honoured. Pure: tests/competitions-crawl.test.ts.
 *
 * What the file's absence means is the fetcher's (scripts/competitions-crawl/crawl.ts): a 4xx is "no
 * rules" (allowed), a 5xx or no answer is "everything disallowed" for this crawl, and an HTML page
 * served at /robots.txt (a single-page site answering every path) is not a robots file at all.
 */

export const CRAWLER_TOKEN = "shalaghar";

/**
 * Whether a User-agent line names this crawler (TA-320): its value, lower-cased and without a version ("/1.0"),
 * is the short name or the product token the User-Agent header announces (`Shalaghar-competitions/1.0`,
 * scripts/competitions-crawl/http.ts). Never an empty line, never "*", never a part of the name ("shala").
 */
export function namesCrawler(agent: string, token = CRAWLER_TOKEN): boolean {
  const name = agent.split("/")[0]!.trim().toLowerCase();
  const short = token.toLowerCase();
  return name !== "" && name !== "*" && (name === short || name === `${short}-competitions`);
}

type Rule = { allow: boolean; pattern: string };
export type Robots = { allowed: (pathAndQuery: string) => boolean; crawlDelaySeconds: number | null; rules: number };

export const ALLOW_ALL: Robots = { allowed: () => true, crawlDelaySeconds: null, rules: 0 };
export const DISALLOW_ALL: Robots = { allowed: () => false, crawlDelaySeconds: null, rules: 1 };

function patternToRegExp(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/** The rules for this crawler out of a robots.txt body. */
export function parseRobots(text: string, token = CRAWLER_TOKEN): Robots {
  type Group = { agents: string[]; rules: Rule[]; delay: number | null };
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], delay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      // An empty Disallow allows everything: it adds no rule.
      if (!value) continue;
      current.rules.push({ allow: key === "allow", pattern: value });
    } else if (key === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) current.delay = n;
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => namesCrawler(a, token)));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  if (!chosen.length) return ALLOW_ALL;
  const rules = chosen.flatMap((g) => g.rules).map((r) => ({ ...r, re: patternToRegExp(r.pattern), length: r.pattern.replace(/\*/g, "").length }));
  const delays = chosen.map((g) => g.delay).filter((d): d is number => d !== null);
  return {
    rules: rules.length,
    crawlDelaySeconds: delays.length ? Math.max(...delays) : null,
    allowed(pathAndQuery: string) {
      if (pathAndQuery === "/robots.txt") return true;
      let best: { allow: boolean; length: number } | null = null;
      for (const r of rules) {
        if (!r.re.test(pathAndQuery)) continue;
        if (!best || r.length > best.length || (r.length === best.length && r.allow && !best.allow)) best = { allow: r.allow, length: r.length };
      }
      return best ? best.allow : true;
    },
  };
}

/** Whether a body served at /robots.txt is a robots file and not an HTML page a single-page site answers every path with. */
export function looksLikeRobots(contentType: string | null, body: string): boolean {
  if (contentType && /html/i.test(contentType)) return false;
  return !/^\s*<(?:!doctype|html|head)/i.test(body);
}
