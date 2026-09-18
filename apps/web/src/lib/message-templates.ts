/**
 * Every text the platform may send a family, as a template.
 *
 * ⚠ A TEXT IS NOT A NOTIFICATION. A push or an in-app row can say anything;
 * an SMS to an Indian number must match, word for word, a template the
 * sender registered with its telecom entity under TRAI's DLT rules, or the
 * carrier drops it and the provider still reports "sent". WhatsApp is
 * stricter: a first message in a 24-hour window must be a pre-approved
 * content template. So the sentences live HERE, fixed, with named
 * variables, in the three languages the school can register; a caller
 * picks a key and supplies the variables and nothing else. `npm run
 * messages:templates` prints every text in every language, which is what
 * the operator pastes into the DLT and WhatsApp registration forms, and
 * MESSAGE_TEMPLATE_IDS in the environment carries the ids they come back
 * with (see env.ts).
 *
 * Variables are `{name}`; on the DLT form they are written `{#var#}`. Keep
 * each variable under 30 characters at the call site — a child's name, an
 * amount, a date — because that is the DLT limit per variable.
 *
 * Client-safe: no server-only import, so a screen can show a preview.
 */

export const MESSAGE_LOCALES = ["en", "hi", "mr"] as const;
export type MessageLocale = (typeof MESSAGE_LOCALES)[number];

export type MessageTemplate = {
  /** What the office reads on the settings page — a dictionary key under `messaging`. */
  labelKey: `messaging.template${string}`;
  /** The variable names, in the order the registered template lists them. */
  vars: readonly string[];
  text: Record<MessageLocale, string>;
  /** The automatic event this template belongs to, or null for the office's own notice. */
  event: "absence" | "feeReminders" | "feeReceipts" | "circulars" | null;
};

export const MESSAGE_TEMPLATES = {
  absence: {
    labelKey: "messaging.templateAbsence",
    vars: ["child", "school"],
    event: "absence",
    text: {
      en: "{child} has been missing school lately. Please speak to the office at {school}. - EduLink",
      hi: "{child} इन दिनों स्कूल नहीं आ रहे/रही हैं। कृपया {school} के कार्यालय से बात करें। - EduLink",
      mr: "{child} सध्या शाळेत येत नाही. कृपया {school} च्या कार्यालयाशी बोला. - EduLink",
    },
  },
  feeDueSoon: {
    labelKey: "messaging.templateFeeDueSoon",
    vars: ["child", "amount", "date", "school"],
    event: "feeReminders",
    text: {
      en: "Fees of {amount} for {child} are due on {date} at {school}. Pay in the EduLink app or at the office. - EduLink",
      hi: "{school} में {child} की {amount} फ़ीस {date} को देय है। EduLink ऐप में या कार्यालय में भुगतान करें। - EduLink",
      mr: "{school} मध्ये {child} ची {amount} फी {date} रोजी देय आहे. EduLink ॲपमध्ये किंवा कार्यालयात भरा. - EduLink",
    },
  },
  feeOverdue: {
    labelKey: "messaging.templateFeeOverdue",
    vars: ["child", "amount", "date", "school"],
    event: "feeReminders",
    text: {
      en: "Fees of {amount} for {child} at {school} were due on {date} and are still unpaid. Pay in the EduLink app or at the office. - EduLink",
      hi: "{school} में {child} की {amount} फ़ीस {date} को देय थी और अभी बाक़ी है। EduLink ऐप में या कार्यालय में भुगतान करें। - EduLink",
      mr: "{school} मध्ये {child} ची {amount} फी {date} रोजी देय होती आणि अजून बाकी आहे. EduLink ॲपमध्ये किंवा कार्यालयात भरा. - EduLink",
    },
  },
  feeReceived: {
    labelKey: "messaging.templateFeeReceived",
    vars: ["child", "amount", "serial", "school"],
    event: "feeReceipts",
    text: {
      en: "{school} received {amount} for {child}. Receipt {serial} is in the EduLink app. Thank you. - EduLink",
      hi: "{school} को {child} के लिए {amount} मिले। रसीद {serial} EduLink ऐप में है। धन्यवाद। - EduLink",
      mr: "{school} ला {child} साठी {amount} मिळाले. पावती {serial} EduLink ॲपमध्ये आहे. धन्यवाद. - EduLink",
    },
  },
  circular: {
    labelKey: "messaging.templateCircular",
    vars: ["school", "notice"],
    event: "circulars",
    text: {
      en: "Notice from {school}: {notice} - EduLink",
      hi: "{school} से सूचना: {notice} - EduLink",
      mr: "{school} कडून सूचना: {notice} - EduLink",
    },
  },
  test: {
    labelKey: "messaging.templateTest",
    vars: ["school"],
    event: null,
    text: {
      en: "This is a test message from {school} on EduLink. No action is needed. - EduLink",
      hi: "यह EduLink पर {school} की ओर से एक परीक्षण संदेश है। कुछ करने की ज़रूरत नहीं है। - EduLink",
      mr: "हा EduLink वर {school} कडून एक चाचणी संदेश आहे. काही करण्याची गरज नाही. - EduLink",
    },
  },
} as const satisfies Record<string, MessageTemplate>;

