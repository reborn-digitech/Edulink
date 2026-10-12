"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOutIcon, CheckIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { COMPETITION_DISMISS_REASONS, COMPETITION_SUBJECTS, type CompetitionDismissReason, type CompetitionDraftEdit, type CompetitionSuggestion } from "@edulink/contracts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatDate, formatInZone } from "@/lib/dates";
import { setCompetitionStatusAction } from "@/app/appadmin/actions";
import { dismissAction, editDraftAction, reviewedAction } from "@/app/appadmin/crawl-actions";
import { DIFF_FIELDS, type DiffField } from "@/lib/competition-crawl-rules";

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const COLLEGE = "13";

/** "Class 6–10", "Class 9", "College", "Class 11 – College". */
export function useClassesText() {
  const t = useT();
  return (low: string | null, high: string | null): string | null => {
    const name = (g: string) => (g === COLLEGE ? t("practice.collegeLevel") : g);
    if (!low && !high) return null;
    if (low === COLLEGE && (!high || high === COLLEGE)) return t("practice.collegeLevel");
    if (!high || high === low) return t("competitionCrawl.classOne", { n: name(low ?? high!) });
    return t("competitionCrawl.classRange", { from: name(low ?? "1"), to: name(high) });
  };
}

/**
 * ONE COMPETITION SUGGESTED FROM THE WEB on the desk's tab (competitions-crawler, 12 Oct 2026): what the
 * crawler read, the page it came from, when it was crawled and last checked, the model's confidence; and
 * the desk's acts. A draft: Publish (the existing status door: verified when the source is an official
 * organiser), Edit in place, Dismiss with a coded reason. A published one whose page changed: the diff,
 * "Reviewed", and "Back to draft" to edit it. A dismissed one: its reason, and Publish after all.
 */
