-- Six-digit code attempts move out of AuthToken.meta (a read-then-written JSON count
-- that a burst of concurrent guesses all read as 0) into an integer column charged by
-- one conditional UPDATE: attempts = attempts + 1 WHERE attempts < cap.
ALTER TABLE "AuthToken" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
