-- AlterTable
ALTER TABLE "ContentDocument" ADD COLUMN     "attribution" JSONB,
ADD COLUMN     "audience" TEXT,
ADD COLUMN     "licenceName" TEXT,
ADD COLUMN     "streams" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ReferenceSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "licence" TEXT NOT NULL,
    "licenceUrl" TEXT,
    "linkTemplate" TEXT NOT NULL,
    "shownTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceSource_name_key" ON "ReferenceSource"("name");

-- The allow-list's first five sources (docs/plans/vidura.md, the owner's decision 8; Vidura pass 4, 18 Oct 2026). Links
-- only: nothing of theirs is copied into the corpus. Each licence is the source's own words or name, as read on
-- 18 October 2026. Shown to staff and adult college students; never to a pupil while decision 0002 stands.
INSERT INTO "ReferenceSource" ("id", "name", "host", "kind", "licence", "licenceUrl", "linkTemplate", "shownTo", "enabled", "createdAt", "updatedAt") VALUES
  ('refsrc_ncert_channel', 'NCERT OFFICIAL (YouTube)', 'www.youtube.com', 'VIDEO', 'YouTube''s standard licence for the channel''s videos; NCERT''s own terms on its site. Linked, never copied.', 'https://www.youtube.com/static?template=terms', 'https://www.youtube.com/@NCERTOFFICIAL/search?query={topic}', ARRAY['TEACHER','FACULTY','HOD','STUDENT'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('refsrc_nptel', 'NPTEL', 'nptel.ac.in', 'COURSE', 'Distributed under Creative Commons Attribution-ShareAlike, CC BY-NC-SA (the site''s footer). Linked, never copied: the non-commercial clause keeps it out of the corpus.', 'https://creativecommons.org/licenses/by-nc-sa/4.0/', 'https://nptel.ac.in/courses?searchText={topic}', ARRAY['TEACHER','FACULTY','HOD','STUDENT'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('refsrc_swayam', 'SWAYAM', 'swayam.gov.in', 'COURSE', 'Course materials are for a learner''s personal use in connection with the course (SWAYAM Terms of Use, "Your Right to use Content"). Linked, never copied.', 'https://swayam.gov.in/terms_of_use', 'https://swayam.gov.in/explorer?searchText={topic}', ARRAY['TEACHER','FACULTY','HOD','STUDENT'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('refsrc_khan_india', 'Khan Academy India', 'www.khanacademy.org', 'PRACTICE', 'Khan Academy''s Terms of Service. Linked, never copied.', 'https://www.khanacademy.org/about/tos', 'https://www.khanacademy.org/search?page_search_query={topic}', ARRAY['TEACHER','FACULTY','HOD','STUDENT'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('refsrc_india_code', 'India Code', 'indiacode.gov.in', 'LAW', 'Copyright Policy of 22 June 2026: the content is the Legislative Department''s; reproduction, commercial use and systematic extraction need its written permission. Its Hyper Linking Policy: "no prior permission is required" to link. Linked, never copied.', 'https://indiacode.gov.in/info/copyright-policy', 'https://indiacode.gov.in/search?query={topic}', ARRAY['TEACHER','FACULTY','HOD','STUDENT'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
