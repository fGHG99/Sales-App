/*
  Warnings:

  - You are about to drop the column `deliveryOptionId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderItems` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `delivery_options` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deliveryFee` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryType` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."delivery_options" DROP CONSTRAINT "delivery_options_storeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_deliveryAddressId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_deliveryOptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropIndex
DROP INDEX "public"."orders_deliveryOptionId_key";

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "deliveryOptionId",
DROP COLUMN "isDeleted",
DROP COLUMN "orderItems",
ADD COLUMN     "deliveryFee" DECIMAL(10,0) NOT NULL,
ADD COLUMN     "deliveryType" "public"."DeliveryType" NOT NULL,
ADD COLUMN     "pickupStoreId" UUID,
ADD COLUMN     "pickupTime" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."delivery_options";

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "public"."orders"("userId");

-- CreateIndex
CREATE INDEX "orders_courierId_idx" ON "public"."orders"("courierId");

-- CreateIndex
CREATE INDEX "orders_pickupStoreId_idx" ON "public"."orders"("pickupStoreId");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "public"."orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "orders_orderStatus_idx" ON "public"."orders"("orderStatus");

-- CreateIndex
CREATE INDEX "orders_deliveryType_idx" ON "public"."orders"("deliveryType");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "public"."addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_pickupStoreId_fkey" FOREIGN KEY ("pickupStoreId") REFERENCES "public"."stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
