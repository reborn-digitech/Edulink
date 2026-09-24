import "server-only";
import type { ReportCardConfig, ReportCardConfigView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { normaliseConfig, parseConfig, presetsFor, type Words } from "./report-card-rules";
import { translator } from "./i18n/dictionary";
import { normaliseLocale } from "./i18n/locales";
import { termsOfYear } from "./terms";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The school's report card rules: read by every card that is generated,
 * written by the office. The document itself lives on `School.reportCardConfig`
 * as JSON; the arithmetic that reads it is in report-card-rules.ts.
 */
const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Office;
}
/** The rules and the weights shape every card from now on: the admin writes them, the head reads them. */
function admin(ctx: ActiveContext): Office {
  const caller = office(ctx);
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  return caller;
}

/** The school's words for the defaults, in its own locale. */
export async function wordsFor(schoolId: string): Promise<Words> {
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { locale: true } });
  const t = translator(normaliseLocale(school?.locale ?? "en"));
  return (key) => t(key as Parameters<typeof t>[0]);
}

export async function readReportCardConfig(schoolId: string): Promise<ReportCardConfig> {
  const [school, words] = await Promise.all([db.school.findUnique({ where: { id: schoolId }, select: { reportCardConfig: true } }), wordsFor(schoolId)]);
  return parseConfig(school?.reportCardConfig, words);
}

/** The document, the presets and the current year's terms with their weights, for the office's editor. */
export async function reportCardConfigView(ctx: ActiveContext): Promise<ReportCardConfigView> {
  const caller = office(ctx);
  const [config, school, year, words] = await Promise.all([
    readReportCardConfig(caller.schoolId),
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } }),
    db.academicYear.findFirst({ where: { schoolId: caller.schoolId, isCurrent: true }, select: { id: true } }),
    wordsFor(caller.schoolId),
  ]);
  const terms = year ? await termsOfYear(caller.schoolId, year.id, school.timezone) : [];
  const weights = year ? await db.term.findMany({ where: { academicYearId: year.id }, select: { id: true, weightPercent: true } }) : [];
  const weightOf = new Map(weights.map((t) => [t.id, t.weightPercent]));
  return {
    ...config,
    presets: presetsFor(words),
    terms: terms.map((t) => ({ id: t.id, name: t.name, weightPercent: weightOf.get(t.id) ?? null })),
  };
}

/** The office writes the whole document; a card already issued keeps the one it was built with. */
export async function saveReportCardConfig(ctx: ActiveContext, input: ReportCardConfig): Promise<ReportCardConfig> {
  const caller = admin(ctx);
  const config = normaliseConfig(input, await wordsFor(caller.schoolId));
  await db.school.update({ where: { id: caller.schoolId }, data: { reportCardConfig: JSON.stringify(config) } });
  await audit({
    schoolId: caller.schoolId,
    actorUserId: caller.user.id,
    action: "reportCard.config",
    targetType: "School",
    targetId: caller.schoolId,
    meta: { preset: config.preset, bands: config.bands.length, areas: config.coScholastic.areas.length, kindWeights: config.kindWeights, paper: config.layout.paper },
  });
  return config;
}

/** A term's share of the annual card. Null clears it; with every term cleared the shares are equal. */
export async function setTermWeight(ctx: ActiveContext, termId: string, weightPercent: number | null): Promise<{ weightPercent: number | null }> {
  const caller = admin(ctx);
  const term = await db.term.findFirst({ where: { id: termId, schoolId: caller.schoolId }, select: { id: true, weightPercent: true } });
  if (!term) throw new AccessError("terms.notFound", "NOT_FOUND");
  if (term.weightPercent === weightPercent) return { weightPercent };
  await db.term.update({ where: { id: term.id }, data: { weightPercent } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "reportCard.termWeight", targetType: "Term", targetId: term.id, meta: { weightPercent } });
  return { weightPercent };
}
