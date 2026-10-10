import type { ReactNode } from "react";
import { PaletteIcon } from "@phosphor-icons/react/ssr";
import type { StudioRow } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TableScroll } from "@/components/ui/table-scroll";
import { TD, TH } from "@/components/module-flash";
import { formatDateKey } from "@/lib/dates";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * ONE STUDIO AS A CARD (R-56, the studio half, 10 Oct 2026), drawn the same on
 * the coordinator's desk and the faculty's page: the brief, the four stages
 * with their days, their state against today and what each waits for, the
 * students with the state of each submission and their signed results, and
 * the juries with their panels. The forms a page adds (a jury to convene, a
 * sheet to mark) come in as children.
 */
export const STAGE_KEY = { BRIEF_ISSUED: "duties.studio.stageBRIEF_ISSUED", INTERIM_PINUP: "duties.studio.stageINTERIM_PINUP", FINAL_SUBMISSION: "duties.studio.stageFINAL_SUBMISSION", JURY: "duties.studio.stageJURY" } as const satisfies Record<string, TranslationKey>;
export const STAGE_STATE_KEY = { UNSET: "duties.studio.stateUNSET", AHEAD: "duties.studio.stateAHEAD", TODAY: "duties.studio.stateTODAY", DONE: "duties.studio.stateDONE" } as const satisfies Record<string, TranslationKey>;
export const SUBMISSION_STATE_KEY = { DRAFT: "duties.studio.subDRAFT", SUBMITTED: "duties.studio.subSUBMITTED", LATE: "duties.studio.subLATE" } as const satisfies Record<string, TranslationKey>;
export const BAND_KEY = { O: "duties.studio.bandO", A_PLUS: "duties.studio.bandA_PLUS", A: "duties.studio.bandA", B_PLUS: "duties.studio.bandB_PLUS", B: "duties.studio.bandB", C: "duties.studio.bandC", P: "duties.studio.bandP", F: "duties.studio.bandF" } as const satisfies Record<string, TranslationKey>;
export const EXTERNAL_ROLE_KEY = {
  PRACTISING_ARCHITECT: "duties.studio.extPRACTISING_ARCHITECT",
  ACADEMIC: "duties.studio.extACADEMIC",
  URBAN_DESIGNER: "duties.studio.extURBAN_DESIGNER",
  STRUCTURAL_ENGINEER: "duties.studio.extSTRUCTURAL_ENGINEER",
  LANDSCAPE_ARCHITECT: "duties.studio.extLANDSCAPE_ARCHITECT",
  CONSERVATION_ARCHITECT: "duties.studio.extCONSERVATION_ARCHITECT",
  INTERIOR_DESIGNER: "duties.studio.extINTERIOR_DESIGNER",
} as const satisfies Record<string, TranslationKey>;

const STATE_TONE = { UNSET: "neutral", AHEAD: "info", TODAY: "warn", DONE: "ok" } as const;
const SUB_TONE = { DRAFT: "neutral", SUBMITTED: "ok", LATE: "warn" } as const;

export function submissionState(s: StudioRow["students"][number], stage: "INTERIM_PINUP" | "FINAL_SUBMISSION", t: Translate): { label: string; tone: "neutral" | "ok" | "warn" } {
  const x = s.submissions.find((sub) => sub.stage === stage);
  if (!x) return { label: t("duties.studio.subNONE"), tone: "neutral" };
  return { label: t(SUBMISSION_STATE_KEY[x.state]), tone: SUB_TONE[x.state] };
}

export function resultText(r: { marks: number | null; band: keyof typeof BAND_KEY | null }, max: number, t: Translate): string {
  if (r.marks === null || !r.band) return t("duties.studio.absent");
  return t("duties.studio.resultLine", { marks: r.marks, max, band: t(BAND_KEY[r.band]) });
}

export function panelText(j: StudioRow["juries"][number], t: Translate): string {
  return j.panel.map((p) => (p.chair ? `${p.name} ${t("duties.studio.chairSuffix")}` : p.name)).join(", ");
}

export function externalText(j: StudioRow["juries"][number], t: Translate): string {
  return j.externalJurors.map((x) => `${t(EXTERNAL_ROLE_KEY[x.role])}, ${x.institution}`).join("; ");
}

