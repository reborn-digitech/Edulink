import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { listActivities, myFacultyProfile, myVoice, researchRegister, surveyResults } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash, SurveyForms, keyed } from "./parts";
import { ActivityRegister, ResearchRegister } from "./registers";

/**
 * A teacher's side of the IQAC module (4 Oct 2026), for /faculty/research and
 * /hod/research: their own record as the office keeps it, the research
 * register (a faculty member's own items; an HOD's whole department), the
 * department's activities for an HOD, the course feedback on the offerings
 * they teach (totals only, from five answers up), and the teachers' survey
 * when one is open.
 */
export async function TeacherResearch({ role, back, ok, error }: { role: "FACULTY" | "HOD"; back: string; ok?: string; error?: string }) {
  const ctx = await requireRole(role);
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t(role === "HOD" ? "iqac.navDeptResearch" : "iqac.navResearch")} />
        <ModuleOff module="IQAC" t={t} college />
      </div>
    );
  }
  const [profile, research, voice, activities] = await Promise.all([myFacultyProfile(ctx), researchRegister(ctx), myVoice(ctx), role === "HOD" ? listActivities(ctx) : Promise.resolve(null)]);
  const offerings = await db.courseOffering.findMany({ where: { schoolId: ctx.schoolId, facultyMembershipId: ctx.membershipId }, select: { id: true } });
  const feedback = offerings.length ? await db.survey.findMany({ where: { schoolId: ctx.schoolId, kind: "COURSE_FEEDBACK", offeringId: { in: offerings.map((o) => o.id) } }, orderBy: { closesOn: "desc" }, take: 10, select: { id: true } }) : [];
  const results = await Promise.all(feedback.map((f) => surveyResults(ctx, f.id)));
  return (
    <div className="space-y-5">
      <PageHeader title={t(role === "HOD" ? "iqac.navDeptResearch" : "iqac.navResearch")} description={t("iqac.researchIntro")} />
      <IqacFlash ok={ok} error={error} />
      <Card>
        <CardHeader title={t("iqac.myProfileTitle")} />
        <CardBody className="text-sm">
          {profile ? (
            <p>
              {profile.designation ? tt("iqac.designation." + profile.designation) : profile.role}
              {profile.highestQualification ? ` · ${tt("iqac.qualification." + profile.highestQualification)}` : ""} · {t("iqac.apiScore", { score: profile.apiScore })} · {t("iqac.countsLine", { fdps: profile.fdps, publications: profile.publications })}
            </p>
          ) : (
            <p className="text-fg-muted">{t("iqac.myProfileEmpty")}</p>
          )}
        </CardBody>
      </Card>
      <ResearchRegister t={t} back={back} items={research.items} perTeacher={research.perTeacher} scope={research.scope} teachers={null} canRemoveAll={false} />
      {activities ? <ActivityRegister t={t} back={back} items={activities.items} canEdit={activities.canEdit} staff={[]} locale={locale} /> : null}
      {results.map((r) => (
        <Card key={r.survey.id}>
          <CardHeader title={r.survey.title} description={[t("iqac.surveyKind.COURSE_FEEDBACK"), " · ", t("iqac.responsesLine", { n: r.survey.responses }), (r.overall !== null ? ` · ${t("iqac.overallLine", { mean: r.overall.toFixed(2) })}` : "")].join("")} />
          <CardBody className="text-sm">
            {r.suppressed ? (
              <p className="text-fg-muted">{t("iqac.suppressed")}</p>
            ) : (
              <ul className="space-y-1">
                {r.questions.map((q) => (
                  <li key={q.code} className="flex justify-between gap-2">
                    <span>{q.label}</span>
                    <span className="font-semibold">{q.mean?.toFixed(2) ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ))}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("iqac.surveysForYou")}</h2>
        <SurveyForms t={t} surveys={voice.surveys} back={back} locale={locale} />
      </section>
    </div>
  );
}
