"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckIcon, PaperPlaneRightIcon, TrashIcon, XCircleIcon } from "@phosphor-icons/react";
import { VIDURA_ROLES, type AssistantLanguage, type ViduraAnswer, type ViduraAnswers } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { AnswerMarkdown } from "@/components/assistant/answer";
import { useT } from "@/lib/i18n";
import { formatInZone } from "@/lib/dates";
import { ROLE_META } from "@/lib/constants";
import { actAnswerAction, tryAnswerAction } from "./actions";

/**
 * STANDARD ANSWERS (Vidura pass 3, 18 Oct 2026): the operator asks Vidura a question as a role — the same gates and
 * model as everyone — and an answered "Using Shalaghar" how-to or where-is answer may be marked as the standard answer:
 * served after that to the role's people whose question reads the same, with no model, and counted. The library holds
 * every rule (src/lib/assistant/standard.ts); this card only asks.
 */
export function AnswersDesk({ initial }: { initial: ViduraAnswers }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<(typeof VIDURA_ROLES)[number]>("ADMIN");
  const [language, setLanguage] = useState<AssistantLanguage | "">("");
  const [question, setQuestion] = useState("");

  const ask = () => {
    if (question.trim().length < 2) {
      toast({ tone: "danger", title: t("viduraOps.tryInvalid") });
      return;
    }
    startTransition(async () => {
      const result = await tryAnswerAction({ role, question: question.trim(), ...(language ? { language } : {}) });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t("viduraOps.tryDone") });
      setQuestion("");
      router.refresh();
    });
  };

  const act = (answer: ViduraAnswer, action: "CHECK" | "REVOKE" | "DISCARD") => {
    startTransition(async () => {
      const result = await actAnswerAction(answer.id, action);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t(action === "CHECK" ? "viduraOps.checked" : action === "REVOKE" ? "viduraOps.revoked" : "viduraOps.discarded") });
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <Card aria-busy={pending || undefined}>
        <CardHeader icon={<PaperPlaneRightIcon weight="duotone" className="size-5" />} title={t("viduraOps.tryTitle")} description={t("viduraOps.tryIntro")} />
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label={t("viduraOps.tryRole")} value={role} onChange={(e) => setRole(e.target.value as (typeof VIDURA_ROLES)[number])}>
              {VIDURA_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(ROLE_META[r].labelKey)}
                </option>
              ))}
            </SelectField>
            <SelectField label={t("viduraOps.tryLanguage")} value={language} onChange={(e) => setLanguage(e.target.value as AssistantLanguage | "")}>
              <option value="">{t("viduraOps.tryLanguageAuto")}</option>
              <option value="en">{t("gigs.english")}</option>
              <option value="hi">{t("gigs.hindi")}</option>
              <option value="mr">{t("gigs.marathi")}</option>
            </SelectField>
          </div>
          <TextAreaField label={t("viduraOps.tryQuestion")} hint={t("viduraOps.tryQuestionHint")} value={question} rows={2} maxLength={1200} onChange={(e) => setQuestion(e.target.value)} />
          <Button onClick={ask} loading={pending} icon={<PaperPlaneRightIcon weight="bold" />}>
            {t("viduraOps.tryAsk")}
          </Button>
        </CardBody>
      </Card>

      <section className="space-y-3" aria-labelledby="vidura-drafts">
        <h2 id="vidura-drafts" className="text-base font-semibold">
          {t("viduraOps.draftsTitle")}
        </h2>
        {initial.drafts.length === 0 ? <p className="text-sm text-fg-muted">{t("viduraOps.draftsNone")}</p> : null}
        <ul className="space-y-3">
          {initial.drafts.map((a) => (
            <AnswerItem key={a.id} answer={a} pending={pending}>
              {a.markable ? (
                <Button size="sm" icon={<CheckIcon weight="bold" />} loading={pending} onClick={() => act(a, "CHECK")}>
                  {t("viduraOps.markStandard")}
                </Button>
              ) : (
                <p className="text-xs text-fg-muted">{t("viduraOps.notMarkable")}</p>
              )}
              <Button size="sm" variant="ghost" icon={<TrashIcon weight="bold" />} loading={pending} onClick={() => act(a, "DISCARD")}>
                {t("viduraOps.discard")}
              </Button>
            </AnswerItem>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="vidura-standard">
        <h2 id="vidura-standard" className="text-base font-semibold">
          {t("viduraOps.standardTitle")}
        </h2>
        <p className="text-sm text-fg-muted">{t("viduraOps.servedTotal", { count: initial.servedTotal })}</p>
        {initial.standard.length === 0 ? <p className="text-sm text-fg-muted">{t("viduraOps.standardNone")}</p> : null}
        <ul className="space-y-3">
          {initial.standard.map((a) => (
            <AnswerItem key={a.id} answer={a} pending={pending}>
              <Button size="sm" variant="ghost" icon={<XCircleIcon weight="bold" />} loading={pending} onClick={() => act(a, "REVOKE")}>
                {t("viduraOps.revoke")}
              </Button>
            </AnswerItem>
          ))}
        </ul>
      </section>

      {initial.revoked.length > 0 ? (
        <details className="space-y-3">
          <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold">{t("viduraOps.revokedTitle", { count: initial.revoked.length })}</summary>
          <ul className="space-y-3">
            {initial.revoked.map((a) => (
              <AnswerItem key={a.id} answer={a} pending={pending} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function AnswerItem({ answer, pending, children }: { answer: ViduraAnswer; pending: boolean; children?: React.ReactNode }) {
  const t = useT();
  const when = (iso: string | null) => (iso ? formatInZone(new Date(iso), "Asia/Kolkata") : "—");
  const tone = answer.state === "STANDARD" ? "ok" : answer.state === "REVOKED" ? "neutral" : "accent";
  return (
    <li>
      <Card aria-busy={pending || undefined}>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <Badge tone={tone} size="sm">{t(`viduraOps.state${answer.state}`)}</Badge>
            <Badge tone="outline" size="sm">{t(ROLE_META[answer.role].labelKey)}</Badge>
            <Badge tone="outline" size="sm">{t(answer.language === "hi" ? "gigs.hindi" : answer.language === "mr" ? "gigs.marathi" : "gigs.english")}</Badge>
            {answer.verdict !== "ANSWERED" ? <Badge tone="warn" size="sm">{t("viduraOps.notAnswered")}</Badge> : null}
            {answer.state !== "DRAFT" ? <span>{t("viduraOps.hits", { count: answer.hits, when: when(answer.lastHitAt) })}</span> : null}
          </div>
          <p className="text-sm font-medium text-fg" lang={answer.language}>
            {answer.question}
          </p>
          <div className="rounded-[var(--radius-md)] border border-border p-3 text-sm" lang={answer.language}>
            <AnswerMarkdown text={answer.text} />
          </div>
          <p className="text-xs text-fg-muted">
            {answer.state === "STANDARD"
              ? t("viduraOps.checkedBy", { name: answer.checkedBy ?? "—", when: when(answer.checkedAt) })
              : answer.state === "REVOKED"
                ? t("viduraOps.revokedBy", { name: answer.revokedBy ?? "—", when: when(answer.revokedAt) })
                : t("viduraOps.askedAt", { when: when(answer.createdAt) })}
          </p>
          {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
        </CardBody>
      </Card>
    </li>
  );
}
