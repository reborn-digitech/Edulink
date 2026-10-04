import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { sessionView } from "@/lib/exam-cell";
import { marksSheet } from "@/lib/exam-cell-marks";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CellOff, GRACE_STATUS_KEY, Hidden, Labelled, SessionFrame, day, inputClass, marks } from "@/components/exam-cell/parts";
import { correctMarkAction, enterMarksAction, importMarksAction, moderationNoteAction, proposeGraceAction } from "../../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.tabMarks"), robots: { index: false, follow: false } };
}

/**
 * External marks, a course at a time: each person enters the whole sheet
 * once, and a mark stands when two people agree. Or the university's result
 * file, pasted. After publication, a correction is a new version with a
 * reason. Grace is proposed here and decided by the principal.
 */
export default async function MarksPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ course?: string; ok?: string; error?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { sessionId } = await params;
  const { course, ok, error } = await searchParams;
  const s = await sessionView(ctx, sessionId);
  const courseId = course && s.marks.some((m) => m.courseId === course) ? course : s.marks[0]?.courseId;
  const sheet = courseId ? await marksSheet(ctx, s.id, courseId) : null;
  const back = `/exam-cell/sessions/${s.id}/marks${courseId ? `?course=${courseId}` : ""}`;
  const w = s.canWrite;
  return (
    <SessionFrame t={t} session={s} current="marks" autonomous={s.autonomous} ok={ok} error={error}>
      <Card>
        <CardHeader title={t("examCell.marksStatus")} />
        <CardBody className="flex flex-wrap gap-2">
          {s.marks.length === 0 ? <p className="text-sm text-fg-muted">{t("examCell.noMarksYet")}</p> : null}
          {s.marks.map((m) => (
            <Link key={m.courseId} href={`/exam-cell/sessions/${s.id}/marks?course=${m.courseId}`} className={`rounded-[--radius-md] border px-3 py-2 text-sm ${m.courseId === courseId ? "border-accent text-accent-strong" : "border-border text-fg"}`}>
              <span className="font-semibold">{m.code}</span> · {t("examCell.marksCounts", { matched: m.matched, expected: m.expected, mismatched: m.mismatched })}
            </Link>
          ))}
        </CardBody>
      </Card>

      {sheet ? (
        <Card>
          <CardHeader title={[sheet.code, sheet.name].join(" ")} description={t("examCell.sheetHint", { external: marks(sheet.externalMaxMilli), internal: marks(sheet.internalMaxMilli) })} />
          <CardBody className="overflow-x-auto p-0">
            <form action={enterMarksAction}>
              <Hidden fields={{ sessionId: s.id, courseId: sheet.courseId, back }} />
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-left text-xs text-fg-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">{t("examCell.student")}</th>
                    <th className="px-3 py-2 font-medium">{t("examCell.colInternal")}</th>
                    <th className="px-3 py-2 font-medium">{t("examCell.entryOne")}</th>
                    <th className="px-3 py-2 font-medium">{t("examCell.entryTwo")}</th>
                    <th className="px-3 py-2 font-medium">{t("examCell.colExternal")}</th>
                    {sheet.canEnter ? <th className="px-3 py-2 font-medium">{t("examCell.yourEntry")}</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sheet.rows.map((r) => (
                    <tr key={r.studentMembershipId}>
                      <td className="px-4 py-2">
                        {r.name} <span className="text-fg-muted">{r.ticket ?? r.code ?? ""}</span>
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {marks(r.internalMilli)}
                        {r.internalMilli !== null && !r.internalLocked ? ` (${t("examCell.imported")})` : ""}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{r.entry1 ? `${r.entry1.absent ? t("examCell.absentShort") : marks(r.entry1.milli)} · ${r.entry1.by}` : "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{r.entry2 ? `${r.entry2.absent ? t("examCell.absentShort") : marks(r.entry2.milli)} · ${r.entry2.by}` : "—"}</td>
                      <td className="px-3 py-2">
                        {r.matched ? (
                          <span className="tabular-nums font-semibold">
                            {r.absent ? t("examCell.absentShort") : marks(r.externalMilli)}
                            {r.graceMilli > 0 ? ` +${marks(r.graceMilli)}` : ""} <span className="font-normal text-fg-muted">v{r.version}</span>
                          </span>
                        ) : r.entry1 && r.entry2 ? (
                          <Badge tone="danger">{t("examCell.mismatch")}</Badge>
                        ) : (
                          <Badge tone="neutral">{t("examCell.waitingEntry")}</Badge>
                        )}
                      </td>
                      {sheet.canEnter ? (
                        <td className="px-3 py-2">
                          <input type="hidden" name="studentMembershipId" value={r.studentMembershipId} />
                          <input name={`marks_${r.studentMembershipId}`} aria-label={t("examCell.yourEntryFor", { name: r.name })} placeholder={t("examCell.entryPlaceholder")} className={`${inputClass} w-24`} />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.canEnter ? (
                <div className="p-4">
                  <Button type="submit">{t("examCell.saveEntry")}</Button>
                </div>
              ) : null}
            </form>
          </CardBody>
        </Card>
      ) : null}

      {w ? (
        <Card>
          <CardHeader title={t("examCell.importTitle")} description={t("examCell.importHint")} />
          <CardBody>
            <form action={importMarksAction} className="space-y-3">
              <Hidden fields={{ sessionId: s.id, back }} />
              <textarea name="text" required rows={6} placeholder="PRN,SEAT_NO,COURSE_CODE,INTERNAL,EXTERNAL" aria-label={t("examCell.importTitle")} className="w-full rounded-[--radius-md] border border-border bg-surface p-3 font-mono text-xs" />
              <Button type="submit" variant="secondary">
                {t("examCell.import")}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {w && sheet && s.published ? (
        <Card>
          <CardHeader title={t("examCell.correctTitle")} description={t("examCell.correctHint")} />
          <CardBody>
            <form action={correctMarkAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, courseId: sheet.courseId, back }} />
              <Labelled label={t("examCell.student")}>
                <select name="studentMembershipId" className={inputClass}>
                  {sheet.rows.map((r) => (
                    <option key={r.studentMembershipId} value={r.studentMembershipId}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.colExternal")}>
                <input name="marks" required placeholder={t("examCell.entryPlaceholder")} className={`${inputClass} w-28`} />
              </Labelled>
              <Labelled label={t("examCell.reason")}>
                <input name="reason" required minLength={5} maxLength={300} className={inputClass} />
              </Labelled>
              <Button type="submit" size="sm">
                {t("examCell.correct")}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={t("examCell.graceTitle")} description={t("examCell.graceHint")} />
        <CardBody className="space-y-3">
          {s.graces.map((g) => (
            <p key={g.id} className="text-sm">
              {t("examCell.graceLine", { student: g.studentName, marks: g.marks, course: g.courseCode })} · <Badge tone={g.status === "APPROVED" ? "ok" : g.status === "REFUSED" ? "danger" : "warn"}>{t(GRACE_STATUS_KEY[g.status]!)}</Badge> {g.decidedAt ? day(g.decidedAt, locale) : ""}
            </p>
          ))}
          {w && sheet ? (
            <form action={proposeGraceAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, courseId: sheet.courseId, back }} />
              <Labelled label={t("examCell.student")}>
                <select name="studentMembershipId" className={inputClass}>
                  {sheet.rows.map((r) => (
                    <option key={r.studentMembershipId} value={r.studentMembershipId}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.graceMarks")}>
                <input name="marks" type="number" step="0.5" min={0.5} max={20} required className={`${inputClass} w-24`} />
              </Labelled>
              <Labelled label={t("examCell.graceRule")}>
                <select name="rule" className={inputClass}>
                  <option value="TO_PASS">{t("examCell.ruleTO_PASS")}</option>
                  <option value="TO_CLASS">{t("examCell.ruleTO_CLASS")}</option>
                </select>
              </Labelled>
              <Labelled label={t("examCell.reason")}>
                <input name="reason" required minLength={5} maxLength={300} className={inputClass} />
              </Labelled>
              <Button type="submit" size="sm" variant="secondary">
                {t("examCell.propose")}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("examCell.moderationTitle")} />
        <CardBody className="space-y-3">
          {s.notes.map((n) => (
            <p key={n.id} className="text-sm">
              <span className="font-medium">{n.courseCode ?? t("examCell.wholeSession")}</span> · {n.note} <span className="text-fg-muted">— {n.by}, {day(n.at, locale)}</span>
            </p>
          ))}
          {w ? (
            <form action={moderationNoteAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, courseId: sheet?.courseId, back }} />
              <Labelled label={t("examCell.committeeNote")} className="min-w-64 flex-1">
                <input name="note" required minLength={5} maxLength={2000} className={inputClass} />
              </Labelled>
              <Button type="submit" size="sm" variant="secondary">
                {t("examCell.record")}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </SessionFrame>
  );
}
