/**
 * Prints every family-text template in the forms the registration desks
 * want — the DLT portal's {#var#} and WhatsApp's {{1}} — for each language,
 * so the operator pastes rather than retypes, and the registered text is
 * the sent text to the character.
 *
 *   npm run messages:templates
 *   npm run messages:templates -- --json    the same as JSON, for a script
 */
import { MESSAGE_LOCALES, MESSAGE_TEMPLATES, dltForm, whatsappForm, whatsappVarOrder, type MessageTemplateKey } from "../src/lib/message-templates";

const keys = Object.keys(MESSAGE_TEMPLATES) as MessageTemplateKey[];
if (process.argv.includes("--json")) {
  const out = Object.fromEntries(
    keys.map((key) => [key, Object.fromEntries(MESSAGE_LOCALES.map((l) => [l, { sms: dltForm(key, l), whatsapp: whatsappForm(key, l), variables: whatsappVarOrder(key, l) }]))]),
  );
  console.log(JSON.stringify(out, null, 2));
} else {
  for (const key of keys) {
    console.log(`\n== ${key} (event: ${MESSAGE_TEMPLATES[key].event ?? "none"})`);
    for (const l of MESSAGE_LOCALES) {
      console.log(`  [${l}] SMS (DLT):      ${dltForm(key, l)}`);
      console.log(`  [${l}] WhatsApp:       ${whatsappForm(key, l)}`);
      console.log(`  [${l}] variables:      ${whatsappVarOrder(key, l).join(", ")}`);
    }
  }
  console.log("\nSet the ids that come back in MESSAGE_TEMPLATE_IDS — see .env.example.");
}
