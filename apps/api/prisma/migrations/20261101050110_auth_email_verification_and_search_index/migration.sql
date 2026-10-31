-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notes_title_idx" ON "notes" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "notes_content_idx" ON "notes" USING GIN ("content" gin_trgm_ops);
