/**
 * The most a server action's request may carry (TA-134): next.config.ts writes the same number ("6mb", held to this by
 * tests/ta-web-shell-ui-forms.test.ts), and the forms that send files through an action read it. Next refuses a bigger body (413) before the action runs, and the person saw a generic failure, so
 * a form that can hold more checks the total itself and says so in words.
 *
 * Six megabytes: one file at the library's cap (MAX_UPLOAD_BYTES and the file picker's 5 MB, a site file's 5 MB, the
 * sealed question paper's 2 MB of TA-301) and the form around it. More than one large file, or a video, does not fit
 * a server action; the phone sends those through the ticketed upload door (/api/v1/uploads).
 *
 * A plain module (no "use client", no server-only).
 */
export const ACTION_BODY_LIMIT_MB = 6;
export const ACTION_BODY_LIMIT_BYTES = ACTION_BODY_LIMIT_MB * 1024 * 1024;
/** What the files of one action may add up to, leaving room for the rest of the form. */
export const ACTION_FILES_MAX_BYTES = ACTION_BODY_LIMIT_BYTES - 256 * 1024;
