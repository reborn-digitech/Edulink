import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { AssistantConversationView } from "@/components/assistant/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("assistantUi.title") };
}

/** One of the person's conversations (Phase C): the door answers 404 for anyone else's, and the view says it is not here. */
export default async function AssistantConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const [t, session] = await Promise.all([getT(), getSession()]);
  const { conversationId } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("assistantUi.title")} back={{ href: "/assistant", label: t("assistantUi.allConversations") }} />
      <AssistantConversationView id={conversationId} role={session?.role ?? null} />
    </div>
  );
}
