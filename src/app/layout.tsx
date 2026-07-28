import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { ToastProvider } from "@/components/ui/toast";
import { AppRuntime } from "@/components/app-runtime";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "EduLink — school, home, connected",
    template: "%s · EduLink",
  },
  description:
    "Attendance, assignments, grades and teacher messages for schools, students and parents. Installs as an app and works offline.",
  applicationName: "EduLink",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "EduLink",
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
    title: "EduLink — school, home, connected",
    description: "One calm place for attendance, assignments, grades and school messages.",
    type: "website",
    siteName: "EduLink",
  },
  robots: { index: true, follow: true },
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-safe antialiased">
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-[--radius-md] bg-accent px-4 py-3 font-semibold text-accent-fg shadow-lg"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <AppRuntime />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
