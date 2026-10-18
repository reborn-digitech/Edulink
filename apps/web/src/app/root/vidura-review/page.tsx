import { requireSuperuser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { ViduraReviewPage } from "@/components/vidura-review/review-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("viduraReview.title") };
}

/** The guide's Hindi and Marathi renderings for the operator to approve, correct or reject (Vidura pass 2). */
export default async function RootViduraReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSuperuser();
  return <ViduraReviewPage session={session} base="/root/vidura-review" searchParams={searchParams} />;
}
