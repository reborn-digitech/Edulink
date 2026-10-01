import Head from "expo-router/head";
import { useT } from "@/lib/i18n";

/**
 * The document title on the web target: what a browser tab, a history entry
 * and a screen reader announce. The phone's twin beside this file renders
 * nothing — a native screen has no document.
 */
export function PageTitle({ title }: { title?: string }) {
  const name = useT()("brand.name");
  return (
    <Head>
      <title>{title ? `${title} · ${name}` : name}</title>
    </Head>
  );
}
