"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { save } from "./actions";

type Props = {
  headline: string;
  bio: string;
  organisation: string | null;
  specialisms: string[];
  timezone: string;
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
export function ProfileForm({ headline, bio, organisation, specialisms, timezone }: Props) {
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
      });
      if (!result.ok) {
        setError(result.error ?? "That did not save.");
        return;
      }
      toast({ tone: "ok", title: "Profile saved" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <label className="block">
        <span className="block text-sm font-medium text-fg">Headline</span>
        <span className="block text-xs text-fg-muted">
          One line. This is what a school sees first.
        </span>
        <input
          type="text"
          value={head}
          maxLength={120}
          onChange={(e) => setHead(e.target.value)}
          placeholder="Careers adviser, 15 years in engineering"
          className="mt-1.5 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-fg">About you</span>
        <span className="block text-xs text-fg-muted">
          What you offer, and who it is for.
        </span>
        <textarea
          rows={6}
          value={about}
          maxLength={4000}
          onChange={(e) => setAbout(e.target.value)}
          className="mt-1.5 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-fg outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-fg">Where you work</span>
        <span className="block text-xs text-fg-muted">Optional.</span>
        <input
          type="text"
          value={org}
          maxLength={160}
          onChange={(e) => setOrg(e.target.value)}
          className="mt-1.5 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
        />
      </label>

      <div>
        <span className="block text-sm font-medium text-fg">Specialisms</span>
        <span className="block text-xs text-fg-muted">
          Up to {MAX_SPECIALISMS}. Schools browse by these.
        </span>

        {tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="flex items-center gap-1.5 rounded-full bg-accent-soft py-1 pl-3 pr-2 text-xs font-medium text-accent-strong"
                >
                  {tag}
                  <XIcon weight="bold" className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Remove {tag}</span>
                </button>
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
            placeholder={tags.length >= MAX_SPECIALISMS ? "That is the limit" : "Olympiad maths"}
            aria-label="Add a specialism"
            className="min-h-11 flex-1 rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent disabled:opacity-50"
          />
          <Button
            variant="secondary"
            disabled={!draft.trim() || tags.length >= MAX_SPECIALISMS}
            icon={<PlusIcon weight="bold" />}
            onClick={addTag}
          >
            Add
          </Button>
        </div>
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-fg">Your timezone</span>
        <span className="block text-xs text-fg-muted">
          Times you offer are stored in UTC; this is how they are read back to you.
        </span>
        <input
          type="text"
          value={zone}
          maxLength={64}
          onChange={(e) => setZone(e.target.value)}
          placeholder="Asia/Kolkata"
          className="mt-1.5 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
        />
      </label>

      <Button loading={pending} disabled={head.trim().length < 3} onClick={submit}>
        Save profile
      </Button>
    </div>
  );
}
