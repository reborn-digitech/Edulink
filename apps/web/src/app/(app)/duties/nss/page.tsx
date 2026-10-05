import type { Metadata } from "next";
import { CorpsPage } from "@/components/stream-records/corps-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.corps.nssTitle") };
}

/** The NSS officer's desk (5 Oct 2026): components/stream-records/corps-page.tsx draws it. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CorpsPage corps="NSS" searchParams={searchParams} />;
}
