-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "agreed" BOOLEAN NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_access_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "accessedData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_versions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "consent_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_consents_userId_idx" ON "user_consents"("userId");

-- CreateIndex
CREATE INDEX "user_consents_consentType_idx" ON "user_consents"("consentType");

-- CreateIndex
CREATE INDEX "user_consents_version_idx" ON "user_consents"("version");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_consentType_version_key" ON "user_consents"("userId", "consentType", "version");

-- CreateIndex
CREATE INDEX "admin_access_logs_adminId_idx" ON "admin_access_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_access_logs_targetUserId_idx" ON "admin_access_logs"("targetUserId");

-- CreateIndex
CREATE INDEX "admin_access_logs_createdAt_idx" ON "admin_access_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_access_logs_action_idx" ON "admin_access_logs"("action");

-- CreateIndex
CREATE INDEX "consent_versions_type_idx" ON "consent_versions"("type");

-- CreateIndex
CREATE INDEX "consent_versions_isActive_idx" ON "consent_versions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "consent_versions_type_version_key" ON "consent_versions"("type", "version");

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_access_logs" ADD CONSTRAINT "admin_access_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_access_logs" ADD CONSTRAINT "admin_access_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
