#!/bin/zsh
# The question bank's generated files, committed as a snapshot and pushed to both remotes (the owner's ask of
# 31 October 2026: the generation run writes tens of megabytes between commits; a daily snapshot protects them).
# Commits only apps/web/content/quiz/generated (batches, held, runs); nothing else, so an unrelated half-done
# change in the tree never rides along. Exits 0 with "nothing to snapshot" when the folder is unchanged.
set -euo pipefail
cd "$(dirname "$0")/../../.."
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
FOLDER=apps/web/content/quiz/generated
if [ -z "$(git status --porcelain -- "$FOLDER")" ]; then echo "nothing to snapshot"; exit 0; fi
ADDED=$(git status --porcelain -- "$FOLDER" | grep -c '^??' || true)
CHANGED=$(git status --porcelain -- "$FOLDER" | grep -c '^ M\|^M ' || true)
REMOVED=$(git status --porcelain -- "$FOLDER" | grep -c '^ D\|^D ' || true)
QUESTIONS=$(ls "$FOLDER"/*.json 2>/dev/null | wc -l | tr -d ' ')
git add -A -- "$FOLDER"
# --only with the folder as the pathspec (TA-441): a bare commit took the whole index, so a file another builder had
# staged rode along under this message with CI skipped; now what is staged elsewhere stays staged and uncommitted.
git commit -q --only -m "The question bank's generated files as the generation run left them on $(date '+%-d %B %Y') (daily snapshot): $ADDED new, $CHANGED changed and $REMOVED removed under content/quiz/generated, $QUESTIONS chapter batch files in all. No code, so CI is skipped. Verified: the files are what the run wrote. Untested: nothing to test. [skip ci]

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -- "$FOLDER"
git push -q reborn master && git push -q origin master
echo "snapshot committed: $ADDED new, $CHANGED changed, $REMOVED removed; pushed"
