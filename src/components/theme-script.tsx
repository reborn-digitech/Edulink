/**
 * Applies the saved appearance settings before first paint.
 *
 * This must be a blocking inline script in <head>. Anything that runs after
 * hydration produces a white flash for dark-mode users — which for a child
 * opening the app at 7am in a dark room is a genuinely unpleasant experience,
 * not a cosmetic nit.
 *
 * Reads from localStorage (instant, no round-trip) and falls back to the OS
 * preference. The server-side copy in the user's `prefs` column is the source
 * of truth and is synced into localStorage after login.
 */
const script = `
(function () {
  try {
    var root = document.documentElement;
    var raw = localStorage.getItem('edulink.appearance');
    var prefs = raw ? JSON.parse(raw) : {};

    var theme = prefs.theme || 'system';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-contrast', prefs.contrast || 'normal');
    root.setAttribute('data-font', prefs.font || 'default');

    var motion = prefs.motion;
    if (!motion || motion === 'system') {
      motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
    }
    root.setAttribute('data-motion', motion);

    if (prefs.role) root.setAttribute('data-role', prefs.role);
    if (prefs.brand) root.style.setProperty('--accent', prefs.brand);

    // Lets CSS and JS react to running as an installed app.
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      root.setAttribute('data-standalone', 'true');
    }

    // Keep the Android status bar in step with the live theme.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0e15' : '#2563eb');
  } catch (e) {
    // A blocked/full localStorage must never stop the app rendering.
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
