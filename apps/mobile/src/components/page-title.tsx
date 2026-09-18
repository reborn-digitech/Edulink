import Head from "expo-router/head";

/**
 * The document title on the web target: what a browser tab, a history entry
 * and a screen reader announce. The phone's twin beside this file renders
 * nothing — a native screen has no document.
 */
export function PageTitle({ title }: { title?: string }) {
  return (
    <Head>
      <title>{title ? `${title} · Relay` : "Relay"}</title>
    </Head>
  );
}
