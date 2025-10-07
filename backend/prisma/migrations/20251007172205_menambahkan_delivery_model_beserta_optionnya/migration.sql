/*
  Warnings:

  - A unique constraint covering the columns `[deliveryOptionId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cashAmount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `changeAmount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DeliveryType" AS ENUM ('DELIVERY', 'PICKUP_TO_STORE');

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "cashAmount" DECIMAL(10,0) NOT NULL,
ADD COLUMN     "changeAmount" DECIMAL(10,0) NOT NULL,
ADD COLUMN     "deliveryOptionId" UUID,
ADD COLUMN     "subtotal" DECIMAL(10,0) NOT NULL;

-- CreateTable
CREATE TABLE "public"."delivery_options" (
    "id" UUID NOT NULL,
    "deliveryType" "public"."DeliveryType" NOT NULL,
    "fee" DECIMAL(10,0) NOT NULL,
    "pickupTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" UUID,

    CONSTRAINT "delivery_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_deliveryOptionId_key" ON "public"."orders"("deliveryOptionId");

-- AddForeignKey
ALTER TABLE "public"."delivery_options" ADD CONSTRAINT "delivery_options_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_deliveryOptionId_fkey" FOREIGN KEY ("deliveryOptionId") REFERENCES "public"."delivery_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
