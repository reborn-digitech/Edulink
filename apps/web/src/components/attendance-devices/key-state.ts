/** What a new device or a rotated key answers into the page's key box (R-2, 5 Oct 2026): the key, once, or the refusal. */
export type KeyFormState = { idle?: true; ok: boolean; key?: string; endpoint?: string; deviceId?: string; deviceName?: string; message?: string };
export const KEY_FORM_IDLE: KeyFormState = { idle: true, ok: false };
