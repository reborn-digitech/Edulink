import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { AssistantHome } from "@/components/assistant/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("assistantUi.title") };
}

/**
 * The assistant's page (Phase C, 10 Oct 2026): a new conversation and the person's own of the last thirty days. Every
 * role's menu has it behind the ASSISTANT module (lib/nav.ts); the (app) layout has already asked for a session, and
 * what the person may do here is the doors' to say (GET /api/v1/assistant: the module, the platform's switch, a
 * guardian's opt-out, the caps), read by the client so the web and the phone are answered by the same code.
 */
export default async function AssistantPage() {
  const [t, session] = await Promise.all([getT(), getSession()]);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("assistantUi.title")} description={t("assistantUi.intro")} />
      <AssistantHome role={session?.role ?? null} />
    </div>
  );
}