export function SuggestionCard({ item, subjectLabels }: { item: CompetitionSuggestion; subjectLabels: Record<string, string> }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const classesText = useClassesText();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit" | "dismiss">("view");
  const [reason, setReason] = useState<CompetitionDismissReason | "">("");
  const [form, setForm] = useState<CompetitionDraftEdit>(() => ({
    title: item.title,
    summary: item.summary,
    organizerName: item.organizerName,
    subject: item.subject ?? "",
    gradeLow: item.gradeLow ?? "",
    gradeHigh: item.gradeHigh ?? "",
    eligibility: item.eligibility ?? "",
    prizes: item.prizes ?? "",
    externalUrl: item.externalUrl ?? "",
    registrationOpensAt: day(item.registrationOpensAt),
    registrationClosesAt: day(item.registrationClosesAt),
    startsAt: day(item.startsAt),
    endsAt: day(item.endsAt),
  }));
  const set = (k: keyof CompetitionDraftEdit) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = (work: () => Promise<{ ok: true } | { ok: false; error?: string }>, done: string) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) return void toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
      toast({ tone: "ok", title: done });
      setMode("view");
      router.refresh();
    });

  const isDraft = item.status === "DRAFT";
  const dismissed = Boolean(item.dismissedAt);
  const classes = classesText(item.gradeLow, item.gradeHigh);
  const subject = item.subject ? (subjectLabels[item.subject] ?? item.subject) : null;
  const dates: [string, string | null][] = [
    [t("competitionCrawl.registrationOpens"), item.registrationOpensAt],
    [t("competitions.entriesClose"), item.registrationClosesAt],
    [t("competitions.starts"), item.startsAt],
    [t("competitions.ends"), item.endsAt],
  ];
  const gradeOptions = [...Array.from({ length: 12 }, (_, i) => String(i + 1)), COLLEGE];

  return (
    <Card className="p-4" aria-busy={pending || undefined}>
      <CardBody className="space-y-3 p-0">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold text-fg">{item.title}</p>
            <p className="text-sm text-fg-muted">{item.summary}</p>
            <p className="text-xs text-fg-muted">{[item.organizerName, subject, classes, item.level ? t(`competitionCrawl.level${item.level}`) : null].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge size="sm" tone={item.status === "PUBLISHED" ? "ok" : item.status === "ARCHIVED" ? "neutral" : "warn"}>
              {item.status === "PUBLISHED" ? t("appadmin.statusLive") : item.status === "ARCHIVED" ? t("appadmin.statusWithdrawn") : t("appadmin.statusDraft")}
            </Badge>
            {item.changedSinceReview && <Badge size="sm" tone="danger">{t("competitionCrawl.changedBadge")}</Badge>}
            {dismissed && <Badge size="sm" tone="neutral">{t("competitionCrawl.dismissedBadge")}</Badge>}
            {item.matchedExisting && <Badge size="sm" tone="info">{t("competitionCrawl.handPostedBadge")}</Badge>}
            <Badge size="sm" tone={item.confidence >= 0.8 ? "accent" : "outline"}>{t("competitionCrawl.confidence", { n: Math.round(item.confidence * 100) })}</Badge>
          </div>
        </div>

        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          {dates.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="text-fg">{value ? formatDate(new Date(value)) : t("competitionCrawl.notSaid")}</dd>
            </div>
          ))}
        </dl>
        {(item.fee || item.eligibility || item.prizes) && (
          <dl className="space-y-1 text-sm">
            {item.fee && (
              <div>
                <dt className="inline text-fg-muted">{t("competitionCrawl.fee")}: </dt>
                <dd className="inline text-fg">{item.fee}</dd>
              </div>
            )}
            {item.eligibility && (
              <div>
                <dt className="inline text-fg-muted">{t("competitions.whoCanEnter")}: </dt>
                <dd className="inline text-fg">{item.eligibility}</dd>
              </div>
            )}
            {item.prizes && (
              <div>
                <dt className="inline text-fg-muted">{t("competitions.prizes")}: </dt>
                <dd className="inline text-fg">{item.prizes}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a href={item.pageUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent-strong underline-offset-2 hover:underline">
            {t("competitionCrawl.sourcePage")}
            <ArrowSquareOutIcon aria-hidden="true" className="size-4" />
          </a>
          {item.externalUrl && item.externalUrl !== item.pageUrl && (
            <a href={item.externalUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent-strong underline-offset-2 hover:underline">
              {t("competitions.organiserPage")}
              <ArrowSquareOutIcon aria-hidden="true" className="size-4" />
            </a>
          )}
        </div>
        <p className="text-xs text-fg-muted">
          {t("competitionCrawl.readFrom", { source: item.source.name, when: formatInZone(new Date(item.crawledAt), "Asia/Kolkata"), checked: formatInZone(new Date(item.lastCheckedAt), "Asia/Kolkata") })}
          {item.source.official ? ` ${t("competitionCrawl.officialNote")}` : ` ${t("competitionCrawl.notOfficialNote")}`}
        </p>
        {dismissed && item.dismissedReason && <p className="text-sm text-fg-muted">{t("competitionCrawl.dismissedFor", { reason: t(`competitionCrawl.reason${item.dismissedReason}`) })}</p>}

        {item.changedSinceReview && item.diff && (
          <div className="space-y-1 rounded-[var(--radius-md)] border border-border p-3 text-sm">
            <p className="font-medium text-fg">{t("competitionCrawl.diffTitle")}</p>
            <ul className="space-y-0.5">
              {Object.entries(item.diff).map(([field, d]) => (
                <li key={field} className="text-fg-muted">
                  {t("competitionCrawl.diffLine", { field: (DIFF_FIELDS as readonly string[]).includes(field) ? t(`competitionCrawl.field.${field as DiffField}`) : field, before: d.before ?? t("competitionCrawl.notSaid"), after: d.after ?? t("competitionCrawl.notSaid") })}
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === "edit" && (
          <form
            className="space-y-3 border-t border-border pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => editDraftAction(item.competitionId, form), t("competitionCrawl.saved"));
            }}
          >
            <TextField label={t("competitionCrawl.field.title")} value={form.title} onChange={set("title")} maxLength={140} required />
            <TextField label={t("competitionCrawl.field.summary")} value={form.summary} onChange={set("summary")} maxLength={200} required />
            <TextField label={t("competitionCrawl.field.organizerName")} value={form.organizerName ?? ""} onChange={set("organizerName")} maxLength={120} />
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField label={t("competitionCrawl.field.subject")} value={form.subject ?? ""} onChange={set("subject")}>
                <option value="">{t("competitionCrawl.noSubject")}</option>
                {COMPETITION_SUBJECTS.filter((s) => s !== "OTHER").map((s) => (
                  <option key={s} value={s}>
                    {subjectLabels[s] ?? s}
                  </option>
                ))}
                {form.subject && !(COMPETITION_SUBJECTS as readonly string[]).includes(form.subject) && <option value={form.subject}>{form.subject}</option>}
              </SelectField>
              <SelectField label={t("competitionCrawl.field.gradeLow")} value={form.gradeLow ?? ""} onChange={set("gradeLow")}>
                <option value="">{t("competitionCrawl.notSaid")}</option>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    {g === COLLEGE ? t("practice.collegeLevel") : t("practice.classN", { n: g })}
                  </option>
                ))}
              </SelectField>
              <SelectField label={t("competitionCrawl.field.gradeHigh")} value={form.gradeHigh ?? ""} onChange={set("gradeHigh")}>
                <option value="">{t("competitionCrawl.notSaid")}</option>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    {g === COLLEGE ? t("practice.collegeLevel") : t("practice.classN", { n: g })}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DateField label={t("competitionCrawl.registrationOpens")} value={form.registrationOpensAt ?? ""} onChange={set("registrationOpensAt")} />
              <DateField label={t("competitions.entriesClose")} value={form.registrationClosesAt ?? ""} onChange={set("registrationClosesAt")} />
              <DateField label={t("competitions.starts")} value={form.startsAt ?? ""} onChange={set("startsAt")} />
              <DateField label={t("competitions.ends")} value={form.endsAt ?? ""} onChange={set("endsAt")} />
            </div>
            <TextAreaField label={t("competitions.whoCanEnter")} value={form.eligibility ?? ""} onChange={set("eligibility")} maxLength={5000} rows={2} />
            <TextAreaField label={t("competitions.prizes")} value={form.prizes ?? ""} onChange={set("prizes")} maxLength={5000} rows={2} />
            <TextField label={t("competitions.organiserPage")} value={form.externalUrl ?? ""} onChange={set("externalUrl")} maxLength={500} inputMode="url" hint={t("competitionCrawl.httpsHint")} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={pending} icon={<CheckIcon weight="bold" aria-hidden="true" />}>
                {t("competitionCrawl.save")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMode("view")} disabled={pending}>
                {t("competitionCrawl.cancel")}
              </Button>
            </div>
          </form>
        )}

        {mode === "dismiss" && (
          <form
            className="flex flex-wrap items-end gap-2 border-t border-border pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reason) return void toast({ tone: "danger", title: t("competitionCrawl.pickReason") });
              run(() => dismissAction(item.competitionId, reason), t("competitionCrawl.dismissedToast"));
            }}
          >
            <SelectField label={t("competitionCrawl.dismissReason")} value={reason} onChange={(e) => setReason(e.target.value as CompetitionDismissReason | "")} className="min-w-56 flex-1" required>
              <option value="">{t("quizJobs.choose")}</option>
              {COMPETITION_DISMISS_REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`competitionCrawl.reason${r}`)}
                </option>
              ))}
            </SelectField>
            <Button type="submit" size="sm" variant="danger" disabled={pending}>
              {t("competitionCrawl.dismiss")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("view")} disabled={pending}>
              {t("competitionCrawl.cancel")}
            </Button>
          </form>
        )}

        {mode === "view" && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {isDraft && !item.matchedExisting && (
              <Button size="sm" onClick={() => run(() => setCompetitionStatusAction(item.competitionId, "PUBLISHED"), t("appadmin.published"))} disabled={pending}>
                {t("appadmin.publish")}
              </Button>
            )}
            {isDraft && (
              <Button size="sm" variant="secondary" onClick={() => setMode("edit")} disabled={pending} icon={<PencilSimpleIcon weight="bold" aria-hidden="true" />}>
                {t("competitionCrawl.edit")}
              </Button>
            )}
            {isDraft && !dismissed && !item.matchedExisting && (
              <Button size="sm" variant="ghost" onClick={() => setMode("dismiss")} disabled={pending} icon={<XIcon weight="bold" aria-hidden="true" />}>
                {t("competitionCrawl.dismiss")}
              </Button>
            )}
            {item.changedSinceReview && (
              <Button size="sm" variant="secondary" onClick={() => run(() => reviewedAction(item.competitionId), t("competitionCrawl.reviewedToast"))} disabled={pending}>
                {t("competitionCrawl.markReviewed")}
              </Button>
            )}
            {!isDraft && item.changedSinceReview && (
              <Button size="sm" variant="ghost" onClick={() => run(() => setCompetitionStatusAction(item.competitionId, "DRAFT"), t("competitionCrawl.backToDraftToast"))} disabled={pending}>
                {t("competitions.backToDraft")}
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
