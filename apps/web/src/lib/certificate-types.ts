import type { z } from "zod";
import type { certificateIssueSchema, certificateKindSchema, certificateLayoutSchema, certificateRowSchema, certificateTemplateSaveSchema, certificateTemplatesViewSchema, issuedCertificateSchema } from "@edulink/contracts";

/** The contract types the certificate library returns; kept apart so a client file can import them without the server-only library. */
export type CertificateKind = z.infer<typeof certificateKindSchema>;
export type CertificateLayout = z.infer<typeof certificateLayoutSchema>;
export type CertificateRow = z.infer<typeof certificateRowSchema>;
export type CertificateTemplateSave = z.infer<typeof certificateTemplateSaveSchema>;
export type CertificateTemplatesView = z.infer<typeof certificateTemplatesViewSchema>;
export type CertificateIssueInput = z.infer<typeof certificateIssueSchema>;
export type IssuedCertificateView = z.infer<typeof issuedCertificateSchema>;
