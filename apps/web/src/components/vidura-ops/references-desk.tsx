"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { LinkSimpleIcon, PencilSimpleIcon, PlusIcon, PowerIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { VIDURA_REFERENCE_KINDS, VIDURA_REFERENCE_ROLES, type ViduraReferenceAdd, type ViduraReferenceSource, type ViduraReferenceSources } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatInZone } from "@/lib/dates";
import { ROLE_META } from "@/lib/constants";
import { actReferenceAction, addReferenceAction } from "./reference-actions";

type Kind = (typeof VIDURA_REFERENCE_KINDS)[number];
type ShownRole = (typeof VIDURA_REFERENCE_ROLES)[number];
type Draft = { name: string; host: string; kind: Kind; licence: string; licenceUrl: string; linkTemplate: string; shownTo: ShownRole[] };
const EMPTY: Draft = { name: "", host: "", kind: "COURSE", licence: "", licenceUrl: "", linkTemplate: "", shownTo: ["TEACHER", "FACULTY", "HOD", "STUDENT"] };

/**
 * VIDURA'S REFERENCE SOURCES (pass 4, 18 Oct 2026): the operator's allow-list of public education sources linked
 * beside a Learning answer. The rules live in the library (src/lib/assistant/references.ts): https on the source's own
 * host, "{topic}" in the template, never Medium, a STUDENT shown links only as an adult at a college and a pupil never
 * (decision 0002 is not relaxed: the card says so). This card only asks.
 */
