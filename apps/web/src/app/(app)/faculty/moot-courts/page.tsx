import type { Metadata } from "next";
import { MootCourtsPage } from "@/components/stream-records/moot-courts-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("streamRecords.moots.title") };
}

/**
 * A law college's moot courts for a faculty member or an HOD (A3-inventory-4, audit of 5 Oct 2026): the door and the
 * library let them record one, and the office's page was the only one. Corrections are the author's, the office's or
 * the law department's HOD's (stream-records.ts). components/stream-records/moot-courts-page.tsx draws it.
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <MootCourtsPage roles={["FACULTY", "HOD"]} base="/faculty/moot-courts" searchParams={searchParams} />;
}
