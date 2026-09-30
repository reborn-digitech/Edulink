import type { Metadata } from "next";
import { SignaturesScreen } from "@/components/certificates/signatures-screen";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("signatures.title"), robots: { index: false, follow: false } };
}

/** The signatures page of an admin and of the head. */
export default function SignaturesPage() {
  return <SignaturesScreen roles={["ADMIN", "PRINCIPAL"]} intro="signatures.intro" />;
}
