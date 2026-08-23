/** Prints the crontab block for this checkout. Used by scripts/cron.mjs; exits explicitly because the db client keeps the loop alive. */
import { crontabText } from "../src/lib/jobs";
process.stdout.write(crontabText(process.argv[2] ?? process.cwd()));
process.exit(0);
