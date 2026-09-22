import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ExamIcon,
  FilesIcon,
  GraduationCapIcon,
  HandshakeIcon,
  StudentIcon,
} from "@phosphor-icons/react/ssr";
import { AccessError, requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { applicationView } from "@/lib/admissions";
import { formatDate, formatDateKey, formatInZone } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import {
  ADMISSION_STATUS_KEY,
  ADMISSION_STATUS_TONE,
  nextStepKey,
  relationKey,
} from "@/components/admissions/labels";
import { DocumentList } from "@/components/admissions/document-upload";
import { RespondButtons, SlotChooser, WithdrawButton } from "./family-steps";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("admissions.myApplications"),
    robots: { index: false, follow: false },
  };
}

const CUID = /^c[a-z0-9]{20,}$/;

/**
 * One of the family's applications: where it stands and what to do next,
 * the documents to attach, the sittings to book from, the offer to answer.
 * The library decides whose it is — a stranger's id is a 404, not a page —
 * and its `can.*` flags decide which step is drawn.
 */
export default async function FamilyApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const ctx = await requireUser();
  if (ctx.role !== "PARENT") redirect("/switch");
  const t = await getT();
  const { applicationId } = await params;
  if (!CUID.test(applicationId)) notFound();
  let view;
  try {
    view = await applicationView(ctx, applicationId);
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const school = await db.school.findUnique({
    where: { id: view.school.id },
    select: { timezone: true },
  });
  const timezone = school?.timezone ?? "UTC";
  const when = (iso: string) => formatDate(new Date(iso), timezone);
  const slotLabel = (slot: NonNullable<typeof view.testSlot>) =>
    [
      `${formatInZone(new Date(slot.startsAt), timezone)} – ${formatInZone(new Date(slot.endsAt), timezone, { timeStyle: "short" })}`,
      slot.location,
    ]
      .filter(Boolean)
      .join(" · ");
  const next = nextStepKey(view.status, {
    documents: view.documentsMissing.length > 0,
    booking: view.can.bookTest && !view.testSlot,
  });
  const dash = "—";

  const detail = (label: string, value: string | null | undefined) => (
    <div key={label}>
      <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="text-sm text-fg">{value || dash}</dd>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/parent/applications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("admissions.myApplications")}
      </Link>
      <PageHeader
        title={view.childName}
        description={[
          view.school.name,
          view.cycle.name,
          view.cycle.academicYearName,
          `${t("admissions.grade")} ${view.gradeApplied}`,
          view.serial,
        ].join(" · ")}
        meta={
          <Badge tone={ADMISSION_STATUS_TONE[view.status]} size="sm">
            {t(ADMISSION_STATUS_KEY[view.status])}
          </Badge>
        }
        actions={
          view.can.withdraw ? (
            <WithdrawButton
              applicationId={view.id}
              childName={view.childName}
            />
          ) : undefined
        }
      />

      <Card
        className={
          view.status === "ADMITTED" ? "border-ok/40 bg-ok-soft" : undefined
        }
      >
        <CardBody className="space-y-2 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("admissions.nextStep")}
          </h2>
          <p className="text-sm font-medium text-fg" data-testid="next-step">
            {t(next)}
          </p>
          {view.status === "ADMITTED" && (
            <Button
              asChild
              size="sm"
              icon={<GraduationCapIcon weight="bold" />}
            >
              <Link href="/parent">{t("parent.overview")}</Link>
            </Button>
          )}
          {view.status === "WITHDRAWN" && view.decidedAt && (
            <p className="text-xs text-fg-muted">
              {t("admissions.withdrawnOn", { date: when(view.decidedAt) })}
            </p>
          )}
        </CardBody>
      </Card>

      {view.status === "OFFERED" && (
        <Card>
          <CardHeader
            icon={<HandshakeIcon weight="duotone" className="size-5" />}
            title={t("admissions.offerTitle")}
            description={[
              view.offeredAt
                ? t("admissions.offeredOn", { date: when(view.offeredAt) })
                : null,
              view.offerExpiresAt
                ? t("admissions.respondBy", { date: when(view.offerExpiresAt) })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <CardBody className="space-y-4">
            {view.offerNote && (
              <p className="whitespace-pre-wrap text-sm text-fg">
                {view.offerNote}
              </p>
            )}
            {view.feeStructureName && (
              <p className="text-sm text-fg-muted">{`${t("admissions.feeStructure")}: ${view.feeStructureName}`}</p>
            )}
            {view.can.respond ? (
              <RespondButtons applicationId={view.id} />
            ) : (
              <p className="text-sm text-fg-muted">
                {t("admissions.refuseOfferExpired")}
              </p>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<FilesIcon weight="duotone" className="size-5" />}
          title={t("admissions.documentsTitle")}
        />
        <CardBody>
          <DocumentList
            applicationId={view.id}
            documents={view.cycle.documents}
            attached={view.documents}
            missing={view.documentsMissing}
            canUpload={view.can.uploadDocuments}
            verifiedAt={view.documentsVerifiedAt}
          />
        </CardBody>
      </Card>

      {view.cycle.testRequired && (
        <Card>
          <CardHeader
            icon={<ExamIcon weight="duotone" className="size-5" />}
            title={t("admissions.testTitle")}
            description={
              view.testedAt
                ? t("admissions.testedOn", { date: when(view.testedAt) })
                : view.testSlot
                  ? slotLabel(view.testSlot)
                  : t("admissions.noSlotBooked")
            }
          />
          <CardBody className="space-y-4">
            {view.testedAt && (
              <dl className="grid gap-3 sm:grid-cols-2">
                {detail(t("admissions.score"), view.testScore)}
                {view.testNote
                  ? detail(t("admissions.testNote"), view.testNote)
                  : null}
              </dl>
            )}
            {view.can.bookTest && (
              <SlotChooser
                applicationId={view.id}
                slots={view.openSlots.map((s) => ({
                  id: s.id,
                  label: slotLabel(s),
                  note: s.note,
                  booked: s.booked,
                  capacity: s.capacity,
                }))}
                bookedId={view.testSlot?.id ?? null}
              />
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<StudentIcon weight="duotone" className="size-5" />}
          title={t("admissions.child")}
          description={t("admissions.appliedOn", {
            date: when(view.createdAt),
          })}
        />
        <CardBody>
          <dl className="grid gap-3 sm:grid-cols-2">
            {detail(t("admissions.childName"), view.childName)}
            {detail(
              t("admissions.childBirthdate"),
              view.childBirthdate
                ? formatDateKey(view.childBirthdate, {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                  })
                : null,
            )}
            {detail(t("admissions.gradeApplied"), view.gradeApplied)}
            {detail(t("admissions.previousSchool"), view.previousSchool)}
            {view.penNumber && detail(t("pupilRecord.penNumber"), view.penNumber)}
            {detail(t("admissions.address"), view.addressLine)}
            {detail(t("admissions.city"), view.city)}
            {detail(t("admissions.applicantName"), view.applicantName)}
            {detail(t("admissions.relation"), t(relationKey(view.relation)))}
          </dl>
          {view.note && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-fg-muted">
              {view.note}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
