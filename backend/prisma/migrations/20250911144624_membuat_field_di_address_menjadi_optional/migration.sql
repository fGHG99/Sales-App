-- AlterTable
ALTER TABLE "public"."Address" ALTER COLUMN "sub_district" DROP NOT NULL,
ALTER COLUMN "district" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL;
