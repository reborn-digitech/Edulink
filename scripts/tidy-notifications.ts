/**
 * Tidy everyone's notifications. Cron-ready:
 *
 *   30 3 * * *  cd /path/to/edulink && npm run notifications:tidy
 *
 * The signed-in shell already does this for whoever turns up; this is for
 * the people a term passes without. Idempotent: a second run finds nothing.
 * Run through the owner connection, because it reaches across every tenant.
 */
import { tidyAllNotifications, AUTO_READ_AFTER_DAYS, EXPIRE_READ_AFTER_DAYS } from "../src/lib/notification-housekeeping";

async function main() {
  const result = await tidyAllNotifications();
  console.log(
    `notifications: ${result.autoRead} unread older than ${AUTO_READ_AFTER_DAYS} days marked read, ` +
      `${result.expired} read older than ${EXPIRE_READ_AFTER_DAYS} days removed`,
  );
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("[notifications:tidy]", error);
    process.exit(1);
  },
);
