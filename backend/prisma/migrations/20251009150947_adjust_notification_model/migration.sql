/*
  Warnings:

  - Added the required column `userId` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('INFO', 'ORDER');

-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "orderId" UUID,
ADD COLUMN     "type" "public"."NotificationType" NOT NULL DEFAULT 'INFO',
ADD COLUMN     "userId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");
