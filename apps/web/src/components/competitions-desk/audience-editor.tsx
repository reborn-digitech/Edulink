"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { UsersThreeIcon } from "@phosphor-icons/react";
import { STREAMS, type StreamCode } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { setAudienceAction } from "@/app/appadmin/audience-actions";

type Audience = "SCHOOL" | "COLLEGE" | null;

/** The streams as a row of checkboxes (college-content, 12 Oct 2026): a college competition's, or a college organiser's. */
export function StreamPicker({ value, onChange, legend, hint }: { value: string[]; onChange: (next: StreamCode[]) => void; legend: string; hint?: string }) {
  const t = useT();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-fg">{legend}</legend>
      {hint ? <p className="text-xs text-fg-muted">{hint}</p> : null}
      <div className="grid gap-1 sm:grid-cols-3">
        {STREAMS.map((s) => (
          <CheckboxField
            key={s}
            label={t(`streams.${s}.name`)}
            checked={value.includes(s)}
            onChange={(e) => onChange(STREAMS.filter((x) => (x === s ? e.target.checked : value.includes(x))))}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** "For schools", "For colleges: Law", "Schools and colleges (not set)". */
export function AudienceBadge({ audience, streams }: { audience: Audience; streams: string[] }) {
  const t = useT();
  const words =
    audience === "SCHOOL"
      ? t("competitionAudience.badgeSCHOOL")
      : audience === "COLLEGE"
        ? t("competitionAudience.badgeCOLLEGE", { streams: streams.length ? streams.map((s) => t(`streams.${s}.name` as never)).join(", ") : t("competitionAudience.allColleges") })
        : t("competitionAudience.notSet");
  return (
    <Badge size="sm" tone={audience ? "accent" : "outline"}>
      {words}
    </Badge>
  );
}

/**
 * WHO A PLATFORM COMPETITION IS FOR, on the competitions desk (college-content, 12 Oct 2026): the badge, and a press
 * that opens the form — schools, colleges (with the streams; none ticked is every college), or not set (shown to
 * both). Any status: a published competition's audience is the desk's to set.
 */
export function AudienceEditor({ competitionId, audience, streams }: { competitionId: string; audience: Audience; streams: string[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [who, setWho] = useState<Audience>(audience);
  const [picked, setPicked] = useState<string[]>(streams);

  const save = () =>
    startTransition(async () => {
      const result = await setAudienceAction(competitionId, { audience: who, streams: who === "COLLEGE" ? picked : [] });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t(result.changed ? "competitionAudience.saved" : "competitionAudience.unchanged") });
      setOpen(false);
      router.refresh();
    });

  return (
    <div className="space-y-2" data-testid="competition-audience">
      <div className="flex flex-wrap items-center gap-2">
        <UsersThreeIcon aria-hidden="true" className="size-4 text-fg-muted" />
        <span className="text-xs font-medium text-fg-muted">{t("competitionAudience.label")}</span>
        <AudienceBadge audience={audience} streams={streams} />
        {!open && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            {t("competitionAudience.change")}
          </Button>
        )}
      </div>
      {open && (
        <form
          className="space-y-3 rounded-[var(--radius-md)] border border-border p-3"
          aria-busy={pending || undefined}
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <SelectField label={t("competitionAudience.label")} value={who ?? ""} onChange={(e) => setWho((e.target.value || null) as Audience)}>
            <option value="">{t("competitionAudience.notSet")}</option>
            <option value="SCHOOL">{t("competitionAudience.SCHOOL")}</option>
            <option value="COLLEGE">{t("competitionAudience.COLLEGE")}</option>
          </SelectField>
          {who === "COLLEGE" && <StreamPicker legend={t("competitionAudience.streamsLabel")} hint={t("competitionAudience.streamsHint")} value={picked} onChange={setPicked} />}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {t("competitionAudience.save")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              {t("competitionAudience.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
