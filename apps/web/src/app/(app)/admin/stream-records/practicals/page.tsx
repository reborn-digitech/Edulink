import type { Metadata } from "next";
import { PracticalsPage } from "@/components/stream-records/practicals-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("streamRecords.practicals.title") };
}

/** The practical record (stream records, 5 Oct 2026): components/stream-records/practicals-page.tsx draws it. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <PracticalsPage roles={["ADMIN", "PRINCIPAL"]} base="/admin/stream-records/practicals" searchParams={searchParams} back={{ href: "/admin/stream-records", labelKey: "streamRecords.title" }} />;
}
