-- CreateEnum
CREATE TYPE "public"."DisputeReason" AS ENUM ('WRONG_ITEM', 'DAMAGED_ITEM', 'MISSING_ITEM', 'LATE_DELIVERY', 'POOR_QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DisputeStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."disputes" (
    "id" UUID NOT NULL,
    "reason" "public"."DisputeReason" NOT NULL,
    "status" "public"."DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "response" TEXT,
    "imageUrl" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "orderId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disputes_orderId_idx" ON "public"."disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_userId_idx" ON "public"."disputes"("userId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "public"."disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_createdAt_idx" ON "public"."disputes"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
