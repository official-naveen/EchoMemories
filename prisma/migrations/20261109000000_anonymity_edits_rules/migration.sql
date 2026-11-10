-- Anonymous echoes and replies, edited markers, reply-to-reply, room rules.

ALTER TABLE "Echo"
  ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "editedAt" TIMESTAMP(3);

ALTER TABLE "Comment"
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "editedAt" TIMESTAMP(3);

ALTER TABLE "Room"
  ADD COLUMN "rules" TEXT,
  ADD COLUMN "allowAnonymous" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Everything already in Space was anonymous: keep it that way.
UPDATE "Echo" SET "isAnonymous" = true WHERE "isInSpace" = true;
UPDATE "Comment" SET "isAnonymous" = true
  WHERE "echoId" IN (SELECT id FROM "Echo" WHERE "isInSpace" = true);
