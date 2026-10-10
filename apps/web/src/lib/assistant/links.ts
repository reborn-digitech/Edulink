/**
 * LINKS IN A DATA ANSWER, BUILT BY CODE (the owner's decision 2 of 10 October 2026, built 11 October). The
 * answer's text stays link-free and the answer gate as strict as it was: a row the summary numbered (a post, a
 * circular, one of the person's own threads, the page to write to a member of staff) and the answer cited by
 * its number becomes a citation of kind LINK, which the web panel and the phone render as they render a help
 * citation, a link on the platform. Its title is the role word and the day, never a name ("Circular from the
 * office, 22 Sept 2026"); its page is the person's own (`pageIsRoles`: a page another role opens is never
 * linked); a compose link only where the messaging library's own rule lets the pair write (`mayConverse`,
 * the rule the people page lists by, src/lib/conversations.ts), never widened. Pure.
 */
import type { AssistantCitation, AssistantLanguage } from "@edulink/contracts";
import { translator, type TranslationKey } from "../i18n/dictionary";
import { isStaffRole, mayConverse } from "../conversations";
import { ROLES, type Role } from "../constants";
import { pageIsRoles } from "./pages";
import type { RowLink } from "./summary";

const WHO = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "ALUMNUS", "STAFF", "SCHOOL", "OTHER_SCHOOL"] as const;
type Who = (typeof WHO)[number];

/** The role word a row's other party gets: the office, the head, a teacher… a college's six staff roles and the module roles are "a member of staff". */
export function whoWord(who: string | null): Who | "SOMEONE" {
  if (who && (WHO as readonly string[]).includes(who)) return who as Who;
  if (who && (ROLES as readonly string[]).includes(who) && isStaffRole(who as Role)) return "STAFF";
  return "SOMEONE";
}

const LOCALES: Record<AssistantLanguage, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

function dayIn(iso: string | null, language: AssistantLanguage): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(LOCALES[language], { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** The compose page and the staff it lists: a person writes to staff from /remarks/people?role=staff. */
export const COMPOSE_PATH = "/remarks/people?role=staff";

/** Whether this role may be offered the page to write to a member of staff: the messaging rule for the pair, and the page in the role's own menu. Pure. */
export function mayOfferCompose(role: Role): boolean {
  return mayConverse(role, "TEACHER") && pageIsRoles(COMPOSE_PATH, role);
}

/**
 * The cited rows as LINK citations, in the answer's language: only rows whose page the role opens, each once.
 * `cited` is the set of numbers the answer cites. Pure.
 */
export function linkCitations(links: readonly RowLink[], cited: ReadonlySet<number>, role: Role, language: AssistantLanguage): AssistantCitation[] {
  const t = translator(language);
  const out: AssistantCitation[] = [];
  for (const l of links) {
    if (!cited.has(l.n)) continue;
    if (!l.pagePath.startsWith("/") || l.pagePath.startsWith("//") || !pageIsRoles(l.pagePath, role)) continue;
    if (l.kind === "COMPOSE" && !mayOfferCompose(role)) continue;
    const who = t(`assistantData.who.${whoWord(l.who)}` as TranslationKey);
    const date = dayIn(l.at, language);
    const title = t(`assistantData.link.${l.kind}${date || l.kind === "COMPOSE" ? "" : "Undated"}` as TranslationKey, { who, date });
    out.push({ kind: "LINK", n: l.n, title, pagePath: l.pagePath, rowId: l.id });
  }
  return out;
}
