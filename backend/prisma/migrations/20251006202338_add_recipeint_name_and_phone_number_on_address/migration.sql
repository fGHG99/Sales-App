/*
  Warnings:

  - Added the required column `recipientName` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientPhone` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."addresses" ADD COLUMN     "recipientName" VARCHAR(100) NOT NULL,
ADD COLUMN     "recipientPhone" VARCHAR(20) NOT NULL;
