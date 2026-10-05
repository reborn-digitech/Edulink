"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { CycleSave, CycleView } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  CheckboxField,
  DateField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { documentKeyFrom } from "@/components/admissions/labels";
import { saveCycleAction } from "./actions";

type Year = { id: string; name: string; isCurrent: boolean };
type Structure = {
  id: string;
  name: string;
  academicYearId: string;
  gradeLevel: string | null;
};
type GradeDraft = { id: string; grade: string; seats: string };
/** `key` is the stored key of a document the cycle already has; a new row derives its key from its name when saved. */
type DocumentDraft = {
  id: string;
  key: string | null;
  name: string;
  required: boolean;
};

let seq = 0;
const nextId = () => `row-${++seq}`;

/**
 * The office's editor for one admission cycle: the year, the grades and
 * their seats, the documents asked for, whether there is an entrance test,
 * the notice families read, the fee structure an admitted pupil goes on,
 * and the dates the door is open. A document's key is derived from its
 * name — lowercase, underscores — and kept once saved, because the files
 * families attached are filed under it.
 */
export function CycleEditor({
  years,
  structures,
  cycle,
}: {
  years: Year[];
  structures: Structure[];
  cycle?: CycleView;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [academicYearId, setAcademicYearId] = useState(
    cycle?.academicYearId ??
      years.find((y) => y.isCurrent)?.id ??
      years[0]?.id ??
      "",
  );
  const [name, setName] = useState(cycle?.name ?? "");
  const [grades, setGrades] = useState<GradeDraft[]>(() =>
    cycle?.grades.length
      ? cycle.grades.map((g) => ({
          id: nextId(),
          grade: g.grade,
          seats: String(g.seats),
        }))
      : [{ id: nextId(), grade: "", seats: "" }],
  );
  const [documents, setDocuments] = useState<DocumentDraft[]>(() =>
    (cycle?.documents ?? []).map((d) => ({
      id: nextId(),
      key: d.key,
      name: d.name,
      required: d.required,
    })),
  );
  const [testRequired, setTestRequired] = useState(
    cycle?.testRequired ?? false,
  );
  const [notice, setNotice] = useState(cycle?.notice ?? "");
  const [feeStructureId, setFeeStructureId] = useState(
    cycle?.feeStructureId ?? "",
  );
  const [opensAt, setOpensAt] = useState(cycle?.opensAt ?? "");
  const [closesAt, setClosesAt] = useState(cycle?.closesAt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const patchGrade = (id: string, p: Partial<GradeDraft>) =>
    setGrades((rows) => rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const patchDocument = (id: string, p: Partial<DocumentDraft>) =>
    setDocuments((rows) => rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

  /** Each row's key: the stored one, else derived from the name, made unique across the list. */
  function keysFor(rows: DocumentDraft[]): string[] {
    const taken = new Set<string>();
    return rows.map((row, index) => {
      let key = row.key || documentKeyFrom(row.name);
      if (!key) key = `doc_${index + 1}`;
      let candidate = key;
      for (let n = 2; taken.has(candidate); n += 1)
        candidate = `${key.slice(0, 28)}_${n}`;
      taken.add(candidate);
      return candidate;
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    const needed = t("common.checkTheForm");
    if (!name.trim()) errors.name = needed;
    if (!academicYearId) errors.year = needed;
    const gradeRows = grades.filter((g) => g.grade.trim() || g.seats.trim());
    if (gradeRows.length === 0) errors.grades = t("admissions.refuseNoGrades");
    for (const g of gradeRows) {
      const seats = Number(g.seats);
      if (
        !g.grade.trim() ||
        !Number.isInteger(seats) ||
        seats < 0 ||
        seats > 999
      )
        errors[`grade-${g.id}`] = needed;
    }
    const docRows = documents.filter((d) => d.name.trim());
    if (opensAt && closesAt && closesAt < opensAt)
      errors.closesAt = t("admissions.refuseDates");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(needed);
      return;
    }
    const keys = keysFor(docRows);
    const input: CycleSave = {
      academicYearId,
      name: name.trim().slice(0, 80),
      grades: gradeRows
        .slice(0, 30)
        .map((g) => ({
          grade: g.grade.trim().slice(0, 20),
          seats: Number(g.seats),
        })),
      documents: docRows
        .slice(0, 12)
        .map((d, i) => ({
          key: keys[i]!,
          name: d.name.trim().slice(0, 60),
          required: d.required,
        })),
      testRequired,
      notice: notice.trim().slice(0, 2000),
      feeStructureId: feeStructureId || null,
      opensAt: opensAt || null,
      closesAt: closesAt || null,
    };
    startTransition(async () => {
      const result = await saveCycleAction(input, cycle?.id);
      if (!result.ok) {
        if (result.errorKey === "admissions.refuseNameTaken")
          setFieldErrors({ name: t("admissions.refuseNameTaken") });
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.saved") });
      if (cycle) router.refresh();
      else
        router.push(
          result.id ? `/admin/admissions/${result.id}` : "/admin/admissions",
        );
    });
  }

  const iconButton =
    "grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-fg-muted hover:bg-surface-muted hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40";
  const compact = "[&_input]:min-h-10 [&_input]:py-2";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-6"
      data-testid="cycle-editor"
    >
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <Card>
        <CardHeader
          title={cycle ? t("admissions.editCycle") : t("admissions.newCycle")}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label={t("admissions.cycleName")}
              placeholder={t("admissions.cycleNamePlaceholder")}
              value={name}
              maxLength={80}
              required
              autoComplete="off"
              error={fieldErrors.name}
              onChange={(e) => setName(e.target.value)}
              data-testid="cycle-name"
            />
            <SelectField
              label={t("admissions.year")}
              required
              value={academicYearId}
              error={fieldErrors.year}
              onChange={(e) => setAcademicYearId(e.target.value)}
              data-testid="cycle-year"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </SelectField>
            <DateField
              label={t("admissions.opensAt")}
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
            />
            <DateField
              label={t("admissions.closesAt")}
              value={closesAt}
              error={fieldErrors.closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </div>
          <SelectField
            label={t("admissions.feeStructure")}
            value={feeStructureId}
            onChange={(e) => setFeeStructureId(e.target.value)}
          >
            <option value="">{t("admissions.noFeeStructure")}</option>
            {structures.map((s) => (
              <option key={s.id} value={s.id}>
                {[s.name, s.gradeLevel].filter(Boolean).join(" · ")}
              </option>
            ))}
          </SelectField>
          <CheckboxField
            label={t("admissions.testRequired")}
            description={t("admissions.testRequiredHint")}
            checked={testRequired}
            onChange={(e) => setTestRequired(e.target.checked)}
          />
          <TextAreaField
            label={t("admissions.notice")}
            hint={t("admissions.noticeHint")}
            rows={3}
            value={notice}
            maxLength={2000}
            onChange={(e) => setNotice(e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("admissions.grades")} />
        <CardBody className="space-y-2">
          {fieldErrors.grades && (
            <p role="alert" className="text-xs font-medium text-danger">
              {fieldErrors.grades}
            </p>
          )}
          {grades.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
            >
              <TextField
                label={t("admissions.grade")}
                value={row.grade}
                maxLength={20}
                autoComplete="off"
                error={fieldErrors[`grade-${row.id}`]}
                onChange={(e) => patchGrade(row.id, { grade: e.target.value })}
                className={compact}
              />
              <TextField
                label={t("admissions.seats")}
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                value={row.seats}
                onChange={(e) => patchGrade(row.id, { seats: e.target.value })}
                className={compact}
              />
              <button
                type="button"
                className={iconButton}
                onClick={() =>
                  setGrades((rows) => rows.filter((r) => r.id !== row.id))
                }
                disabled={grades.length === 1}
                aria-label={[t("admissions.removeGrade"), row.grade].join(": ")}
                title={t("admissions.removeGrade")}
              >
                <TrashIcon
                  weight="bold"
                  className="size-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<PlusIcon weight="bold" />}
            disabled={grades.length >= 30}
            onClick={() =>
              setGrades((rows) => [
                ...rows,
                { id: nextId(), grade: "", seats: "" },
              ])
            }
          >
            {t("admissions.addGrade")}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("admissions.documents")} />
        <CardBody className="space-y-2">
          {documents.map((row, index) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto]"
            >
              <TextField
                label={t("admissions.documentName")}
                value={row.name}
                maxLength={60}
                autoComplete="off"
                onChange={(e) =>
                  patchDocument(row.id, { name: e.target.value })
                }
                className={compact}
              />
              <TextField
                label={t("admissions.documentKey")}
                value={
                  row.key || documentKeyFrom(row.name) || `doc_${index + 1}`
                }
                readOnly
                className={`${compact} [&_input]:bg-surface-muted [&_input]:text-fg-muted`}
              />
              <CheckboxField
                label={t("admissions.required")}
                checked={row.required}
                onChange={(e) =>
                  patchDocument(row.id, { required: e.target.checked })
                }
                className="[&_label]:py-2"
              />
              <button
                type="button"
                className={iconButton}
                onClick={() =>
                  setDocuments((rows) => rows.filter((r) => r.id !== row.id))
                }
                aria-label={[t("common.remove"), row.name].join(": ")}
                title={t("common.remove")}
              >
                <TrashIcon
                  weight="bold"
                  className="size-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<PlusIcon weight="bold" />}
            disabled={documents.length >= 12}
            onClick={() =>
              setDocuments((rows) => [
                ...rows,
                { id: nextId(), key: null, name: "", required: true },
              ])
            }
          >
            {t("admissions.addDocument")}
          </Button>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          loading={pending}
          icon={<FloppyDiskIcon weight="bold" />}
          data-testid="cycle-save"
        >
          {t("admissions.save")}
        </Button>
      </div>
    </form>
  );
}
