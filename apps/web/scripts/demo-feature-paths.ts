/**
 * qb-C (31 October 2026, QB-15): THE DEMO ROSTER'S PAGES THAT A PLATFORM SWITCH CLOSES.
 *
 * Seven parts of the platform are dark until the operator switches each on at /root/features
 * (src/lib/platform-features.ts); while one is off, every page under its layout is the app's 404
 * (src/lib/feature-page.ts). docs/demo-schools.md sent the Sunrise accounts to /admin/vacancies and
 * /vacancies with JOB_BOARD off, and the QA pass of 31 October found them 404. The roster now says, after
 * each such path, which switch it is behind (`markFeatureGated`, called by scripts/demo-schools.ts
 * rosterMarkdown), and scripts/demo-school-check.ts reads the roster back and lists every gated path as a
 * fact (`gatedPathsIn`).
 *
 * The table is the layouts' own list: tests/qb-c-campus.test.ts reads every layout and page under
 * src/app/(app) that calls featurePageLock or requireFeatureSwitchPage and holds the table to them, so a
 * new feature page that is not here fails the suite. Pure: no database, no server.
 */
import type { FeatureCode } from "@edulink/contracts";

const SESSIONS: readonly FeatureCode[] = ["EXPERT_SESSIONS", "TEACHER_SESSIONS"];

/** A page and everything under it, and the switches that open it (any one of them, as featurePageLock reads a list). */
export const FEATURE_GATED_PAGES: readonly { prefix: string; features: readonly FeatureCode[] }[] = [
  { prefix: "/admin/sessions", features: SESSIONS },
  { prefix: "/admin/vacancies", features: ["JOB_BOARD"] },
  { prefix: "/assistant", features: ["ASSISTANT"] },
  { prefix: "/expert/availability", features: ["EXPERT_SESSIONS"] },
  { prefix: "/expert/bookings", features: ["EXPERT_SESSIONS"] },
  { prefix: "/expert/earnings", features: ["EXPERT_SESSIONS"] },
  { prefix: "/expert/sessions", features: ["EXPERT_SESSIONS"] },
  { prefix: "/experts", features: ["EXPERT_SESSIONS"] },
  { prefix: "/mentoring", features: ["EXPERT_SESSIONS"] },
  { prefix: "/parent/practice", features: ["QUESTION_BANK"] },
  { prefix: "/sessions", features: SESSIONS },
  { prefix: "/student/practice", features: ["QUESTION_BANK"] },
  { prefix: "/teacher/contributions", features: ["QUESTION_GIG"] },
  { prefix: "/teacher/guidance", features: ["TEACHER_SESSIONS"] },
  { prefix: "/teacher/practice", features: ["QUESTION_BANK"] },
  { prefix: "/teacher/worksheets", features: ["QUESTION_BANK"] },
  { prefix: "/vacancies", features: ["JOB_BOARD"] },
];

/** The switches a path is behind, or null for a path no switch closes. */
export function featuresOfPath(path: string): readonly FeatureCode[] | null {
  const bare = path.split(/[?#]/)[0]!;
  return FEATURE_GATED_PAGES.find((g) => bare === g.prefix || bare.startsWith(`${g.prefix}/`))?.features ?? null;
}

/** The words written after a gated path: "(behind JOB_BOARD)", "(behind EXPERT_SESSIONS or TEACHER_SESSIONS)". */
export const markOf = (features: readonly FeatureCode[]) => `(behind ${features.join(" or ")})`;

/** An app path in running text: starts with "/", not part of a URL ("http://…/") or of a longer path. */
const PATH = /(?<![\w/:.])\/[A-Za-z0-9][\w\-/<>]*(?:\?[\w=&\-<>]*)?/g;

/** Every gated path in a text, as written, with the switches it is behind and whether the mark follows it. */
export function gatedPathsIn(text: string): { path: string; features: readonly FeatureCode[]; marked: boolean }[] {
  const out: { path: string; features: readonly FeatureCode[]; marked: boolean }[] = [];
  for (const m of text.matchAll(PATH)) {
    const features = featuresOfPath(m[0]);
    if (!features) continue;
    out.push({ path: m[0], features, marked: text.startsWith(` ${markOf(features)}`, m.index! + m[0].length) });
  }
  return out;
}

/** Marks that name a path no switch closes, or the wrong switches: a stale mark is as wrong as a missing one. */
export function strayMarksIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(new RegExp(`${PATH.source} \\(behind [A-Z_ ]+(?: or [A-Z_]+)*\\)`, "g"))) {
    const path = m[0].slice(0, m[0].indexOf(" (behind "));
    const features = featuresOfPath(path);
    if (!features || !m[0].endsWith(markOf(features))) out.push(m[0]);
  }
  return out;
}

/** The text with the mark after every gated path that lacks it; a text already marked comes back unchanged. */
export function markFeatureGated(text: string): string {
  return text.replace(PATH, (path, offset: number, whole: string) => {
    const features = featuresOfPath(path);
    if (!features) return path;
    const mark = ` ${markOf(features)}`;
    return whole.startsWith(mark, offset + path.length) ? path : `${path}${mark}`;
  });
}

/** The legend for the roster's top: what the marks mean, and each switch as it stood when the roster was written. */
export function featureLegend(states: Partial<Record<FeatureCode, boolean>>): string {
  const listed = Object.entries(states)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, on]) => `${code} ${on ? "on" : "off"}`)
    .join(", ");
  return [
    "**Pages behind a platform switch.** A path followed by \"(behind X)\" belongs to a part of the platform the operator switches on at /root/features (the vacancy board, expert and teacher sessions, mentoring, the practice pages, the assistant). While X is off, that page is the app's 404 for every account below, and the workflow row that names it describes data that waits for the switch.",
    `When this roster was written: ${listed || "no switch has been read"}. \`npm run demo:school-check\` lists every such path as a fact.`,
  ].join(" ");
}
