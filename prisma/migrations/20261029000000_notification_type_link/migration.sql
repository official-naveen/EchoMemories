-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN "link" TEXT;
