import { useState } from "react";
import { View } from "react-native";
import type { z } from "zod";
import type { AdmissionStatus, ApplicationView, applicationRowSchema, entranceSlotSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Text } from "@/components";
import { PickError, pickAndUpload } from "@/lib/pick-file";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateKey, formatInstant, Pill } from "../family/shared";

/**
 * What the office's application and the family's application share: the
 * stage as a pill in its colour, the next step a row implies, the child's
 * and the applicant's details, the cycle's document list with what is
 * attached against it and the Attach/Replace buttons that go through the
 * phone's picker, and a sitting written as one line.
 */
export type ApplicationRow = z.infer<typeof applicationRowSchema>;
export type EntranceSlot = z.infer<typeof entranceSlotSchema>;
export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export const STAGE: Record<AdmissionStatus, { key: TranslationKey; tone: "muted" | "ok" | "warn" | "danger" | "accent" }> = {
  SUBMITTED: { key: "admissions.statusSubmitted", tone: "accent" },
  OFFERED: { key: "admissions.statusOffered", tone: "warn" },
  ACCEPTED: { key: "admissions.statusAccepted", tone: "ok" },
  ADMITTED: { key: "admissions.statusAdmitted", tone: "ok" },
  DECLINED: { key: "admissions.statusDeclined", tone: "danger" },
  WAITLISTED: { key: "admissions.statusWaitlisted", tone: "muted" },
  WITHDRAWN: { key: "admissions.statusWithdrawn", tone: "muted" },
};
export const STATUSES: AdmissionStatus[] = ["SUBMITTED", "OFFERED", "ACCEPTED", "ADMITTED", "DECLINED", "WAITLISTED", "WITHDRAWN"];

export function StagePill({ status }: { status: AdmissionStatus }) {
  const t = useT();
  return <Pill label={t(STAGE[status].key)} tone={STAGE[status].tone} />;
}

/** The family's next step from a list row: documents first, then the sitting, then the school's answer. */
export function nextStepKey(row: { status: AdmissionStatus; documentsMissing: number; testBooked: boolean }): TranslationKey {
  switch (row.status) {
    case "SUBMITTED":
      return row.documentsMissing > 0 ? "admissions.nextDocuments" : !row.testBooked ? "admissions.nextBook" : "admissions.nextWait";
    case "OFFERED":
      return "admissions.nextRespond";
    case "ADMITTED":
      return "admissions.nextAdmitted";
    case "ACCEPTED":
      return "admissions.nextWait";
    default:
      return "admissions.nextSettled";
  }
}

/** The same from the whole application, which knows whether the cycle has a test at all. */
export function nextStepFor(a: ApplicationView): TranslationKey {
  if (a.status === "SUBMITTED") {
    if (a.documentsMissing.length > 0) return "admissions.nextDocuments";
    if (a.cycle.testRequired && !a.testSlot && !a.testedAt) return "admissions.nextBook";
    return "admissions.nextWait";
  }
  return nextStepKey({ status: a.status, documentsMissing: a.documentsMissing.length, testBooked: Boolean(a.testSlot) });
}

/** "15 Jan, 10:00 – 10:30 · Room 4", in the reader's language. */
export function slotLine(slot: EntranceSlot, locale: string): string {
  const start = formatInstant(slot.startsAt, locale);
  const end = formatInstant(slot.endsAt, locale, { hour: "numeric", minute: "2-digit" });
  return [`${start} – ${end}`, slot.location].filter(Boolean).join(" · ");
}

