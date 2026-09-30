-- The typeface a post is set in, by the web's key; "default" is the reader's own.
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "font" TEXT NOT NULL DEFAULT 'default';
