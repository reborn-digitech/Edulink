import type { Metadata } from "next";
import { ExamIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { dateSheetsFor } from "@/lib/exams";
import { formatDateKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("exams.sheetTitle") };
}

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * The date sheet, for whoever is looking: a pupil sees their own grade's
 * papers, a guardian sees each child's, staff see every published sheet.
 */
export default async function ExamsPage() {
  const session = await requireUser();
  const t = await getT();
  const sheets = await dateSheetsFor(session);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("exams.sheetTitle")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("exams.sheetIntro")}</p>
      </div>

      {sheets.length === 0 ? (
        <EmptyState
          icon={<ExamIcon weight="duotone" className="size-8" />}
          title={t("exams.sheetEmptyTitle")}
          description={t("exams.sheetEmptyBody")}
        />
      ) : (
        sheets.map((sheet) => (
          <Card key={sheet.id}>
            <CardHeader
              icon={<ExamIcon weight="duotone" className="size-5" />}
              title={`${sheet.name} · ${t("practice.classN", { n: sheet.gradeLevel })}`}
            />
            <CardBody className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="px-4 py-2 font-medium">{t("exams.colDay")}</th>
                    <th className="px-4 py-2 font-medium">{t("exams.colSubject")}</th>
                    <th className="px-4 py-2 font-medium">{t("exams.colTime")}</th>
                    <th className="px-4 py-2 text-right font-medium">{t("exams.colMaxMarks")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.slots.map((slot) => (
                    <tr key={slot.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2.5 text-fg">{formatDateKey(slot.dateKey)}</td>
                      <td className="px-4 py-2.5 font-medium text-fg">{slot.subject}</td>
                      <td className="px-4 py-2.5 text-fg-muted">
                        {slot.startMinute !== null
                          ? `${hhmm(slot.startMinute)}${slot.endMinute !== null ? `–${hhmm(slot.endMinute)}` : ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-fg">{slot.maxMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
