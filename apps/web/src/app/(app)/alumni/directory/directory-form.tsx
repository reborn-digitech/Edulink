"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ALUMNI_CONTACT_PREFS, type AlumniContactPref } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { joinDirectoryAction, leaveDirectoryAction } from "../actions";

/**
 * The alumnus's own directory entry: join (or change it) and leave. Nothing
 * is shown to anyone until "Join" is pressed; leaving clears what was written.
 */
export function DirectoryForm({ me }: { me: { listed: boolean; city: string | null; occupation: string | null; contactPref: AlumniContactPref } }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [city, setCity] = useState(me.city ?? "");
  const [occupation, setOccupation] = useState(me.occupation ?? "");
  const [contactPref, setContactPref] = useState<AlumniContactPref>(me.contactPref);

  function join(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await joinDirectoryAction({ city, occupation, contactPref });
      if (!result.ok) return void toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
      toast({ tone: "ok", title: t("alumni.directoryJoined") });
      router.refresh();
    });
  }

  function leave() {
    startTransition(async () => {
      const result = await leaveDirectoryAction();
      if (!result.ok) return void toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
      setCity("");
      setOccupation("");
      setContactPref("OFFICE");
      toast({ tone: "ok", title: t("alumni.directoryLeft") });
      router.refresh();
    });
  }

  return (
    <form onSubmit={join} className="space-y-4">
      <TextField label={t("alumni.directoryCity")} value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} autoComplete="address-level2" />
      <TextField label={t("alumni.directoryOccupation")} value={occupation} onChange={(e) => setOccupation(e.target.value)} maxLength={120} />
      <SelectField label={t("alumni.directoryContact")} value={contactPref} onChange={(e) => setContactPref(e.target.value as AlumniContactPref)}>
        {ALUMNI_CONTACT_PREFS.map((pref) => (
          <option key={pref} value={pref}>
            {t(`alumni.contact${pref}`)}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending} data-testid="alumni-directory-join">
          {me.listed ? t("alumni.directorySave") : t("alumni.directoryJoin")}
        </Button>
        {me.listed && (
          <Button type="button" variant="secondary" disabled={pending} onClick={leave}>
            {t("alumni.directoryLeave")}
          </Button>
        )}
      </div>
    </form>
  );
}
