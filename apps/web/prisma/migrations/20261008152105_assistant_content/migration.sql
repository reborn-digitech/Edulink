-- The assistant's content tables (docs/plans/assistant.md, Phase A, 8 October 2026): the curriculum
-- corpus (ContentDocument, ContentChunk) and the platform-help corpus (HelpEntry). No schoolId: they
-- sit in NO_SCHOOL_POLICY beside QuizTopic (scripts/gen-rls.ts), readable by the app role and written
-- by the owner only (scripts/db-grants.mjs). pgvector 0.8 here; the deployed Postgres must carry it,
-- and CI's service image is pgvector/pgvector (.github/workflows/battery.yml).
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "ContentDocument" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "gradeOrProgramme" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "edition" TEXT,
    "year" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "licenceUrl" TEXT NOT NULL,
    "licenceText" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "sha256" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "extra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "chapter" TEXT,
    "section" TEXT,
    "headingPath" TEXT[],
    "pageStart" INTEGER NOT NULL,
    "pageEnd" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "figureKeys" TEXT[],
    "edition" TEXT,
    "embedding" vector(1024),
    "embeddedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpEntry" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "roles" TEXT[],
    "pagePath" TEXT,
    "door" TEXT,
    "module" TEXT,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "commit" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "embedding" vector(1024),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentDocument_path_key" ON "ContentDocument"("path");

-- CreateIndex
CREATE INDEX "ContentDocument_board_gradeOrProgramme_subject_idx" ON "ContentDocument"("board", "gradeOrProgramme", "subject");

-- CreateIndex
CREATE INDEX "ContentDocument_source_idx" ON "ContentDocument"("source");

-- CreateIndex
CREATE INDEX "ContentChunk_documentId_idx" ON "ContentChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentChunk_documentId_ordinal_key" ON "ContentChunk"("documentId", "ordinal");

-- CreateIndex
CREATE INDEX "HelpEntry_commit_idx" ON "HelpEntry"("commit");

-- CreateIndex
CREATE INDEX "HelpEntry_language_idx" ON "HelpEntry"("language");

-- AddForeignKey
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ContentDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Written by hand, in shapes Prisma ignores (a partial index, an expression index), so no later
-- `migrate dev` diff proposes to drop them.
-- Cosine distance, the measure Qwen3-Embedding is trained for; pgvector's defaults (m 16,
-- ef_construction 64). Partial: a row is searchable once embedded, and the queries say
-- "embedding IS NOT NULL" so the planner can use it.
CREATE INDEX "ContentChunk_embedding_hnsw" ON "ContentChunk" USING hnsw ("embedding" vector_cosine_ops) WHERE "embedding" IS NOT NULL;
CREATE INDEX "HelpEntry_embedding_hnsw" ON "HelpEntry" USING hnsw ("embedding" vector_cosine_ops) WHERE "embedding" IS NOT NULL;
-- The keyword half of the hybrid search: English stemming for English rows, the simple
-- configuration (no stemming, no stop words) for Hindi and Marathi. The queries in
-- src/lib/assistant-retrieval.ts repeat these expressions exactly, or the index is not used.
CREATE INDEX "ContentChunk_text_fts" ON "ContentChunk" USING gin ((CASE WHEN "language" = 'en' THEN to_tsvector('english'::regconfig, "text") ELSE to_tsvector('simple'::regconfig, "text") END));
CREATE INDEX "HelpEntry_text_fts" ON "HelpEntry" USING gin ((CASE WHEN "language" = 'en' THEN to_tsvector('english'::regconfig, "title" || ' ' || "text") ELSE to_tsvector('simple'::regconfig, "title" || ' ' || "text") END));
