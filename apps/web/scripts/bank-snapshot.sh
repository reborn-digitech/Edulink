#!/bin/zsh
# The question bank's chapter batch files, committed as a daily snapshot and pushed to both remotes.
#
# Takes the top-level batch files of apps/web/content/quiz/generated, new, changed or removed, and nothing else: every
# git command below that stages, compares, counts, commits or unstages the batch files takes one glob pathspec,
# ":(glob)apps/web/content/quiz/generated/*.json", whose "*" never crosses a "/", so every subfolder is out by
# construction. Leaves out runs/ (the generator's run logs, also ignored in
# apps/web/.gitignore), held/ (chapters set aside), any other subfolder, any file that is not .json, and whatever is
# staged outside the batch files, which stays staged and out of the commit (TA-441).
#
# Refuses, exit 1, nothing committed or pushed, with a last line on stderr that starts "bank snapshot:":
#   - the checkout is not on master (a side branch or a detached HEAD), its index is locked, or it has unmerged paths;
#   - local master is not reborn's and origin's master: a remote that cannot be read or has no master, a remote whose
#     master has moved, or local master ahead of a remote, as a failed push leaves it. This is asked before "nothing
#     to snapshot", so a snapshot left unpushed is reported on every run and never hidden;
#   - a batch file is already staged, intent-to-add included (the snapshot never undoes another person's staging);
#   - a batch file is a symbolic link (its target's path would be published, and the verifier would read the target);
#   - npm run quiz:verify fails on the batch files as they stand;
#   - the batch files change while quiz:verify runs, or between it and the commit;
#   - master moves, or the checkout leaves master, during the run (a landing's merge, say), before the commit; or the
#     commit lands on a master that moved, when it is taken back to its own parent, so a commit made on a master that
#     moved is not left there (unless the take-back itself fails, which is said);
#   - the checkout leaves master as the commit is made: unlike the others, this one leaves the snapshot commit, on the
#     other branch, and says which branch and that the commit was not checked and must not be pushed; nothing is pushed;
#   - the commit fails.
# Each push is checked and sends the snapshot commit by its id, after checking local master is still that commit; a
# push that fails is reported, exit 1, naming the commit, the remote and the remotes already pushed; never retried.
# From the staging on, a stop by INT, TERM or HUP exits 130, 143 or 129 with a last line saying how far the run had gone,
# before the commit, after it was attempted, or after it was checked, with the remotes pushed by then; before it the
# shell's own default applies and nothing has been done. A signal sent to the script alone stops a hung push only once
# git returns, since zsh runs a trapped signal's handler only after a plain command it waits on has returned; a remote
# read that hangs comes before the staging, when no trap is set, so a TERM ends the script at once and leaves git
# running. A signal to the run's whole process group reaches git too, but that group may hold more than the run (the
# program that started it), so look at what it holds before signalling it.
# Exits 0 with "nothing to snapshot" when no batch file changed, and after a full success.
#
# By whose word: the daily snapshot is the owner's ask of 31 October 2026; leaving out runs/ is the owner's "Keep them
# out" of 22 November 2026 (the new run logs out of the public repository); leaving out held/ and refusing a bank that
# fails quiz:verify are defaults the owner may reverse.
set -euo pipefail
cd "$(dirname "$0")/../../.."
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
# An unattended run never waits at a prompt, for a read or for a push.
export GIT_TERMINAL_PROMPT=0
# Subjects are shown in characters under en_US.UTF-8 where `locale -a` lists it, in either spelling and any case (glibc
# lists en_US.utf8), and LC_ALL does not decide. Where the shell runs under a C locale and neither spelling is listed,
# the locale is left as it is, and a subject's Devanagari or ₹ is shown partly as raw bytes and partly as byte escapes,
# and may be split.
LOCALES=$(locale -a 2>/dev/null || true)
if [[ -z "${LC_ALL:-}" ]]; then
  for NAME in "${(@f)LOCALES}"; do
    if [[ "${NAME:l}" == en_us.utf-8 || "${NAME:l}" == en_us.utf8 ]]; then export LC_CTYPE="$NAME"; break; fi
  done
fi
FOLDER=apps/web/content/quiz/generated
SPEC=":(glob)${FOLDER}/*.json"
REMOTES=(reborn origin)
PUSH_LINE="until it is pushed the next runs refuse, and any landing built on local master pushes this snapshot along with it."

fail() {
  print -u2 -r -- "bank snapshot: $*"
  exit 1
}

# 1. On master, the index not locked, nothing unmerged.
HEADREF=$(git symbolic-ref -q HEAD || true)
if [[ "$HEADREF" != refs/heads/master ]]; then
  if [[ -n "$HEADREF" ]]; then WHERE="the branch ${HEADREF#refs/heads/}"; else WHERE="a detached HEAD"; fi
  fail "the checkout is on ${WHERE}, not master; nothing committed or pushed"
