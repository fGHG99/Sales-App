-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "deliveryProof" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "workAreaPostalCodes" TEXT[];
