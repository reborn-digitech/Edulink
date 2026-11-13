"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { LOCALES } from "@edulink/i18n";
import { SITE_ENQUIRY_STATUSES, type SiteEnquiryRow, type SiteEnquiryStatus } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { replySiteEnquiryAction, siteEnquiryStatusAction } from "../actions";

/**
 * THE WEBSITE'S ENQUIRIES (website-two, 16 October 2026): an inbox of what the site's form brought in — new, replied,
 * closed. A reply goes by email in the enquirer's own language and is kept with the enquiry; an enquirer who left only
 * a phone is called instead. Each reply and each change of state is audited. An enquiry closed or untouched for 180
 * days is deleted by the weekly tidy, which the form states.
 */

const STATUS_KEYS: Record<SiteEnquiryStatus, TranslationKey> = { NEW: "website.enquiryNew", REPLIED: "siteEditor.enquiryReplied", CLOSED: "siteEditor.enquiryClosed" };

export function EnquiriesSection({ inbox, when }: { inbox: { enquiries: SiteEnquiryRow[]; counts: Record<SiteEnquiryStatus, number> }; when: (iso: string) => string }) {
  const t = useT();
  const [tab, setTab] = useState<SiteEnquiryStatus>("NEW");
  const [rows, setRows] = useState(inbox.enquiries);
  const shown = rows.filter((r) => r.status === tab);
  const replace = (row: SiteEnquiryRow) => setRows((list) => list.map((r) => (r.id === row.id ? row : r)));
  const counts = SITE_ENQUIRY_STATUSES.reduce((acc, s) => ({ ...acc, [s]: rows.filter((r) => r.status === s).length }), {} as Record<SiteEnquiryStatus, number>);
  return (
    <Card data-testid="site-enquiries">
      <CardHeader title={t("website.enquiriesTitle")} description={t("siteEditor.enquiriesIntro")} />
      <CardBody className="space-y-4">
        <div role="tablist" aria-label={t("website.enquiriesTitle")} className="flex flex-wrap gap-2">
          {SITE_ENQUIRY_STATUSES.map((s) => (
            <Button key={s} type="button" role="tab" aria-selected={tab === s} size="sm" variant={tab === s ? "primary" : "secondary"} onClick={() => setTab(s)}>
              {t("siteEditor.enquiryTab", { state: t(STATUS_KEYS[s]), count: counts[s] ?? inbox.counts[s] })}
            </Button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("website.enquiriesNone")}</p>
        ) : (
          <ul className="space-y-3">
            {shown.map((q) => (
              <EnquiryItem key={q.id} q={q} when={when} onChanged={replace} />
            ))}
          </ul>
        )}
        {/* The office's own sentence: the site's "We keep your question…" is the enquirer's (loose ends, 18 Oct 2026). */}
        <p className="text-xs text-fg-muted">{t("siteEditor.enquiryRetentionOffice")}</p>
      </CardBody>
    </Card>
  );
}

function EnquiryItem({ q, when, onChanged }: { q: SiteEnquiryRow; when: (iso: string) => string; onChanged: (row: SiteEnquiryRow) => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const language = LOCALES.find((l) => l.code === q.language)?.native ?? q.language;
  const reply = () =>
    start(async () => {
      const r = await replySiteEnquiryAction(q.id, text);
      if (!r.ok || !r.enquiry) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      onChanged(r.enquiry);
      setText("");
      toast({ tone: "ok", title: t("siteEditor.replySent") });
      router.refresh();
    });
  const status = (next: SiteEnquiryStatus) =>
    start(async () => {
      const r = await siteEnquiryStatusAction(q.id, next);
      if (!r.ok || !r.enquiry) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      onChanged(r.enquiry);
      router.refresh();
    });
  return (
    <li className="space-y-2 rounded-[var(--radius-md)] border border-border p-3" data-enquiry={q.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-fg">
          {q.name} · <span className="font-normal">{q.contact}</span>
          {q.email ? <span className="font-normal"> · {q.email}</span> : null}
        </p>
        <Badge tone={q.status === "NEW" ? "accent" : q.status === "REPLIED" ? "ok" : "neutral"}>{t(STATUS_KEYS[q.status])}</Badge>
      </div>
      <p className="text-xs text-fg-muted">
        {when(q.createdAt)} · {t("siteEditor.enquiryLanguage", { language })}
        {q.grade ? ` · ${t("website.enquiryGrade", { grade: q.grade })}` : ""}
        {q.wantsVisit ? ` · ${t("siteEditor.enquiryWantsVisit")}` : ""}
      </p>
      <p className="whitespace-pre-line text-sm text-fg">{q.message}</p>
      {/* website-three (17 Oct 2026): the thread, every reply sent on it, oldest first; a further reply joins it. */}
      {q.replies.length ? (
        <ol className="space-y-2" aria-label={t("siteThree.threadLabel")} data-testid="site-enquiry-thread">
          {q.replies.map((r, i) => (
            <li key={`${r.at}-${i}`} className="rounded-[var(--radius-sm)] bg-surface-muted p-2 text-sm">
              <p className="text-xs font-medium text-fg-muted">{r.byName ? t("siteThree.repliedBy", { name: r.byName, when: when(r.at) }) : t("siteEditor.repliedAt", { when: when(r.at) })}</p>
              <p className="whitespace-pre-line text-fg">{r.text}</p>
            </li>
          ))}
        </ol>
      ) : q.replyText ? (
        <div className="rounded-[var(--radius-sm)] bg-surface-muted p-2 text-sm">
          <p className="text-xs font-medium text-fg-muted">{q.repliedAt ? t("siteEditor.repliedAt", { when: when(q.repliedAt) }) : t("siteEditor.enquiryReplied")}</p>
          <p className="whitespace-pre-line text-fg">{q.replyText}</p>
        </div>
      ) : null}
      {q.status !== "CLOSED" ? (
        q.replyTo ? (
          <div className="space-y-2">
            <TextAreaField label={t("siteEditor.replyLabel", { to: q.replyTo })} hint={q.replies.length ? t("siteThree.replyAgainHint", { language }) : t("siteEditor.replyHint", { language })} maxLength={4000} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            <Button type="button" size="sm" loading={pending} disabled={!text.trim()} onClick={reply}>
              {t("siteEditor.replySend")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">{t("siteEditor.replyPhoneOnly")}</p>
        )
      ) : null}
      <div className="flex flex-wrap gap-2">
        {q.status === "CLOSED" ? (
          <Button type="button" size="sm" variant="secondary" loading={pending} onClick={() => status("NEW")}>
            {t("siteEditor.enquiryReopen")}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="secondary" loading={pending} onClick={() => status("CLOSED")}>
            {t("siteEditor.enquiryClose")}
          </Button>
        )}
      </div>
    </li>
  );
}
