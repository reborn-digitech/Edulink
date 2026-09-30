import type { Metadata } from "next";
import { SignaturesScreen } from "@/components/certificates/signatures-screen";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("signatures.title"), robots: { index: false, follow: false } };
}

/** A teacher's signature, and the sets of report cards of their classes that wait for it. */
export default function TeacherSignaturesPage() {
  return <SignaturesScreen roles={["TEACHER"]} intro="signatures.teacherIntro" />;
}
