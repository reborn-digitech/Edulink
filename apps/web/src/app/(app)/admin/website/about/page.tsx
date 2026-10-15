import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { loadSite } from "@/lib/site-admin";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AboutForm } from "./about-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: [t("website.stepAbout"), t("website.title")].join(" · ") };
}

/** Screen 2, About: the school's own words and how to reach it, prefilled from what the school already entered. */
export default async function WebsiteAboutPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await loadSite(ctx);
  const head = await db.membership.findFirst({ where: { schoolId: ctx.schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, orderBy: { joinedAt: "asc" }, select: { user: { select: { name: true } } } });
  const c = view.config;
  return (
    <Card>
      <CardHeader title={t("website.aboutTitle")} description={t("website.aboutIntro")} />
      <CardBody>
        <AboutForm
          schoolName={view.school.name}
          principalName={head?.user.name ?? null}
          canName={ctx.role === "PRINCIPAL"}
          initial={{ motto: c.motto, about: c.about, address: c.address, phones: c.phones, email: c.email, mapUrl: c.mapUrl, hours: c.hours, board: c.board, foundedYear: c.foundedYear, principalMessage: c.principalMessage, principalNamed: c.principalNamed }}
        />
      </CardBody>
    </Card>
  );
}
