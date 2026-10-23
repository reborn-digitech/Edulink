Run the QA campaign of 24–25 October 2026, layer $ARGUMENTS (a number 1–8, or "all" to run every layer in the plan's order, or "status" to report where it stands).

Read docs/qa/campaign-2026-10-24/plan.md and accounts.md, the memory note qa-campaign-2026-10-24, and the layer's brief in the scratchpad folder the memory names (briefs/qa/<layer>.md: 1 accounts, 2 unit, 3 bdd, 4 ui, 5 e2e (two builders, A and B), 6 functional, 7 security, 8 report), each of which starts by pointing at briefs/qa/preamble.md.

Before the first layer of a day: read the usage with the usage tool and say what the layer should cost; if the all-models line is above 85 % say so and ask whether to proceed. Stop the generation run through the operator's quiz-jobs door if one is active (note its chapters, kept and loaded), restart :3000 through preview_stop and preview_start (never a shell), check /api/health and :8081, run `npm run zz:fixtures` and `npm run demo:schools`.

For a layer: launch one Opus builder (two for layer 5) with the brief's path and the preamble's rules in the prompt, in the background; layers 2 and 3 may run beside layer 1; layers 4, 5A, 5B, 6 and 7 at most two at a time. When a builder hands back: read its report under docs/qa/campaign-2026-10-24/, run the verification it names on anything it changed (web and scripts tsc, eslint on changed files, the suites it touched, the i18n floor), commit its report and any test or fixture it added as one narrative paragraph with "Verified:" and "Untested:", and push to both remotes. A product fix a layer proposes is not made by the campaign: it goes into REPORT.md's remediation plan, unless the owner says to fix.

For layer 8: write REPORT.md from every layer's report in the owner's format, publish it as a page with the Artifact tool, commit, push, give the link, and restart the generation run with its last request through the operator door.

For "status": say which layers are done (their reports exist), which are running, the findings so far by severity, and the usage.