export function ReferencesDesk({ initial }: { initial: ViduraReferenceSources }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ field?: string; error: string } | null>(null);

  const payload = (d: Draft): ViduraReferenceAdd => ({ name: d.name.trim(), host: d.host.trim(), kind: d.kind, licence: d.licence.trim(), licenceUrl: d.licenceUrl.trim() || null, linkTemplate: d.linkTemplate.trim(), shownTo: d.shownTo });

  const save = () => {
    setFieldError(null);
    startTransition(async () => {
      const result = editing ? await actReferenceAction(editing, { action: "EDIT", ...payload(draft) }) : await addReferenceAction(payload(draft));
      if (!result.ok) {
        setFieldError({ field: result.field, error: result.error });
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t(editing ? "viduraOps.refSaved" : "viduraOps.refAdded") });
      setDraft(EMPTY);
      setEditing(null);
      router.refresh();
    });
  };

  const toggle = (s: ViduraReferenceSource) => {
    startTransition(async () => {
      const result = await actReferenceAction(s.id, { action: s.enabled ? "DISABLE" : "ENABLE" });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t(s.enabled ? "viduraOps.refDisabled" : "viduraOps.refEnabled") });
      router.refresh();
    });
  };

  const edit = (s: ViduraReferenceSource) => {
    setEditing(s.id);
    setFieldError(null);
    setDraft({ name: s.name, host: s.host, kind: s.kind, licence: s.licence, licenceUrl: s.licenceUrl ?? "", linkTemplate: s.linkTemplate, shownTo: s.shownTo });
    document.getElementById("vidura-reference-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const err = (field: string) => (fieldError?.field === field ? fieldError.error : undefined);
  const when = (iso: string) => formatInZone(new Date(iso), "Asia/Kolkata");

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader icon={<ShieldCheckIcon weight="duotone" className="size-5" />} title={t("viduraOps.refWhoTitle")} />
        <CardBody className="space-y-2 text-sm">
          <p>{t("viduraOps.refWhoStaff")}</p>
          <p className="font-medium" data-testid="vidura-references-pupils">
            {t("viduraOps.refWhoPupils")}
          </p>
          <p>{t("viduraOps.refWhoLinks")}</p>
          <p>{t("viduraOps.refNoMedium")}</p>
        </CardBody>
      </Card>

      <section className="space-y-3" aria-labelledby="vidura-reference-list">
        <h2 id="vidura-reference-list" className="text-base font-semibold">
          {t("viduraOps.refListTitle")}
        </h2>
        {initial.sources.length === 0 ? <p className="text-sm text-fg-muted">{t("viduraOps.refNone")}</p> : null}
        <ul className="space-y-3">
          {initial.sources.map((s) => (
            <li key={s.id}>
              <Card aria-busy={pending || undefined}>
                <CardBody className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-fg">{s.name}</span>
                    <Badge tone={s.enabled ? "ok" : "neutral"} size="sm">
                      {t(s.enabled ? "viduraOps.refOn" : "viduraOps.refOff")}
                    </Badge>
                    <Badge tone="outline" size="sm">
                      {t(`viduraOps.refKind${s.kind}`)}
                    </Badge>
                    <span className="text-xs text-fg-muted">{s.host}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{t("viduraOps.refLicence")}: </span>
                    {s.licence}
                    {s.licenceUrl ? (
                      <>
                        {" "}
                        <a href={s.licenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-accent-strong underline underline-offset-4">
                          <LinkSimpleIcon className="size-4" aria-hidden="true" />
                          {t("viduraOps.refLicenceOpen")}
                        </a>
                      </>
                    ) : null}
                  </p>
                  <p className="break-all text-xs text-fg-muted">{t("viduraOps.refTemplateShown", { template: s.linkTemplate })}</p>
                  <p className="text-xs text-fg-muted">{t("viduraOps.refShownTo", { roles: s.shownTo.map((r) => t(ROLE_META[r].labelKey)).join(", ") })}</p>
                  <p className="text-xs text-fg-muted">{s.updatedBy ? t("viduraOps.refChangedBy", { name: s.updatedBy, when: when(s.updatedAt) }) : t("viduraOps.refSeeded", { when: when(s.createdAt) })}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" icon={<PencilSimpleIcon weight="bold" />} onClick={() => edit(s)} disabled={pending}>
                      {t("viduraOps.refEdit")}
                    </Button>
                    <Button size="sm" variant="ghost" icon={<PowerIcon weight="bold" />} loading={pending} onClick={() => toggle(s)}>
                      {t(s.enabled ? "viduraOps.refDisable" : "viduraOps.refEnable")}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card id="vidura-reference-form" aria-busy={pending || undefined}>
        <CardHeader icon={<PlusIcon weight="duotone" className="size-5" />} title={t(editing ? "viduraOps.refEditTitle" : "viduraOps.refAddTitle")} description={t("viduraOps.refAddIntro")} />
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={t("viduraOps.refName")} value={draft.name} maxLength={80} required error={err("name")} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField label={t("viduraOps.refHost")} hint={t("viduraOps.refHostHint", { example: "nptel.ac.in" })} value={draft.host} maxLength={120} required error={err("host")} onChange={(e) => setDraft({ ...draft, host: e.target.value })} />
            <SelectField label={t("viduraOps.refKind")} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Kind })}>
              {VIDURA_REFERENCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`viduraOps.refKind${k}`)}
                </option>
              ))}
            </SelectField>
            <TextField label={t("viduraOps.refLicenceUrl")} value={draft.licenceUrl} maxLength={400} error={err("licenceUrl")} onChange={(e) => setDraft({ ...draft, licenceUrl: e.target.value })} />
          </div>
          <TextAreaField label={t("viduraOps.refLicence")} hint={t("viduraOps.refLicenceHint")} value={draft.licence} rows={2} maxLength={800} required onChange={(e) => setDraft({ ...draft, licence: e.target.value })} />
          <TextField label={t("viduraOps.refTemplate")} hint={t("viduraOps.refTemplateHint", { marker: "{topic}" })} value={draft.linkTemplate} maxLength={400} required error={err("linkTemplate")} onChange={(e) => setDraft({ ...draft, linkTemplate: e.target.value })} />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("viduraOps.refShownToLabel")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {VIDURA_REFERENCE_ROLES.map((r) => (
                <CheckboxField
                  key={r}
                  label={t(ROLE_META[r].labelKey)}
                  description={r === "STUDENT" ? t("viduraOps.refStudentNote") : undefined}
                  checked={draft.shownTo.includes(r)}
                  onChange={(e) => setDraft({ ...draft, shownTo: e.target.checked ? VIDURA_REFERENCE_ROLES.filter((x) => x === r || draft.shownTo.includes(x)) : draft.shownTo.filter((x) => x !== r) })}
                />
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} loading={pending} icon={<PlusIcon weight="bold" />}>
              {t(editing ? "viduraOps.refSave" : "viduraOps.refAdd")}
            </Button>
            {editing ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setDraft(EMPTY);
                  setFieldError(null);
                }}
              >
                {t("viduraOps.refCancel")}
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
