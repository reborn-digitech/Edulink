import type { MetadataRoute } from "next";

/**
 * Web App Manifest. Served at /manifest.webmanifest by Next's metadata route.
 *
 * `display: "standalone"` is what removes the address bar on Android; the
 * install prompt will not fire without it, an icon set including a 512px
 * maskable, a start_url within scope, and HTTPS (localhost is exempt).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduLink — school, home, connected",
    short_name: "EduLink",
    description:
      "Attendance, assignments, grades and teacher messages for schools, students and parents. Works offline.",
    id: "/",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    // Chrome falls back down this list, so a desktop install gets a window
    // with minimal chrome rather than the browser tab strip.
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    theme_color: "#2563eb",
    background_color: "#f6f7fb",
    lang: "en",
    dir: "ltr",
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the home-screen icon to jump straight into a daily task.
    shortcuts: [
      {
        name: "Take attendance",
        short_name: "Attendance",
        description: "Mark today's register for your class",
        url: "/teacher/attendance?source=shortcut",
        icons: [{ src: "/icons/shortcut-attendance.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "New assignment",
        short_name: "Assignment",
        description: "Post an assignment to a class",
        url: "/teacher/assignments/new?source=shortcut",
        icons: [{ src: "/icons/shortcut-assignment.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Messages",
        short_name: "Messages",
        description: "Open teacher and parent conversations",
        url: "/remarks?source=shortcut",
        icons: [{ src: "/icons/shortcut-remark.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
