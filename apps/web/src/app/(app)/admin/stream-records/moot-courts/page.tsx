import type { Metadata } from "next";
import { MootCourtsPage } from "@/components/stream-records/moot-courts-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("streamRecords.moots.title") };
}

/** Moot courts for the office and the head (5 Oct 2026): components/stream-records/moot-courts-page.tsx draws it. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <MootCourtsPage roles={["ADMIN", "PRINCIPAL"]} base="/admin/stream-records/moot-courts" back={{ href: "/admin/stream-records", labelKey: "streamRecords.title" }} searchParams={searchParams} />;
}
