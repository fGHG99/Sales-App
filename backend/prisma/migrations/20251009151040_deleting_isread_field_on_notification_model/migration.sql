/*
  Warnings:

  - You are about to drop the column `isRead` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "isRead",
DROP COLUMN "orderId";
