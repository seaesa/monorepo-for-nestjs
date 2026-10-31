-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'vi');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'en';
