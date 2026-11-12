"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

import { useToast } from "@/components/ui/toast";
import { save } from "./actions";
import { EXPERT_OFFERINGS, EXPERT_OFFERING_META, type ExpertOffering } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { fieldClass } from "@/components/ui/field-class";

type Props = {
  headline: string;
  bio: string;
  organisation: string | null;
  specialisms: string[];
  timezone: string;
  offering: ExpertOffering;
  mentorCapacity: number | null;
};

const MAX_SPECIALISMS = 12;

/**
 * What a school reads before booking an hour of somebody's time.
 *
 * SPECIALISMS ARE CHIPS, NOT A COMMA-SEPARATED BOX. The marketplace filters on
 * exact values, so "Careers, careers advice" typed into one field becomes two
 * tags that never match a filter and a school that never finds this person. One
 * tag at a time, visible, removable.
 *
 * Standing — published, verified — is shown here and is not editable. It is what
 * decides whether schools see this profile at all, so the person it describes
 * cannot be the one who sets it. Saying so on the page is better than a control
 * that quietly does nothing.
 */
export function ProfileForm({
  headline,
  bio,
  organisation,
  specialisms,
  timezone,
  offering,
  mentorCapacity,
}: Props) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [head, setHead] = useState(headline);
  const [about, setAbout] = useState(bio);
  const [org, setOrg] = useState(organisation ?? "");
  const [zone, setZone] = useState(timezone);
  const [tags, setTags] = useState<string[]>(specialisms);
  const [draft, setDraft] = useState("");
  const [offer, setOffer] = useState<ExpertOffering>(offering);
  const [capacity, setCapacity] = useState(mentorCapacity === null ? "" : String(mentorCapacity));

  const mentors = offer !== "SESSIONS";

  function addTag() {
    const value = draft.trim();
    if (!value) return;
    if (tags.length >= MAX_SPECIALISMS) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setTags([...tags, value]);
    setDraft("");
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await save({
        headline: head,
        bio: about,
        organisation: org,
        specialisms: tags,
        timezone: zone,
        offering: offer,
        // Only sent when it means something. The library nulls it anyway for a
        // sessions-only expert; sending it would be the client asserting a
        // promise its own form is no longer showing.
        mentorCapacity: mentors && capacity.trim() !== "" ? Number(capacity) : null,
      });
      if (!result.ok) {
        setError(actionError(t, result, "expert.didNotSave"));
        return;
      }
      toast({ tone: "ok", title: t("expert.profileSaved") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <label className="block">
        <span className="block text-sm font-medium text-fg">{t("expert.headline")}</span>
        <span className="block text-xs text-fg-muted">{t("expert.headlineHint")}</span>
        <input
          type="text"
          value={head}
          maxLength={120}
          onChange={(e) => setHead(e.target.value)}
          placeholder={t("expert.headlinePlaceholder")}
          className={fieldClass("mt-1.5")}
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-fg">{t("expert.aboutYou")}</span>
        <span className="block text-xs text-fg-muted">{t("expert.bioHint")}</span>
        <textarea
          rows={6}
          value={about}
          maxLength={4000}
          onChange={(e) => setAbout(e.target.value)}
          className={fieldClass("mt-1.5 leading-relaxed")}
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-fg">{t("expert.organisation")}</span>
        <span className="block text-xs text-fg-muted">{t("expert.organisationHint")}</span>
        <input
          type="text"
          value={org}
          maxLength={160}
          onChange={(e) => setOrg(e.target.value)}
          className={fieldClass("mt-1.5")}
        />
      </label>

      <div>
        <span className="block text-sm font-medium text-fg">{t("expert.specialisms")}</span>
        <span className="block text-xs text-fg-muted">
          {t("expert.specialismsHint", { max: MAX_SPECIALISMS })}
        </span>

        {tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <Chip
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="border-transparent bg-accent-soft pl-3 pr-2.5 text-xs text-accent-strong hover:bg-accent-soft hover:text-accent-strong hover:opacity-80"
                >
                  {tag}
                  <XIcon weight="bold" className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">{t("expert.removeSpecialism", { tag })}</span>
                </Chip>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={draft}
            maxLength={60}
            disabled={tags.length >= MAX_SPECIALISMS}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Otherwise Enter submits the surrounding form and the tag is
                // lost along with everything else typed on the page.
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={
              tags.length >= MAX_SPECIALISMS
                ? t("expert.specialismLimit")
                : t("expert.specialismPlaceholder")
            }
            aria-label={t("expert.addSpecialism")}
            className={fieldClass("w-auto min-w-0 flex-1 disabled:opacity-50")}
          />
          <Button
            variant="secondary"
            className="shrink-0"
            disabled={!draft.trim() || tags.length >= MAX_SPECIALISMS}
            icon={<PlusIcon weight="bold" />}
            onClick={addTag}
          >
            {t("common.add")}
          </Button>
        </div>
      </div>

      {/*
        WHAT THEY ARE OFFERING, and it is the one answer on this form that
        changes what other people may do to them. A school cannot book a session
        with somebody who only mentors, and cannot pair a child with somebody
        who only gives workshops — enforced in `experts.ts` and `mentoring.ts`,
        not merely filtered here.
      */}
      <fieldset className="rounded-[var(--radius-md)] border border-border p-4">
        <legend className="px-1 text-sm font-medium text-fg">
          {t("expert.offeringQuestion")}
        </legend>
        <div className="space-y-2">
          {EXPERT_OFFERINGS.map((value) => (
            <label key={value} className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="offering"
                checked={offer === value}
                onChange={() => setOffer(value)}
                className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-fg">
                  {t(EXPERT_OFFERING_META[value].labelKey)}
                </span>
                <span className="block text-xs leading-relaxed text-fg-muted">
                  {t(EXPERT_OFFERING_META[value].hintKey)}
                </span>
              </span>
            </label>
          ))}
        </div>

        {/* Hidden rather than disabled when it means nothing: a greyed-out
            number still reads as a promise somebody made. */}
        {mentors && (
          <label className="mt-4 block border-t border-border pt-4">
            <span className="block text-sm font-medium text-fg">
              {t("expert.mentorCapacity")}
            </span>
            <span className="block text-xs leading-relaxed text-fg-muted">
              {t("expert.mentorCapacityHint")}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="3"
              className={fieldClass("mt-1.5 w-28")}
            />
          </label>
        )}
      </fieldset>

      <label className="block">
        <span className="block text-sm font-medium text-fg">{t("expert.timezone")}</span>
        <span className="block text-xs text-fg-muted">{t("expert.timezoneHint")}</span>
        <input
          type="text"
          value={zone}
          maxLength={64}
          onChange={(e) => setZone(e.target.value)}
          placeholder={t("expert.timezonePlaceholder")}
          className={fieldClass("mt-1.5")}
        />
      </label>

      <Button loading={pending} disabled={head.trim().length < 3} onClick={submit}>
        {t("expert.saveProfile")}
      </Button>
    </div>
  );
}
