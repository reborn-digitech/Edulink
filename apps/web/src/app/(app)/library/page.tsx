import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { ModuleRoleHome } from "@/components/module-role-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.libraryName") };
}

/** The LIBRARIAN home (3 Oct 2026): the module's own screens arrive with its builder; until then, on or off. */
export default async function Page() {
  return <ModuleRoleHome role="LIBRARIAN" />;
}
