import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { loadSite } from "@/lib/site-admin";
import { FONTS } from "@/lib/fonts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LookForm } from "./look-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: [t("website.stepLook"), t("website.title")].join(" · ") };
}

/** Screen 1, Look: a template, a colour (the logo's nearest by default), a face, the site's language. */
export default async function WebsiteLookPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await loadSite(ctx);
  const c = view.config;
  return (
    <Card>
      <CardHeader title={t("website.lookTitle")} description={t("website.lookIntro")} />
      <CardBody>
        <LookForm
          initial={{ template: c.template, colour: c.colour, font: c.font, language: c.language, offerOtherLanguages: c.offerOtherLanguages }}
          fonts={FONTS.map((f) => ({ key: f.key, family: f.family, devanagari: f.scripts.includes("devanagari") }))}
          hasLogo={Boolean(view.school.logoFileId)}
        />
      </CardBody>
    </Card>
  );
}
