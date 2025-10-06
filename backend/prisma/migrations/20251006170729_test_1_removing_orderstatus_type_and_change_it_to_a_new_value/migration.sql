/*
  Warnings:

  - The values [PAID,SHIPPED,CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `acccessKey` on the `access_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `costPrice` on the `product_batches` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(10,0)`.
  - You are about to drop the column `updatedat` on the `products` table. All the data in the column will be lost.
  - You are about to alter the column `sellingPrice` on the `products` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(10,0)`.
  - You are about to drop the `cart_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accessKey` to the `access_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `carts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('PENDING', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELED', 'GRACE_PERIOD');
ALTER TABLE "public"."orders" ALTER COLUMN "orderStatus" DROP DEFAULT;
ALTER TABLE "public"."orders" ALTER COLUMN "orderStatus" TYPE "public"."OrderStatus_new" USING ("orderStatus"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."orders" ALTER COLUMN "orderStatus" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."cart_items" DROP CONSTRAINT "cart_items_cartId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cart_items" DROP CONSTRAINT "cart_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- AlterTable
ALTER TABLE "public"."access_permissions" DROP COLUMN "acccessKey",
ADD COLUMN     "accessKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."carts" DROP COLUMN "updateAt",
ADD COLUMN     "cartItems" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."images" ADD COLUMN     "thumbnailUrl" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "updateAt",
ADD COLUMN     "orderItems" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."product_batches" ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(10,0);

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "updatedat",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "sellingPrice" SET DATA TYPE DECIMAL(10,0);

-- DropTable
DROP TABLE "public"."cart_items";

-- DropTable
DROP TABLE "public"."order_items";