fi
LOCK=$(git rev-parse --git-path index.lock) || fail "could not find the index; nothing committed or pushed"
if [[ -e "$LOCK" ]]; then
  fail "the index is locked (${LOCK} exists: another git command is running, or one stopped); nothing committed or pushed"
fi
UNMERGED=$(git ls-files -u) || fail "could not read the index; nothing committed or pushed"
if [[ -n "$UNMERGED" ]]; then
  fail "the index has unmerged paths (a merge or rebase is unfinished); nothing committed or pushed"
fi

# 2. Local master is each remote's master, asked before "nothing to snapshot".
OLD=$(git rev-parse -q --verify refs/heads/master) || fail "master has no commit; nothing committed or pushed"
for REMOTE in $REMOTES; do
  if ! LISTED=$(git ls-remote "$REMOTE" refs/heads/master); then
    fail "could not read ${REMOTE}'s master (git ls-remote ${REMOTE} refs/heads/master failed); nothing committed or pushed"
  fi
  # ls-remote also lists a ref whose name only ends in refs/heads/master: the line whose name is exactly that.
  THEIRS=""
  for LINE in "${(@f)LISTED}"; do
    if [[ "${LINE#*$'\t'}" == refs/heads/master ]]; then THEIRS=${LINE%%$'\t'*}; break; fi
  done
  if [[ -z "$THEIRS" ]]; then
    fail "${REMOTE} has no master; nothing committed or pushed"
  fi
  if [[ "$THEIRS" != "$OLD" ]]; then
    # A remote id this clone does not have makes --is-ancestor exit 128, which reads as moved.
    if git merge-base --is-ancestor "$THEIRS" "$OLD"; then
      AHEAD=$(git rev-list --count "${THEIRS}..${OLD}") || AHEAD="?"
      # Each subject with its control characters made visible, then cut at 80 characters (bytes where no UTF-8 locale
      # could be set, above, and a character of several bytes may then be split).
      SUBJECTS=()
      for SUBJECT in "${(@f)$(git log -n 5 --format=%s "${THEIRS}..${OLD}")}"; do SUBJECTS+=("\"${${(V)SUBJECT}[1,80]}\""); done
      fail "local master is ${AHEAD} commit(s) ahead of ${REMOTE} (${REMOTE} ${THEIRS[1,12]}, local master ${OLD[1,12]}), not pushed: ${(j:; :)SUBJECTS}; nothing committed or pushed"
    fi
    fail "${REMOTE}'s master has moved (${REMOTE} ${THEIRS[1,12]}, local master ${OLD[1,12]}); nothing committed or pushed"
  fi
done

# 3. Nothing to snapshot when no batch file changed: a change under runs/ or held/, or to a file that is not .json, is not one.
CHANGES=$(git status --porcelain --untracked-files=all -- "$SPEC") || fail "git status failed; nothing committed or pushed"
if [[ -z "$CHANGES" ]]; then
  print -r -- "nothing to snapshot"
  exit 0
fi

# 4. A batch file already staged, intent-to-add included, is a refusal: the clean-up below must never undo another
# person's staging. What is staged outside the batch files is not: it stays staged and out of the commit.
if ! git diff --cached --quiet --ita-visible-in-index -- "$SPEC"; then
  fail "a chapter batch file is already staged (git diff --cached --name-only -- '${SPEC}'); the snapshot never undoes another's staging, and nothing was committed or pushed; if a snapshot run was stopped part-way and nobody else staged them, unstage with: git reset -q -- '${SPEC}'"
fi

