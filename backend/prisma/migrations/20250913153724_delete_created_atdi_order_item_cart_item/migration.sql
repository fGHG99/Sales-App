/*
  Warnings:

  - You are about to drop the column `createdAt` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `order_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."cart_items" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "public"."order_items" DROP COLUMN "createdAt",
DROP COLUMN "subtotal",
DROP COLUMN "unitPrice";
