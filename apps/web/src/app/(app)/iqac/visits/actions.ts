"use server";

import { visitItemSaveSchema, visitSaveSchema, visitUpdateSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { addVisitItem, createVisit, removeVisitItem, updateVisit } from "@/lib/peer-visits";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * The peer-team visit file's writes from the web (R-2, 5 Oct 2026), for the
 * IQAC's pages and an HOD's. Who may make each is lib/peer-visits.ts's to
 * decide; `base` is the page the form came from. Only async functions exported.
 */
const base = (form: FormData) => (field(form, "base") === "/hod/visits" ? "/hod/visits" : "/iqac/visits");

/** "HH:mm" as minutes from midnight. */
function minutes(raw: string, name: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(raw);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new RuleRefusal("refusal.notValid", 422, undefined, name);
  return Number(m[1]) * 60 + Number(m[2]);
}

export async function createVisitAction(previous: FormState, form: FormData): Promise<FormState> {
  const b = base(form);
  return answerForm(
    previous,
    form,
    async () => {
      const team = field(form, "team")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((line) => {
          const [name, ...role] = line.split(",");
          return { name: (name ?? "").trim(), role: role.join(",").trim() };
        });
      await createVisit(await requireApiUser(), visitSaveSchema.parse({ framework: field(form, "framework"), cycleId: field(form, "cycleId") || null, departmentId: field(form, "departmentId") || null, year: intField(form, "year"), title: field(form, "title"), fromDate: field(form, "fromDate"), toDate: field(form, "toDate"), team }));
      return "peerVisit.created";
    },
    { revalidate: [b] },
  );
}

export async function setVisitStatusAction(previous: FormState, form: FormData): Promise<FormState> {
  const b = base(form);
  const id = field(form, "visitId");
  return answerForm(
    previous,
    form,
    async () => {
      await updateVisit(await requireApiUser(), id, visitUpdateSchema.parse({ status: field(form, "status") }));
      return field(form, "status") === "DONE" ? "peerVisit.markedDone" : "peerVisit.markedPlanned";
    },
    { revalidate: [`${b}/${id}`, b] },
  );
}

export async function addScheduleAction(previous: FormState, form: FormData): Promise<FormState> {
  const b = base(form);
  const id = field(form, "visitId");
  return answerForm(
    previous,
    form,
    async () => {
      await addVisitItem(await requireApiUser(), id, visitItemSaveSchema.parse({ kind: "SCHEDULE", dayKey: field(form, "dayKey"), startMinute: minutes(field(form, "start"), "start"), endMinute: minutes(field(form, "end"), "end"), activity: field(form, "activity"), venue: field(form, "venue"), ownerName: field(form, "ownerName") }));
      return "peerVisit.slotAdded";
    },
    { revalidate: [`${b}/${id}`], fields: { endMinute: "end", startMinute: "start" } },
  );
}

export async function addEvidenceAction(previous: FormState, form: FormData): Promise<FormState> {
  const b = base(form);
  const id = field(form, "visitId");
  return answerForm(
    previous,
    form,
    async () => {
      const linkKind = field(form, "linkKind");
      const linkId = linkKind === "FILING" ? field(form, "filingId") : linkKind === "FILE" ? field(form, "fileId") : linkKind === "METRIC" ? field(form, "criterion") : "";
      await addVisitItem(await requireApiUser(), id, visitItemSaveSchema.parse({ kind: "EVIDENCE", criterion: field(form, "criterion"), title: field(form, "title"), linkKind, linkId: linkId || null, url: linkKind === "LINK" ? field(form, "url") || null : null, note: field(form, "note") }));
      return "peerVisit.evidenceAdded";
    },
    { revalidate: [`${b}/${id}`], fields: { linkId: "linkKind" } },
  );
}

export async function removeItemAction(previous: FormState, form: FormData): Promise<FormState> {
  const b = base(form);
  const id = field(form, "visitId");
  return answerForm(
    previous,
    form,
    async () => {
      await removeVisitItem(await requireApiUser(), id, field(form, "itemId"));
      return "peerVisit.removed";
    },
    { revalidate: [`${b}/${id}`] },
  );
}