export function StudioCard({ s, t, locale, showStudents = true, children }: { s: StudioRow; t: Translate; locale: string; showStudents?: boolean; children?: ReactNode }) {
  const day = (k: string | null) => (k ? formatDateKey(k, { dateStyle: "medium" }, locale) : t("duties.studio.stateUNSET"));
  return (
    <Card data-studio={s.id}>
      <CardHeader icon={<PaletteIcon weight="duotone" className="size-5" />} title={s.title} description={t("duties.studio.studioLine", { course: `${s.courseCode} ${s.courseName}`, term: s.termName, coordinator: s.coordinatorName })} />
      <CardBody className="space-y-4">
        {s.brief ? <p className="whitespace-pre-line text-sm text-fg">{s.brief}</p> : null}
        <p className="text-sm text-fg-muted">{t("duties.studio.maxMarksLine", { max: s.maxMarks })}</p>
        <ol className="grid gap-2 sm:grid-cols-4">
          {s.stages.map((st) => (
            <li key={st.stage} className="rounded-[var(--radius-md)] border border-border p-3" data-stage={st.stage}>
              <p className="text-sm font-semibold text-fg">{t(STAGE_KEY[st.stage])}</p>
              <p className="text-sm text-fg-muted">{day(st.on)}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge tone={STATE_TONE[st.state]}>{t(STAGE_STATE_KEY[st.state])}</Badge>
                {st.waiting > 0 ? <Badge tone="warn">{t("duties.studio.waitingN", { count: st.waiting })}</Badge> : null}
              </div>
            </li>
          ))}
        </ol>
        {showStudents ? (
          <section>
            <h3 className="text-sm font-semibold text-fg">{t("duties.studio.studentsTitle")}</h3>
            {s.students.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("duties.studio.noStudents")}</p>
            ) : (
              <TableScroll label={t("duties.studio.studentsTitle")}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={TH}>{t("duties.studio.colStudent")}</th>
                      <th scope="col" className={TH}>{t("duties.studio.stageINTERIM_PINUP")}</th>
                      <th scope="col" className={TH}>{t("duties.studio.stageFINAL_SUBMISSION")}</th>
                      <th scope="col" className={TH}>{t("duties.studio.colResult")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.students.map((st) => {
                      const pin = submissionState(st, "INTERIM_PINUP", t);
                      const fin = submissionState(st, "FINAL_SUBMISSION", t);
                      return (
                        <tr key={st.studentMembershipId}>
                          <td className={TD}>{st.name}</td>
                          <td className={TD}><Badge tone={pin.tone}>{pin.label}</Badge></td>
                          <td className={TD}><Badge tone={fin.tone}>{fin.label}</Badge></td>
                          <td className={TD}>{st.results.length ? st.results.map((r) => `${day(r.on)}: ${resultText(r, s.maxMarks, t)}`).join("; ") : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableScroll>
            )}
          </section>
        ) : null}
        <section>
          <h3 className="text-sm font-semibold text-fg">{t("duties.studio.juriesTitle")}</h3>
          {s.juries.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.studio.noJuries")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.juries.map((j) => (
                <li key={j.id} className="space-y-1 py-2" data-jury={j.id}>
                  <p className="text-fg">
                    <span className="font-medium">{day(j.on)}</span>
                    {j.title ? ` · ${j.title}` : ""} <Badge tone={j.past ? "neutral" : "info"}>{t(j.past ? "duties.studio.past" : "duties.studio.ahead")}</Badge>
                  </p>
                  <p className="text-fg-muted">{t("duties.studio.panelLine", { names: panelText(j, t) })}</p>
                  {j.externalJurors.length ? <p className="text-fg-muted">{t("duties.studio.externalLine", { list: externalText(j, t) })}</p> : null}
                  <p className="text-fg-muted">{j.signedAt ? t("duties.studio.signedLine", { name: j.signedByName ?? "" }) : t("duties.studio.unsignedLine", { marked: j.marked, students: j.students })}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        {children}
      </CardBody>
    </Card>
  );
}
