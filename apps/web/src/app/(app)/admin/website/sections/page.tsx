import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT, getLocale } from "@/lib/i18n/server";
import { loadSite, sitePostChoices } from "@/lib/site-admin";
import { gatherSiteData } from "@/lib/site-publish";
import { isModuleOn } from "@/lib/modules";
import { formatInZone } from "@/lib/dates";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SectionsForm } from "./sections-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: [t("website.stepSections"), t("website.title")].join(" · ") };
}

/**
 * Screen 3, Sections: which parts the site carries and in what order, each a switch with a line saying what it
 * shows; the numbers one by one with today's value; the admissions words and form; up to twelve posts for News
 * and the pictures for the Gallery, each picture only with the consent tick.
 */
export default async function WebsiteSectionsPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const view = await loadSite(ctx);
  const [data, posts, admissionsOn, school] = await Promise.all([
    gatherSiteData(ctx.schoolId, { ...view.config, sections: view.config.sections.map((s) => ({ ...s, on: true })), principalNamed: false }),
    sitePostChoices(ctx),
    isModuleOn(ctx.schoolId, "ADMISSIONS"),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);
  const values = Object.fromEntries(
    data.numbers.map((n) => [n.metric, n.kind === "percent" ? `${n.value}%` : n.kind === "rupees" ? `₹${n.value.toLocaleString("en-IN")}` : String(n.value)]),
  );
  return (
    <Card>
      <CardHeader title={t("website.sectionsTitle")} description={t("website.sectionsIntro")} />
      <CardBody>
        <SectionsForm
          initial={{ sections: view.config.sections, metrics: view.config.metrics, admissionsText: view.config.admissionsText, enquiryForm: view.config.enquiryForm, newsPostIds: view.config.newsPostIds, gallery: view.config.gallery.map((g) => ({ postId: g.postId, fileId: g.fileId, consent: g.consent })) }}
          college={view.school.kind === "COLLEGE" || view.school.kind === "AUTONOMOUS_COLLEGE"}
          values={values}
          facultyCount={data.faculty.length}
          disclosurePublished={data.disclosurePublished}
          admissionsOn={admissionsOn}
          posts={posts.map((p) => ({ id: p.id, title: p.title, day: formatInZone(p.createdAt, school.timezone, { dateStyle: "medium" }, locale), images: p.images }))}
        />
      </CardBody>
    </Card>
  );
}