# 5 and 6. Stage, verify, check. From the add on, any refusal, failure or stop leaves none of the batch files staged: the
# traps are set at the top level right before the add (a refusal above must not run them, and in zsh a trap set inside
# a function fires when the function returns). The EXIT trap keeps the exit code, and ignores INT, TERM and HUP first so
# that its reset and the retry finish and say what they must. zsh does not run the EXIT trap when a signal it does not
# trap ends the shell, so INT, TERM and HUP are trapped too, each saying how far the run had gone and exiting, which
# runs the EXIT trap. A reset that fails (another process holding the index) is tried once more after a second; only
# when that fails too are git's error and the script's sentence printed.
unstage() {
  local first second
  first=$(git reset -q -- "$SPEC" 2>&1) && return 0
  sleep 1
  second=$(git reset -q -- "$SPEC" 2>&1) && return 0
  print -u2 -r -- "$first"
  [[ "$second" == "$first" ]] || print -u2 -r -- "$second"
  print -u2 -r -- "bank snapshot: could not unstage the chapter batch files (git reset failed); they are still staged, and the next runs refuse until they are unstaged with: git reset -q -- '${SPEC}'"
}
# How far the run had gone: ATTEMPTED is set on the line before `git commit`, COMMITTED when the commit has passed its
# checks, PUSHED as each push goes through, PUSHING while one is under way.
stopped() {
  local now
  now=$(git rev-parse -q --verify refs/heads/master) || now=""
  if (( COMMITTED )); then
    if (( ${#PUSHED} == ${#REMOTES} )); then
      print -u2 -r -- "bank snapshot: stopped by SIG${1} after the snapshot commit ${MADE} was pushed to ${(j: and :)PUSHED}"
    else
      local under=""
      [[ -z "$PUSHING" ]] || under=", and the push to ${PUSHING} was under way (it may have gone through)"
      print -u2 -r -- "bank snapshot: stopped by SIG${1}; the snapshot commit ${MADE} is on local master, pushed to: ${PUSHED[*]:-none}${under}; the next run will report what is left"
    fi
  elif (( ATTEMPTED )); then
    print -u2 -r -- "bank snapshot: stopped by SIG${1}; a snapshot commit may be on local master and was not checked against what quiz:verify read; do not push it; the next run will report it"
  elif [[ -n "$now" && "$now" != "$OLD" ]]; then
    print -u2 -r -- "bank snapshot: stopped by SIG${1}; nothing committed or pushed; local master moved to ${now} meanwhile"
  else
    print -u2 -r -- "bank snapshot: stopped by SIG${1}; nothing committed or pushed"
  fi
  exit "$2"
}
ATTEMPTED=0
COMMITTED=0
MADE=""
PUSHED=()
PUSHING=""
trap 'trap "" INT TERM HUP; if (( ! COMMITTED )); then unstage; fi' EXIT
trap 'stopped INT 130' INT
trap 'stopped TERM 143' TERM
trap 'stopped HUP 129' HUP
git add -A -- "$SPEC" || fail "git add failed; nothing committed or pushed"
TREE=$(git write-tree) || fail "git write-tree failed; nothing committed or pushed"
MODES=$(git ls-files -s -- "$SPEC") || fail "git ls-files failed; nothing committed or pushed"
if (( $(print -r -- "$MODES" | grep -c '^120000 ' || true) )); then
  fail "a chapter batch file is a symbolic link (git ls-files -s -- '${SPEC}' shows mode 120000); nothing committed or pushed"
fi
# npm from apps/web: the verifier reads content/quiz under its working folder, and the root has no quiz:verify.
if ! OUT=$(npm --prefix apps/web run -s quiz:verify 2>&1); then
  SHOWN=$(print -r -- "$OUT" | grep -e '^  ✗' | head -n 20 || true)
  [[ -n "$SHOWN" ]] || SHOWN=$(print -r -- "$OUT" | tail -n 10)
  print -u2 -r -- "$SHOWN"
  fail "npm run quiz:verify failed on the chapter batch files as they stand; nothing committed or pushed"
fi
if ! git diff --quiet -- "$SPEC"; then
  fail "the chapter batch files changed while quiz:verify ran (a generation run writing?); nothing committed or pushed"
fi
NEW=$(git ls-files --others --exclude-standard -- "$SPEC") || fail "git ls-files failed; nothing committed or pushed"
if [[ -n "$NEW" ]]; then
  fail "a new chapter batch file appeared while quiz:verify ran (a generation run writing?); nothing committed or pushed"
fi

# 7. Counts are of files, from the index the commit is made of.
STAGED=$(git diff --cached --no-renames --name-status -- "$SPEC") || fail "git diff --cached failed; nothing committed or pushed"
ADDED=$(print -r -- "$STAGED" | grep -c '^A' || true)
CHANGED=$(print -r -- "$STAGED" | grep -c '^[MT]' || true)
REMOVED=$(print -r -- "$STAGED" | grep -c '^D' || true)
BATCHES=$(git ls-files -- "$SPEC" | wc -l | tr -d ' ') || fail "git ls-files failed; nothing committed or pushed"

# 8. The commit, on master as step 2 found it, with --only and the same pathspec (TA-441: what is staged elsewhere stays
# staged and uncommitted).
HEADREF=$(git symbolic-ref -q HEAD || true)
if [[ "$HEADREF" != refs/heads/master ]]; then
  if [[ -n "$HEADREF" ]]; then WHERE="the branch ${HEADREF#refs/heads/}"; else WHERE="a detached HEAD"; fi
  fail "the checkout left master during the run (it is on ${WHERE}); nothing committed or pushed"
fi
NOW=$(git rev-parse HEAD) || fail "git rev-parse HEAD failed; nothing committed or pushed"
if [[ "$NOW" != "$OLD" ]]; then
  fail "master moved during the run (now ${NOW}, was ${OLD}); nothing committed or pushed"
fi
ATTEMPTED=1
git commit -q --only -m "The question bank's chapter batch files as they stood on $(date '+%-d %B %Y') (daily snapshot): ${ADDED} new, ${CHANGED} changed and ${REMOVED} removed, ${BATCHES} chapter batch files in all, at the top of content/quiz/generated; \`runs/\` and \`held/\` left out (the run logs by the owner's decision of 22 November 2026). No code, so CI is skipped. Verified: npm run quiz:verify exit 0 on the chapter batch files, and this commit's files are the tree it checked. Untested: anything quiz:verify does not check. [skip ci]

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -- "$SPEC" || fail "the commit failed; nothing committed or pushed"
MADE=$(git rev-parse HEAD) || fail "the commit was made but HEAD could not be read (git rev-parse HEAD failed); local master may hold an unverified snapshot commit; nothing pushed"
PARENT=$(git rev-parse "${MADE}^") || fail "the snapshot commit ${MADE}'s parent could not be read; it is on local master, unverified; nothing pushed"
HEADREF=$(git symbolic-ref -q HEAD || true)
if [[ "$HEADREF" != refs/heads/master ]]; then
  if [[ -n "$HEADREF" ]]; then WHERE="the branch ${HEADREF#refs/heads/}"; else WHERE="a detached HEAD"; fi
  fail "the checkout left master as the commit was made: the snapshot commit ${MADE} is on ${WHERE}, not on master; it was not checked and must not be pushed; nothing pushed"
fi
# commit --only reads every tracked batch file from the working tree as it commits, and commits on whatever master is
# then: unless the commit stands on master as step 2 found it and holds the tree quiz:verify checked, it is taken back to
# its own parent before any push (never to the old id, which would drop a commit landed meanwhile).
if [[ "$PARENT" != "$OLD" ]] || ! git diff --quiet "$TREE" "$MADE" -- "$SPEC"; then
  if ! git update-ref -m "bank snapshot: unverified commit taken back" refs/heads/master "$PARENT" "$MADE"; then
    NOW=$(git rev-parse -q --verify refs/heads/master) || NOW="unreadable"
    if [[ "$NOW" == "$MADE" ]]; then
      fail "the snapshot commit ${MADE} could not be taken back (git update-ref failed) and is still on local master; it was not checked and must not be pushed; take it back with: git update-ref refs/heads/master ${PARENT} ${MADE}, then: git reset -q -- '${SPEC}'; nothing pushed"
    fi
    fail "the snapshot commit ${MADE} could not be taken back (git update-ref failed); local master is now ${NOW}; nothing pushed"
  fi
  git reset -q -- "$SPEC" || true
  if [[ "$PARENT" != "$OLD" ]]; then
    fail "master moved during the run (the snapshot commit ${MADE} was made on ${PARENT}, not ${OLD}); the commit was taken back; nothing committed or pushed"
  fi
  fail "the batch files changed between quiz:verify and the commit; the commit was taken back; nothing committed or pushed"
fi
COMMITTED=1
HASH=$(git rev-parse --short "$MADE") || fail "the snapshot commit ${MADE} is on local master and not pushed (git rev-parse --short failed); read it before pushing the commit by its id: git push reborn ${MADE}:refs/heads/master; ${PUSH_LINE}"
BATCHES=$(git ls-files -- "$SPEC" | wc -l | tr -d ' ') || fail "the snapshot commit ${MADE} is on local master and not pushed (git ls-files failed); read it before pushing the commit by its id: git push reborn ${MADE}:refs/heads/master; ${PUSH_LINE}"

# 9. Each push its own checked step, the snapshot commit by its id while local master is still that commit; never retried.
for REMOTE in $REMOTES; do
  NOW=$(git rev-parse -q --verify refs/heads/master) || NOW="unreadable"
  if [[ "$NOW" != "$MADE" ]]; then
    fail "local master moved after the snapshot commit ${HASH} (now ${NOW}); not pushed to ${REMOTE} (already pushed to: ${PUSHED[*]:-none}); not retried; read it before pushing the commit by its id: git push ${REMOTE} ${MADE}:refs/heads/master; ${PUSH_LINE}"
  fi
  PUSHING=$REMOTE
  if ! git push -q "$REMOTE" "${MADE}:refs/heads/master"; then
    PUSHING=""
    fail "snapshot ${HASH} is committed on local master, but the push to ${REMOTE} failed (already pushed to: ${PUSHED[*]:-none}); not retried; read it before pushing the commit by its id: git push ${REMOTE} ${MADE}:refs/heads/master; ${PUSH_LINE}"
  fi
  PUSHED+=("$REMOTE")
  PUSHING=""
done

# 10. The last line.
print -r -- "snapshot ${HASH} committed: ${ADDED} new, ${CHANGED} changed and ${REMOVED} removed, ${BATCHES} chapter batch files in all; pushed to ${(j: and :)PUSHED}"
