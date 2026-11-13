"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { HandshakeIcon, SealCheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { askForMentor } from "./actions";
import { useT } from "@/lib/i18n";
import type { RequestableExpert } from "@/lib/mentoring";

/**
 * A pupil asking for a mentor.
 *
 * THE COPY DOES THE WORK HERE. A child pressing this is not choosing a mentor —
 * they are asking two adults to decide — and a form that looked like a booking
 * would set them up for a refusal that reads as rejection. So it says who has to
 * agree, in what order, before anything is typed, and says it in the second
 * person because a nine-year-old is the reader.
 */
export function AskForm({ experts, openRequests, max }: {
  experts: RequestableExpert[];
  openRequests: number;
  max: number;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string | null>(null);

  const atLimit = openRequests >= max;

  if (experts.length === 0 && !atLimit) return null;

  return (
    <Card>
      <CardHeader
        icon={<HandshakeIcon weight="duotone" className="size-5" />}
        title={t("mentoring.askTitle")}
        description={t("mentoring.askDescription")}
      />
      <CardBody className="space-y-4">
        <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-3 text-sm leading-relaxed text-fg-muted">
          {/* One paragraph — the bold spans went with the fragments. */}
          {t("mentoring.askExplainer")}
        </p>

        {atLimit ? (
          <p className="text-sm text-fg-muted">
            {openRequests === 1
              ? t("mentoring.atLimitOne")
              : t("mentoring.atLimitMany", { count: openRequests })}
          </p>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-fg">{t("mentoring.whoToAsk")}</p>
              <ul className="mt-2 space-y-2">
                {experts.map((expert) => (
                  <li key={expert.id}>
                    <button
                      type="button"
                      onClick={() => setChosen(expert.id === chosen ? null : expert.id)}
                      aria-pressed={chosen === expert.id}
                      className={cn(
                        "w-full rounded-[var(--radius-md)] border p-3 text-left",
                        chosen === expert.id
                          ? "border-accent bg-accent-soft"
                          : "border-border bg-surface hover:border-border-strong",
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-fg">{expert.name}</span>
                        {expert.verified && (
                          <Badge tone="ok" size="sm">
                            <SealCheckIcon weight="fill" className="mr-1 inline size-3" />
                            {t("mentoring.checked")}
                          </Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-fg-muted">{expert.headline}</span>
                      {expert.specialisms.length > 0 && (
                        <span className="mt-1.5 flex flex-wrap gap-1.5">
                          {expert.specialisms.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-fg-muted"
                            >
                              {s}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {chosen && (
              <>
                <TextAreaField
                  label={t("mentoring.helpWithWhat")}
                  required
                  rows={4}
                  value={why}
                  error={error ?? undefined}
                  maxLength={1000}
                  onChange={(e) => setWhy(e.target.value)}
                  hint={t("mentoring.helpHint")}
                />
                <Button
                  loading={pending}
                  disabled={pending || why.trim().length < 15}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await askForMentor({
                        expertProfileId: chosen,
                        purpose: why.trim(),
                      });
                      if (!result.ok) {
                        setError(result.error ?? t("mentoring.didNotWork"));
                        return;
                      }
                      toast({
                        tone: "ok",
                        title: t("mentoring.sentToSchool"),
                        description: t("mentoring.willLetYouKnow"),
                      });
                      setChosen(null);
                      setWhy("");
                      router.refresh();
                    });
                  }}
                >
                  {t("mentoring.askYourSchool")}
                </Button>
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
