import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { NONCE_HEADER } from "@/lib/csp";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { ToastProvider } from "@/components/ui/toast";
import { AppRuntime } from "@/components/app-runtime";
import { I18nProvider } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  metadataBase: new URL(APP_URL),
  title: {
    default: t("meta.tagline"),
    template: "%s · Relay",
  },
  description: t("meta.appDescription"),
  applicationName: "Relay",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: t("meta.eduLink"),
    // "default" keeps the status bar legible against the themed header; black
    // -translucent would put the clock on top of our own content.
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: t("meta.tagline"),
    description: t("meta.ogDescription"),
    type: "website",
    siteName: "Relay",
  },
  robots: { index: true, follow: true },
};
}

export const viewport: Viewport = {
  // viewportFit: "cover" is what makes env(safe-area-inset-*) non-zero; without
  // it the bottom nav sits under the iPhone home indicator.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Deliberately NOT capping maximumScale — blocking pinch-zoom fails WCAG
  // 1.4.4 and is exactly the sort of thing low-vision users need. (§6)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e15" },
  ],
};

/**
 * ASYNC, so `<html lang>` is right in the markup that leaves the server.
 *
 * A wrong `lang` is not cosmetic: it is what a screen reader consults to choose
 * a voice, and it is what a browser consults to hyphenate and to offer to
 * translate. Devanagari announced by an English voice is unusable, so this is
 * one of the few strings that has to be correct before hydration rather than
 * after — which is why the locale is mirrored into a cookie the resolver can
 * read without a session. (§6)
 *
 * The provider sits at the ROOT rather than inside `(app)`, so the login page,
 * the join flow and an invite landing get `t` as well. Those are the pages a
 * parent sees before any account exists.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript nonce={(await headers()).get(NONCE_HEADER) ?? undefined} />
      </head>
      {/* suppressHydrationWarning for the BODY ATTRIBUTES only (it does not
          cascade): browser extensions — Grammarly stamps data-gr-ext-installed
          and friends — rewrite <body> before React hydrates, and the mismatch
          is theirs, not ours. Children still warn like they should. */}
      <body className="min-h-safe antialiased" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-[--radius-md] bg-accent px-4 py-3 font-semibold text-accent-fg shadow-lg"
        >
          {t("shell.skipToContent")}
        </a>
        <I18nProvider locale={locale} dictionary={dictionaryFor(locale)}>
          <ToastProvider>
            <AppRuntime />
            {children}
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