export type MessageTemplateKey = keyof typeof MESSAGE_TEMPLATES;
export const MESSAGE_TEMPLATE_KEYS = Object.keys(MESSAGE_TEMPLATES) as MessageTemplateKey[];

export function isMessageTemplateKey(value: string): value is MessageTemplateKey {
  return value in MESSAGE_TEMPLATES;
}

/** The automatic events a school may switch off one by one. */
export const MESSAGE_EVENTS = ["absence", "feeReminders", "feeReceipts", "circulars"] as const;
export type MessageEvent = (typeof MESSAGE_EVENTS)[number];

/** A variable longer than this is cut, with an ellipsis — the DLT limit per variable is 30. */
export const MAX_VAR_LENGTH = 30;
/** The one long variable: a notice's own words. WhatsApp allows 1,024; three SMS segments allow about 450. */
export const MAX_NOTICE_LENGTH = 300;

/** `{name}` slots filled from `vars`, each trimmed to the DLT limit except a notice, which has its own. */
export function renderTemplate(key: MessageTemplateKey, locale: string, vars: Record<string, string | number>): string {
  const template = MESSAGE_TEMPLATES[key];
  const lang: MessageLocale = (MESSAGE_LOCALES as readonly string[]).includes(locale) ? (locale as MessageLocale) : "en";
  return template.text[lang].replace(/\{(\w+)\}/g, (_, name: string) => {
    const raw = String(vars[name] ?? "").replace(/\s+/g, " ").trim();
    const max = name === "notice" ? MAX_NOTICE_LENGTH : MAX_VAR_LENGTH;
    return raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
  });
}

/** The text as the DLT form wants it: every variable as {#var#}. */
export function dltForm(key: MessageTemplateKey, locale: MessageLocale): string {
  return MESSAGE_TEMPLATES[key].text[locale].replace(/\{\w+\}/g, "{#var#}");
}

/** The text as the WhatsApp template form wants it: variables numbered {{1}}, {{2}}… in order of first appearance. */
export function whatsappForm(key: MessageTemplateKey, locale: MessageLocale): string {
  const order: string[] = [];
  return MESSAGE_TEMPLATES[key].text[locale].replace(/\{(\w+)\}/g, (_, name: string) => {
    let index = order.indexOf(name);
    if (index < 0) {
      order.push(name);
      index = order.length - 1;
    }
    return `{{${index + 1}}}`;
  });
}

/** The variables in the order the WhatsApp form numbers them — what ContentVariables must list. */
export function whatsappVarOrder(key: MessageTemplateKey, locale: MessageLocale): string[] {
  const order: string[] = [];
  for (const m of MESSAGE_TEMPLATES[key].text[locale].matchAll(/\{(\w+)\}/g)) if (!order.includes(m[1]!)) order.push(m[1]!);
  return order;
}

/** GSM-7 fits 160 characters in one segment and 153 per segment after; anything outside GSM-7 (Devanagari) is UCS-2: 70 and 67. */
export function smsSegments(text: string): number {
  const gsm = /^[\x00-\x7F€£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉÄÖÑÜ§¿äöñüà^{}\\[~\]|]*$/.test(text);
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  const length = [...text].length;
  return length <= single ? 1 : Math.ceil(length / multi);
}
