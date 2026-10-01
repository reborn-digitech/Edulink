import { z } from "zod";

/**
 * messaging: texts to families by SMS and WhatsApp — the office's channel
 * switches and caps, the fixed templates and their registered ids, one
 * notice to many families with a reach preview and a delivery report, the
 * automatic texts' recent history, and the office's own test message.
 */

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const count = z.number().int().min(0);

export const messageEventSchema = z.enum(["absence", "feeReminders", "feeReceipts", "circulars", "incidents"]);
export const messageChannelSchema = z.enum(["SMS", "WHATSAPP"]);
export const messageStatusSchema = z.enum(["QUEUED", "SENT", "DELIVERED", "FAILED", "UNDELIVERED", "SKIPPED"]);
export const messageSkipReasonSchema = z.enum(["no-phone", "opted-out", "channel-off", "event-off", "cap-monthly", "cap-daily", "no-transport", "disabled", "unverifiedNumber"]);
export const transportStateSchema = z.enum(["devbox", "twilio", "off"]);

export const messagingSettingsSchema = z.object({
  smsEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  monthlyCap: count,
  events: z.object({ absence: z.boolean(), feeReminders: z.boolean(), feeReceipts: z.boolean(), circulars: z.boolean(), incidents: z.boolean() }),
  /** Absence notices, fee reminders and circulars may go to the guardian phone the office typed on the pupil's record when the guardian has no proved number. */
  textOfficePhones: z.boolean().default(false),
});
export const messagingSettingsSaveSchema = z.object({
  smsEnabled: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  monthlyCap: count.max(1_000_000).optional(),
  events: z.object({ absence: z.boolean().optional(), feeReminders: z.boolean().optional(), feeReceipts: z.boolean().optional(), circulars: z.boolean().optional(), incidents: z.boolean().optional() }).optional(),
  textOfficePhones: z.boolean().optional(),
});

export const messagingAudienceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ALL_PARENTS") }),
  z.object({ kind: z.literal("CLASS"), classId: id }),
  z.object({ kind: z.literal("GRADE"), gradeLevel: z.string().trim().min(1).max(12) }),
  z.object({ kind: z.literal("OVERDUE_FEES") }),
  z.object({ kind: z.literal("PEOPLE"), userIds: z.array(id).min(1).max(500) }),
]);
export type MessagingAudience = z.infer<typeof messagingAudienceSchema>;

export const broadcastRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  channels: z.array(z.string()),
  audience: messagingAudienceSchema,
  recipients: count,
  queued: count,
  sent: count,
  delivered: count,
  failed: count,
  skipped: count,
  status: z.string(),
  createdAt: iso,
  doneAt: isoOrNull,
  author: z.string(),
});
export type BroadcastRow = z.infer<typeof broadcastRowSchema>;

export const messageRowSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  name: z.string().nullable(),
  to: z.string(),
  channel: z.string(),
  status: z.string(),
  skipReason: z.string().nullable(),
  error: z.string().nullable(),
  segments: count,
  createdAt: iso,
  sentAt: isoOrNull,
  deliveredAt: isoOrNull,
  templateKey: z.string(),
  purpose: z.string(),
});

export const messagingOverviewSchema = z.object({
  settings: messagingSettingsSchema,
  transports: z.object({ sms: transportStateSchema, whatsapp: transportStateSchema, problems: z.array(z.string()) }),
  month: z.object({ sent: count, delivered: count, failed: count, skipped: count, segments: count, cap: count }),
  skippedByReason: z.record(count),
  templates: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      event: messageEventSchema.nullable(),
      smsIds: z.record(z.string()),
      whatsappIds: z.record(z.string()),
      /** The text in each language, with {var} slots — for a preview. */
      text: z.object({ en: z.string(), hi: z.string(), mr: z.string() }),
    }),
  ),
  recent: z.array(broadcastRowSchema),
  recentMessages: z.array(messageRowSchema),
  parentsWithPhone: count,
  parentsTotal: count,
  /** The classes and grades a notice can be aimed at. */
  classes: z.array(z.object({ id: z.string(), name: z.string(), gradeLevel: z.string().nullable() })),
  grades: z.array(z.string()),
});
export type MessagingOverview = z.infer<typeof messagingOverviewSchema>;

export const broadcastsSchema = z.object({ broadcasts: z.array(broadcastRowSchema) });
export const broadcastPreviewBodySchema = z.object({ audience: messagingAudienceSchema, body: z.string().trim().min(1).max(300) });
export const broadcastPreviewSchema = z.object({ recipients: count, withPhone: count, whatsapp: count, sms: count, unreachable: count, estimatedSegments: count });
export const broadcastCreateBodySchema = z.object({
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(5).max(300),
  audience: messagingAudienceSchema,
  channels: z.array(z.enum(["TEXT", "PUSH"])).min(1).max(2),
});
export const broadcastCreatedSchema = z.object({ broadcastId: z.string(), recipients: count, queued: count, skipped: count, pushed: count });
export const broadcastDetailSchema = z.object({ broadcast: broadcastRowSchema, messages: z.array(messageRowSchema) });
export const broadcastResentSchema = z.object({ requeued: count });
export const messagingTestResultSchema = z.object({ id: z.string(), status: z.string(), channel: messageChannelSchema.nullable(), skipReason: messageSkipReasonSchema.nullable() });
export const messagingOkSchema = z.object({ ok: z.literal(true) });
