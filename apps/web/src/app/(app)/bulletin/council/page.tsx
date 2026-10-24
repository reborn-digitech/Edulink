import type { Metadata } from "next";
import Link from "next/link";
import { MegaphoneIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { ModuleFlash } from "@/components/module-flash";
import { requireRole } from "@/lib/tenancy";
import { councilView } from "@/lib/council-notices";
import { listFeed } from "@/lib/bulletin";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { postCouncilNoticeAction, saveCouncilAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("councilNotices.title") };
}

/**
 * The student council (risks batch 5A, 5 Oct 2026): who is on it, its notices
 * on the bulletin, a notice signed by the council for a member or the office,
 * and the office naming the council and its members by student code.
 */
export default async function CouncilPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // The reader's language, not English under a Hindi or Marathi page (QA-20).
  const relativeTime = await getRelativeTime();
  const ctx = await requireRole("STUDENT", "ADMIN", "PRINCIPAL");
  const t = await getT();
  const sp = await searchParams;
  const [view, notices] = await Promise.all([councilView(ctx), listFeed(ctx, { category: "COUNCIL" })]);
  const office = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL";
  return (
    <div className="space-y-6">
      <PageHeader title={view.council?.name ?? t("councilNotices.title")} description={t("councilNotices.intro")} />
      <ModuleFlash t={t} params={sp} />
      <Card>
        <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("councilNotices.membersTitle")} />
        <CardBody>
          {!view.council ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("councilNotices.noCouncil")} description={view.canKeep ? t("councilNotices.noCouncilOffice") : t("councilNotices.noCouncilBody")} />
          ) : view.council.members.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("councilNotices.noMembers")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {view.council.members.map((m) => (
                <li key={m.membershipId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-medium text-fg">{m.name}</span>
                  <span className="text-fg-muted">{[m.role, m.className].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      {view.canPost ? (
        <Card>
          <CardHeader icon={<MegaphoneIcon weight="duotone" className="size-5" />} title={t("councilNotices.postTitle")} description={office ? t("councilNotices.postBodyOffice") : t("councilNotices.postBodyStudent")} />
          <CardBody>
            <form action={postCouncilNoticeAction} className="grid gap-4">
              <TextField label={t("councilNotices.fieldTitle")} name="title" required minLength={2} maxLength={200} />
              <TextAreaField label={t("councilNotices.fieldBody")} name="body" rows={5} maxLength={20000} />
              {office ? (
                <SelectField label={t("councilNotices.fieldAudience")} name="audience" defaultValue="ALL">
                  <option value="ALL">{t("councilNotices.audienceAll")}</option>
                  <option value="STUDENTS">{t("councilNotices.audienceStudents")}</option>
                  <option value="PARENTS">{t("councilNotices.audienceParents")}</option>
                  <option value="TEACHERS">{t("councilNotices.audienceTeachers")}</option>
                </SelectField>
              ) : null}
              <div>
                <Button type="submit">{office ? t("councilNotices.postNow") : t("councilNotices.sendForReview")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader icon={<MegaphoneIcon weight="duotone" className="size-5" />} title={t("councilNotices.noticesTitle")} />
        <CardBody>
          {notices.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("councilNotices.noNotices")} description={t("councilNotices.noNoticesBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link href={`/bulletin/${n.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3 hover:bg-surface-muted/60">
                    <span className="min-w-0">
                      <span className="block font-semibold text-fg">{n.title}</span>
                      <span className="block text-xs text-fg-muted">{`${n.authorName} · ${relativeTime(n.createdAt)}`}</span>
                    </span>
                    {n.status === "PENDING" ? <Badge tone="warn" size="sm">{t("councilNotices.waitingReview")}</Badge> : n.status === "REJECTED" ? <Badge tone="danger" size="sm">{t("councilNotices.notPublished")}</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      {view.canKeep ? (
        <Card>
          <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("councilNotices.keepTitle")} description={t("councilNotices.keepBody")} />
          <CardBody>
            <form action={saveCouncilAction} className="grid gap-4">
              <TextField label={t("councilNotices.fieldName")} name="name" required minLength={3} maxLength={120} defaultValue={view.council?.name ?? t("councilNotices.defaultName")} />
              <TextAreaField label={t("councilNotices.fieldMembers")} name="members" rows={6} required hint={t("councilNotices.fieldMembersHint")} />
              <div>
                <Button type="submit" variant="secondary">{t("councilNotices.saveCouncil")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
