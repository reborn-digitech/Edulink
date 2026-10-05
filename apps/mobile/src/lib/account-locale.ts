import { useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

/**
 * A language chosen in the app goes to the account as well as the phone (B-24, campaign 2026-10-04; A3-states-16,
 * risks batch 5 Oct 2026): the server answers in `prefs.locale`, the web and Practice read it, and a new phone signed
 * in to the same account takes it (lib/session.tsx). Then every screen reads afresh, in the new language.
 * Signed-in screens pass this to LanguageRow's `onChosen`; the sign-in screen has no account to write to.
 * `refresh: false` (a quiz, whose reads already carry the language) writes without reading every screen again.
 */
export function useSaveLocaleToAccount({ refresh = true }: { refresh?: boolean } = {}): (code: string) => void {
  const qc = useQueryClient();
  return (code) =>
    void api()
      .post("/api/v1/account/locale", { locale: code })
      .then((r) => {
        if (r.ok && refresh) void qc.invalidateQueries();
      })
      .catch(() => undefined);
}