/** "340 KB", "1.2 MB". */
export function fileSize(bytes: number): string {
  return bytes < 1_048_576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function relationLabel(t: Translate, relation: string): string {
  const key = ({ PARENT: "admissions.relationParent", GUARDIAN: "admissions.relationGuardian", OTHER: "admissions.relationOther" } as Record<string, TranslationKey>)[relation];
  return key ? t(key) : relation;
}

/** A label over its value; a blank value is a dash. */
export function Line({ label, value }: { label: string; value: string | null | undefined }) {
  const th = useTheme();
  return (
    <View style={{ gap: 1, paddingVertical: th.space[1] }}>
      <Text variant="xs" tone="subtle" bold>
        {label}
      </Text>
      <Text variant="base" tone={value ? "fg" : "muted"}>
        {value || "—"}
      </Text>
    </View>
  );
}

/** The child and the applicant, as the form had them. */
export function DetailsCard({ a }: { a: ApplicationView }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <Card title={t("admissions.child")}>
      <Text variant="xs" tone="muted">
        {[a.serial, `${t("admissions.gradeApplied")} ${a.gradeApplied}`, a.cycle.name, a.cycle.academicYearName].join(" · ")}
      </Text>
      <Line label={t("admissions.childName")} value={a.childName} />
      <Line label={t("admissions.childBirthdate")} value={a.childBirthdate ? formatDateKey(a.childBirthdate, locale) : null} />
      <Line label={t("admissions.previousSchool")} value={a.previousSchool} />
      <Line label={t("admissions.address")} value={[a.addressLine, a.city].filter(Boolean).join(", ")} />
      {a.note ? <Line label={t("admissions.note")} value={a.note} /> : null}
      <Line label={t("admissions.applicantName")} value={`${a.applicantName} · ${relationLabel(t, a.relation)}`} />
      <Line label={t("admissions.applicantPhone")} value={a.applicantPhone} />
      <Line label={t("admissions.applicantEmail")} value={a.applicantEmail} />
    </Card>
  );
}

/**
 * The cycle's document list against what is attached. Attach or Replace
 * opens the phone's picker, uploads, and hands the ticket up as one
 * document to post; the caller owns the request and the refreshed view.
 */
export function DocumentsCard({
  a,
  canUpload,
  onAttach,
  verify,
}: {
  a: ApplicationView;
  canUpload: boolean;
  onAttach: (doc: { key: string; fileId: string; name: string }) => Promise<unknown>;
  verify?: { can: boolean; busy: boolean; onVerify: () => void };
}) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const attached = new Map(a.documents.map((d) => [d.key, d]));
  const missingNames = a.documentsMissing.map((key) => a.cycle.documents.find((d) => d.key === key)?.name ?? key);
  const pick = async (key: string) => {
    setProblem(null);
    setBusyKey(key);
    try {
      const picked = await pickAndUpload("document", t("common.somethingWrong"));
      if (picked) await onAttach({ key, fileId: picked.fileId, name: picked.name });
    } catch (e) {
      setProblem(e instanceof PickError || e instanceof Error ? e.message : t("common.somethingWrong"));
    } finally {
      setBusyKey(null);
    }
  };
  if (a.cycle.documents.length === 0) return null;
  return (
    <Card title={t("admissions.documentsTitle")}>
      <Text variant="sm" tone={missingNames.length > 0 ? "warn" : "ok"}>
        {missingNames.length > 0 ? t("admissions.documentsMissing", { names: missingNames.join(", ") }) : t("admissions.documentsComplete")}
      </Text>
      {a.documentsVerifiedAt ? (
        <Text variant="sm" tone="ok" bold>
          {t("admissions.verifiedOn", { date: formatDateKey(a.documentsVerifiedAt.slice(0, 10), locale) })}
        </Text>
      ) : null}
      {problem ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {problem}
        </Text>
      ) : null}
      {a.cycle.documents.map((def) => {
        const file = attached.get(def.key);
        return (
          <View key={def.key} style={{ flexDirection: "row", alignItems: "center", gap: th.space[3], paddingVertical: th.space[1] }}>
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="base" bold>
                {def.name}
              </Text>
              <Text variant="sm" tone={file ? "muted" : "subtle"}>
                {file ? `${file.name} · ${fileSize(file.size)}` : def.required ? t("admissions.required") : t("admissions.optional")}
              </Text>
            </View>
            {canUpload ? <Button label={file ? t("admissions.replace") : t("admissions.upload")} variant="secondary" busy={busyKey === def.key} disabled={busyKey !== null && busyKey !== def.key} onPress={() => void pick(def.key)} /> : null}
          </View>
        );
      })}
      {verify?.can ? <Button label={t("admissions.verify")} busy={verify.busy} onPress={verify.onVerify} /> : null}
    </Card>
  );
}
