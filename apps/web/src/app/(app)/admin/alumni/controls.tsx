"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ALUMNI_FEED_MODES, type AlumniFeedMode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { saveFeedModeAction, sendNoteAction, setMentorAction, setMutedAction } from "./actions";

type Result = { ok: boolean; error?: string; count?: number };

function useRun() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const run = (act: () => Promise<Result>, okTitle: (r: Result) => string, after?: () => void) =>
    startTransition(async () => {
      const result = await act();
      if (!result.ok) return void toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
      toast({ tone: "ok", title: okTitle(result) });
      after?.();
      router.refresh();
    });
  return { t, pending, run };
}

/** What alumni may do on the feed: one select and a save. */
export function FeedModeForm({ current }: { current: AlumniFeedMode }) {
  const { t, pending, run } = useRun();
  const [mode, setMode] = useState<AlumniFeedMode>(current);
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveFeedModeAction(mode), () => t("alumni.adminSaved"));
      }}
    >
      <SelectField label={t("alumni.adminFeedTitle")} value={mode} onChange={(e) => setMode(e.target.value as AlumniFeedMode)} className="min-w-64 flex-1">
        {ALUMNI_FEED_MODES.map((m) => (
          <option key={m} value={m}>
            {t(`alumni.feedMode${m}`)}
          </option>
        ))}
      </SelectField>
      <Button type="submit" loading={pending} disabled={mode === current}>
        {t("alumni.adminSave")}
      </Button>
    </form>
  );
}

/** A note to one batch, or to everybody. */
export function NoteForm({ years }: { years: number[] }) {
  const { t, pending, run } = useRun();
  const [who, setWho] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => sendNoteAction({ batchYear: who ? Number(who) : null, title, body }),
          (r) => t("alumni.adminNoteSent", { count: r.count ?? 0 }),
          () => {
            setTitle("");
            setBody("");
          },
        );
      }}
    >
      <SelectField label={t("alumni.adminNoteWho")} value={who} onChange={(e) => setWho(e.target.value)}>
        <option value="">{t("alumni.noteForAll")}</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {t("alumni.batchOf", { year: y })}
          </option>
        ))}
      </SelectField>
      <TextField label={t("alumni.shareTitleField")} value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={200} />
      <TextAreaField label={t("alumni.adminNoteTitle")} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={5000} rows={4} />
      <Button type="submit" loading={pending}>
        {t("alumni.adminNoteSend")}
      </Button>
    </form>
  );
}

/** One alumnus's two switches: messages paused or not (with a reason they are told), mentor or not. */
export function AlumnusControls({ membershipId, muted, mentor, isMinor }: { membershipId: string; muted: boolean; mentor: boolean; isMinor: boolean }) {
  const { t, pending, run } = useRun();
  const [reason, setReason] = useState("");
  const [asking, setAsking] = useState(false);
  return (
    <div className="flex flex-wrap items-end gap-2">
      {asking && !muted && (
        <TextField label={t("alumni.adminMuteReason")} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className="min-w-56 flex-1" />
      )}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={pending}
        onClick={() => {
          if (!muted && !asking) return setAsking(true);
          run(() => setMutedAction(membershipId, !muted, reason), () => t("alumni.adminSaved"), () => {
            setAsking(false);
            setReason("");
          });
        }}
      >
        {muted ? t("alumni.adminUnmute") : t("alumni.adminMute")}
      </Button>
      {!isMinor && (
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setMentorAction(membershipId, !mentor), () => t("alumni.adminSaved"))}>
          {mentor ? t("alumni.adminMentorOff") : t("alumni.adminMentorOn")}
        </Button>
      )}
    </div>
  );
}
