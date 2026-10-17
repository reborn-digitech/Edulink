import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Loading } from "@/components";
import { useVidura } from "@/screens/shared/vidura";

/**
 * Not a screen since Vidura pass 1 (17 Oct 2026): the one entry point is the round button, and the history lives in
 * its sheet. An old link to /(app)/assistant (with a conversation's `id`, or none) opens the sheet over the home tab.
 */
export default function Route() {
  const router = useRouter();
  const { open } = useVidura();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" && params.id ? params.id : null;
  useEffect(() => {
    router.replace("/(app)" as never);
    open(id);
  }, [id, open, router]);
  return <Loading />;
}
