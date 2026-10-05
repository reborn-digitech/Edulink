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
  /** What the office reads on the settings page — a dictionary key under `messaging` (or `riskDecisions` for the opt-out forms). */
  labelKey: `messaging.template${string}` | `riskDecisions.template${string}`;
  /** The variable names, in the order the registered template lists them. */
  vars: readonly string[];
  text: Record<MessageLocale, string>;
  /** The automatic event this template belongs to, or null for the office's own notice. */
  event: "absence" | "feeReminders" | "feeReceipts" | "circulars" | "incidents" | null;
};

export const MESSAGE_TEMPLATES = {
  absence: {
    labelKey: "messaging.templateAbsence",
    vars: ["child", "school"],
    event: "absence",
    text: {
      en: "{child} has been missing school lately. Please speak to the office at {school}. - Shalaghar",
      hi: "{child} इन दिनों स्कूल नहीं आ रहे/रही हैं। कृपया {school} के कार्यालय से बात करें। - शालाघर",
      mr: "{child} सध्या शाळेत येत नाही. कृपया {school} च्या कार्यालयाशी बोला. - शाळाघर",
    },
  },
  feeDueSoon: {
    labelKey: "messaging.templateFeeDueSoon",
    vars: ["child", "amount", "date", "school"],
    event: "feeReminders",
    text: {
      en: "Fees of {amount} for {child} are due on {date} at {school}. Pay in the Shalaghar app or at the office. - Shalaghar",
      hi: "{school} में {child} की {amount} फ़ीस {date} को देय है। शालाघर ऐप में या कार्यालय में भुगतान करें। - शालाघर",
      mr: "{school} मध्ये {child} ची {amount} फी {date} रोजी देय आहे. शाळाघर ॲपमध्ये किंवा कार्यालयात भरा. - शाळाघर",
    },
  },
  feeOverdue: {
    labelKey: "messaging.templateFeeOverdue",
    vars: ["child", "amount", "date", "school"],
    event: "feeReminders",
    text: {
      en: "Fees of {amount} for {child} at {school} were due on {date} and are still unpaid. Pay in the Shalaghar app or at the office. - Shalaghar",
      hi: "{school} में {child} की {amount} फ़ीस {date} को देय थी और अभी बाक़ी है। शालाघर ऐप में या कार्यालय में भुगतान करें। - शालाघर",
      mr: "{school} मध्ये {child} ची {amount} फी {date} रोजी देय होती आणि अजून बाकी आहे. शाळाघर ॲपमध्ये किंवा कार्यालयात भरा. - शाळाघर",
    },
  },
  feeReceived: {
    labelKey: "messaging.templateFeeReceived",
    vars: ["child", "amount", "serial", "school"],
    event: "feeReceipts",
    text: {
      en: "{school} received {amount} for {child}. Receipt {serial} is in the Shalaghar app. Thank you. - Shalaghar",
      hi: "{school} को {child} के लिए {amount} मिले। रसीद {serial} शालाघर ऐप में है। धन्यवाद। - शालाघर",
      mr: "{school} ला {child} साठी {amount} मिळाले. पावती {serial} शाळाघर ॲपमध्ये आहे. धन्यवाद. - शाळाघर",
    },
  },
  circular: {
    labelKey: "messaging.templateCircular",
    vars: ["school", "notice"],
    event: "circulars",
    text: {
      en: "Notice from {school}: {notice} - Shalaghar",
      hi: "{school} से सूचना: {notice} - शालाघर",
      mr: "{school} कडून सूचना: {notice} - शाळाघर",
    },
  },
  incident: {
    labelKey: "messaging.templateIncident",
    vars: ["child", "summary", "school"],
    event: "incidents",
    text: {
      en: "{school}: {child} - {summary}. Details and what was done are in the Shalaghar app; the office can be called. - Shalaghar",
      hi: "{school}: {child} - {summary}। विवरण और क्या किया गया, शालाघर ऐप में है; कार्यालय को फ़ोन कर सकते हैं। - शालाघर",
      mr: "{school}: {child} - {summary}. तपशील आणि काय केले ते शाळाघर ॲपमध्ये आहे; कार्यालयाला फोन करता येईल. - शाळाघर",
    },
  },
  // THE OPT-OUT FORMS (G4-33, risks batch 5 Oct 2026): what goes to a guardian phone the office typed and nobody
  // proved — the base text with one line telling them how to stop. Registered like the others (npm run messages:templates).
  absenceOptOut: {
    labelKey: "riskDecisions.templateAbsenceOptOut",
    vars: ["child", "school"],
    event: "absence",
    text: {
      en: "{child} has been missing school lately. Please speak to the office at {school}. Reply STOP to stop these texts. - Shalaghar",
      hi: "{child} इन दिनों स्कूल नहीं आ रहे/रही हैं। कृपया {school} के कार्यालय से बात करें। ये संदेश रोकने के लिए STOP लिखकर भेजें। - शालाघर",
      mr: "{child} सध्या शाळेत येत नाही. कृपया {school} च्या कार्यालयाशी बोला. हे संदेश थांबवण्यासाठी STOP असे उत्तर पाठवा. - शाळाघर",
    },
  },
  feeDueSoonOptOut: {
    labelKey: "riskDecisions.templateFeeDueSoonOptOut",
    vars: ["child", "amount", "date", "school"],
    event: "feeReminders",
    text: {
      en: "Fees of {amount} for {child} are due on {date} at {school}. Pay in the Shalaghar app or at the office. Reply STOP to stop these texts. - Shalaghar",
      hi: "{school} में {child} की {amount} फ़ीस {date} को देय है। शालाघर ऐप में या कार्यालय में भुगतान करें। ये संदेश रोकने के लिए STOP लिखकर भेजें। - शालाघर",
      mr: "{school} मध्ये {child} ची {amount} फी {date} रोजी देय आहे. शाळाघर ॲपमध्ये किंवा कार्यालयात भरा. हे संदेश थांबवण्यासाठी STOP असे उत्तर पाठवा. - शाळाघर",
    },
  },
  feeOverdueOptOut: {
    labelKey: "riskDecisions.templateFeeOverdueOptOut",
    vars: ["child", "amount", "date", "school"],
    event: "feeReminders",
    text: {
      en: "Fees of {amount} for {child} at {school} were due on {date} and are still unpaid. Pay in the Shalaghar app or at the office. Reply STOP to stop these texts. - Shalaghar",
      hi: "{school} में {child} की {amount} फ़ीस {date} को देय थी और अभी बाक़ी है। शालाघर ऐप में या कार्यालय में भुगतान करें। ये संदेश रोकने के लिए STOP लिखकर भेजें। - शालाघर",
      mr: "{school} मध्ये {child} ची {amount} फी {date} रोजी देय होती आणि अजून बाकी आहे. शाळाघर ॲपमध्ये किंवा कार्यालयात भरा. हे संदेश थांबवण्यासाठी STOP असे उत्तर पाठवा. - शाळाघर",
    },
  },
  circularOptOut: {
    labelKey: "riskDecisions.templateCircularOptOut",
    vars: ["school", "notice"],
    event: "circulars",
    text: {
      en: "Notice from {school}: {notice} Reply STOP to stop these texts. - Shalaghar",
      hi: "{school} से सूचना: {notice} ये संदेश रोकने के लिए STOP लिखकर भेजें। - शालाघर",
      mr: "{school} कडून सूचना: {notice} हे संदेश थांबवण्यासाठी STOP असे उत्तर पाठवा. - शाळाघर",
    },
  },
  test: {
    labelKey: "messaging.templateTest",
    vars: ["school"],
    event: null,
    text: {
      en: "This is a test message from {school} on Shalaghar. No action is needed. - Shalaghar",
      hi: "यह शालाघर पर {school} की ओर से एक परीक्षण संदेश है। कुछ करने की ज़रूरत नहीं है। - शालाघर",
      mr: "हा शाळाघरावर {school} कडून एक चाचणी संदेश आहे. काही करण्याची गरज नाही. - शाळाघर",
    },
  },
} as const satisfies Record<string, MessageTemplate>;

export type MessageTemplateKey = keyof typeof MESSAGE_TEMPLATES;

/**
 * The form a text takes to an office-entered number (G4-33): the base template's key → its opt-out form. The three
 * events that may reach such a number (OFFICE_PHONE_EVENTS: absence, fee reminders, circulars) each have one.
 */
export const OPT_OUT_FORM: Partial<Record<MessageTemplateKey, MessageTemplateKey>> = { absence: "absenceOptOut", feeDueSoon: "feeDueSoonOptOut", feeOverdue: "feeOverdueOptOut", circular: "circularOptOut" };
export const MESSAGE_TEMPLATE_KEYS = Object.keys(MESSAGE_TEMPLATES) as MessageTemplateKey[];

export function isMessageTemplateKey(value: string): value is MessageTemplateKey {
  return value in MESSAGE_TEMPLATES;
}

/** The automatic events a school may switch off one by one. */
export const MESSAGE_EVENTS = ["absence", "feeReminders", "feeReceipts", "circulars", "incidents"] as const;
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
