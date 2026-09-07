import { z } from "zod";
import { LOCALES } from "@edulink/i18n";

/** The locale codes as a schema, derived from the one list rather than retyped. */
export const localeSchema = z.enum(
  LOCALES.map((l) => l.code) as [(typeof LOCALES)[number]["code"], ...(typeof LOCALES)[number]["code"][]],
);
