-- CreateEnum
CREATE TYPE "RoomRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "inviteCode" TEXT,
ADD COLUMN "inviteCodeExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RoomMember" ADD COLUMN "role" "RoomRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "RoomInvite" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "RoomInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_inviteCode_key" ON "Room"("inviteCode");

-- CreateIndex
CREATE INDEX "RoomMember_roomId_role_idx" ON "RoomMember"("roomId", "role");

-- CreateIndex
CREATE INDEX "RoomInvite_invitedUserId_status_idx" ON "RoomInvite"("invitedUserId", "status");

-- CreateIndex
CREATE INDEX "RoomInvite_roomId_status_idx" ON "RoomInvite"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RoomInvite_roomId_invitedUserId_key" ON "RoomInvite"("roomId", "invitedUserId");

-- AddForeignKey
ALTER TABLE "RoomInvite" ADD CONSTRAINT "RoomInvite_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomInvite" ADD CONSTRAINT "RoomInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomInvite" ADD CONSTRAINT "RoomInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data backfill for rooms that existed before roles were introduced:
-- make sure every creator is a member of their own room, and an ADMIN.
INSERT INTO "RoomMember" ("id", "userId", "roomId", "role")
SELECT 'c' || substr(md5(r."id" || r."createdById"), 1, 24), r."createdById", r."id", 'ADMIN'
FROM "Room" r
WHERE NOT EXISTS (
  SELECT 1 FROM "RoomMember" m WHERE m."roomId" = r."id" AND m."userId" = r."createdById"
);

UPDATE "RoomMember" m
SET "role" = 'ADMIN'
FROM "Room" r
WHERE r."id" = m."roomId" AND r."createdById" = m."userId";
