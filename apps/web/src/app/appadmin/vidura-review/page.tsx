import { requireAppAdmin } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { ViduraReviewPage } from "@/components/vidura-review/review-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("viduraReview.title") };
}

/** The guide's Hindi and Marathi renderings, read by the content team; the operator acts on them at /root/vidura-review (Vidura pass 2). */
export default async function AppAdminViduraReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAppAdmin();
  return <ViduraReviewPage session={session} base="/appadmin/vidura-review" searchParams={searchParams} />;
}
