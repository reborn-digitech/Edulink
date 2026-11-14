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
 * of truth: when somebody is signed in, the root layout writes their saved
 * appearance into this script, which applies it and copies it into
 * localStorage (TA-392). Before, nothing did, so high contrast or the readable
 * font chosen at home was never applied on the staff-room computer or a new
 * phone, while /account showed it as chosen.
 */
export type AccountAppearance = { theme?: string; contrast?: string; font?: string; motion?: string };

const ALLOWED: Record<keyof AccountAppearance, readonly string[]> = {
  theme: ["light", "dark", "system"],
  contrast: ["normal", "high"],
  font: ["default", "dyslexic"],
  motion: ["full", "reduced", "system"],
};

/** The account's appearance as a JSON literal for the inline script: only the known values, nothing that could end the script. */
export function accountAppearanceLiteral(account: AccountAppearance | null | undefined): string {
  if (!account) return "null";
  const picked: Record<string, string> = {};
  for (const key of Object.keys(ALLOWED) as (keyof AccountAppearance)[]) {
    const value = account[key];
    if (typeof value === "string" && ALLOWED[key].includes(value)) picked[key] = value;
  }
  return JSON.stringify(picked).replace(/</g, "\\u003c");
}

const script = (account: string) => `
(function () {
  try {
    var root = document.documentElement;
    var raw = localStorage.getItem('edulink.appearance');
    var prefs = raw ? JSON.parse(raw) : {};
    var account = ${account};
    if (account) {
      for (var key in account) prefs[key] = account[key];
      try { localStorage.setItem('edulink.appearance', JSON.stringify(prefs)); } catch (e) {}
    }

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

    // Keep the Android status bar in step with the live theme: the page in dark, the navy top bar in light.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0e15' : '#141924');
  } catch (e) {
    // A blocked/full localStorage must never stop the app rendering.
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

/** The nonce is this response's, from the middleware: the policy lets no inline script run without it. */
export function ThemeScript({ nonce, account }: { nonce?: string; account?: AccountAppearance | null }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script(accountAppearanceLiteral(account)) }} suppressHydrationWarning />;
}
