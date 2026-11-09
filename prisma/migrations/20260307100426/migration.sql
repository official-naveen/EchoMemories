-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT,
    "country" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "pulseScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Echo" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "roomId" TEXT,
    "isInSpace" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Echo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "echoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resonation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "echoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resonation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Save" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "echoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Save_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "echoId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_pulseScore_idx" ON "User"("pulseScore");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Room_createdById_idx" ON "Room"("createdById");

-- CreateIndex
CREATE INDEX "Room_isPublic_idx" ON "Room"("isPublic");

-- CreateIndex
CREATE INDEX "RoomMember_userId_idx" ON "RoomMember"("userId");

-- CreateIndex
CREATE INDEX "RoomMember_roomId_idx" ON "RoomMember"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_userId_roomId_key" ON "RoomMember"("userId", "roomId");

-- CreateIndex
CREATE INDEX "Echo_authorId_idx" ON "Echo"("authorId");

-- CreateIndex
CREATE INDEX "Echo_roomId_idx" ON "Echo"("roomId");

-- CreateIndex
CREATE INDEX "Echo_createdAt_idx" ON "Echo"("createdAt");

-- CreateIndex
CREATE INDEX "Echo_isInSpace_idx" ON "Echo"("isInSpace");

-- CreateIndex
CREATE INDEX "Comment_echoId_idx" ON "Comment"("echoId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Resonation_echoId_idx" ON "Resonation"("echoId");

-- CreateIndex
CREATE UNIQUE INDEX "Resonation_userId_echoId_key" ON "Resonation"("userId", "echoId");

-- CreateIndex
CREATE INDEX "Save_userId_idx" ON "Save"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Save_userId_echoId_key" ON "Save"("userId", "echoId");

-- CreateIndex
CREATE INDEX "Mention_mentionedUserId_idx" ON "Mention"("mentionedUserId");

-- CreateIndex
CREATE INDEX "UserLog_userId_idx" ON "UserLog"("userId");

-- CreateIndex
CREATE INDEX "UserLog_createdAt_idx" ON "UserLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Echo" ADD CONSTRAINT "Echo_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Echo" ADD CONSTRAINT "Echo_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_echoId_fkey" FOREIGN KEY ("echoId") REFERENCES "Echo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resonation" ADD CONSTRAINT "Resonation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resonation" ADD CONSTRAINT "Resonation_echoId_fkey" FOREIGN KEY ("echoId") REFERENCES "Echo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_echoId_fkey" FOREIGN KEY ("echoId") REFERENCES "Echo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_echoId_fkey" FOREIGN KEY ("echoId") REFERENCES "Echo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLog" ADD CONSTRAINT "UserLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
