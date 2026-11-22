import "server-only";
import { PLAN_FEATURES, PREMIUM_PLANS, isCollegeKind, type OperatorSchoolModules, type SchoolTerms } from "@edulink/contracts";
import { activePlans } from "@/lib/person-plans";
import { featureOn } from "@/lib/platform-features";
import { FEATURE_META } from "@/lib/feature-meta";
import { operatorSchoolModules } from "@/lib/operator-college";
import type { ActiveContext } from "@/lib/session";
import { premiumInfoLines, type Fmt } from "@/lib/terms-sentences";

type SwitchView = Pick<SchoolTerms, "schoolId" | "kind" | "premiumStudents" | "premiumTeachers">;

/**
 * C2'S LINES BESIDE A SCHOOL'S PREMIUM SWITCHES (decision 0010; C2, C5 point 6; C7 point 7d), worded by the server: the plans
 * not asked for, in one compact line (a college's teachers have no premium, so the Teacher plan is never its line); the
 * plans' features switched off for everyone, while the school has premium on; and whether Vidura is not switched on at a
 * school with premium on. The web card shows the first two above its switches and the third with its switch beside it; the
 * terms door answers all three to the phone (termsDoorLines). `modules` is the school's modules as the caller has read
 * them (the web page reads them once for its modules panel); left out, they are read here, and only while premium is on.
 */
export async function premiumSwitchLines(session: ActiveContext, view: SwitchView, f: Fmt, modules?: OperatorSchoolModules | null): Promise<{ info: string[]; viduraOff: boolean }> {
  const premiumOn = view.premiumStudents || view.premiumTeachers;
  const bundle = [...new Set(PREMIUM_PLANS.flatMap((plan) => PLAN_FEATURES[plan]))];
  const [asked, offForAll, read] = await Promise.all([
    activePlans(),
    Promise.all(bundle.map(async (code) => ((await featureOn(code)) ? null : code))).then((codes) => codes.filter((code): code is NonNullable<typeof code> => code !== null)),
    modules !== undefined ? modules : premiumOn ? operatorSchoolModules(session, view.schoolId) : null,
  ]);
  const info = premiumInfoLines(f, { notAsked: PREMIUM_PLANS.filter((plan) => !asked.has(plan)), offForAll: offForAll.map((code) => f.t(FEATURE_META[code].nameKey)), college: isCollegeKind(view.kind), premiumOn });
  const viduraOff = premiumOn && Boolean(read?.modules.some((m) => m.module === "ASSISTANT" && !m.on));
  return { info, viduraOff };
}

/** The lines the terms door answers on GET and on PUT (C7 point 7d): C2's, then Vidura's sentence where it applies. */
export async function termsDoorLines(session: ActiveContext, view: SwitchView, f: Fmt): Promise<string[]> {
  const { info, viduraOff } = await premiumSwitchLines(session, view, f);
  return viduraOff ? [...info, f.t("subs.viduraOff")] : info;
}
