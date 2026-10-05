import Link from "next/link";
import { UsersThreeIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listAppAdmins } from "@/lib/superuser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { AppointForm, DismissButton } from "./controls";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.contentTeam") };
}

/**
 * The operator appoints the content team.
 *
 * This page is a LIST AND A FLAG, on purpose. There is no invite token and no
 * half-created account: the person registers through the ordinary flow, and
 * the operator flips the flag on the account that exists — the same order the
 * CLI imposes, now with a page. See appointAppAdmin in superuser.ts for why.
 */
export default async function ContentTeamPage() {
  const t = await getT();
  const session = await requireSuperuser();
  const admins = await listAppAdmins(session);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("root.contentTeam")}
          </h1>
        </div>
        <Button asChild variant="outline" icon={<ArrowSquareOutIcon weight="bold" />}>
          <Link href="/appadmin">{t("root.contentTeamOpenArea")}</Link>
        </Button>
      </div>

      <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {t("root.contentTeamIntro")}
      </p>

      {admins.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title={t("root.contentTeamNobody")}
          description={t("root.contentTeamAppointHint")}
        />
      ) : (
        <ul className="space-y-2">
          {admins.map((admin) => (
            <li key={admin.id}>
              <Card className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">
                    {admin.name}
                    {admin.id === session.user.id && (
                      <span className="ml-2 text-xs font-normal text-fg-muted">
                        ({t("root.contentTeamYou")})
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-fg-muted">{admin.email ?? "—"}</p>
                </div>
                {admin.isSuperuser && <Badge tone="info">{t("root.contentTeamOperatorBadge")}</Badge>}
                {admin.disabledAt && <Badge tone="warn">{t("root.contentTeamDisabledBadge")}</Badge>}
                <DismissButton userId={admin.id} name={admin.name} />
              </Card>
            </li>
          ))}
        </ul>
      )}

      <AppointForm />
    </div>
  );
}
