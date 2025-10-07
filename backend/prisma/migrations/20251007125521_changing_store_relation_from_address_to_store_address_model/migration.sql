-- DropForeignKey
ALTER TABLE "public"."stores" DROP CONSTRAINT "stores_addressId_fkey";

-- CreateTable
CREATE TABLE "public"."store_addresses" (
    "id" UUID NOT NULL,
    "fullAddress" VARCHAR(100) NOT NULL,
    "subDistrict" VARCHAR(100),
    "district" VARCHAR(100),
    "city" VARCHAR(100),
    "province" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(100) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "store_addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."store_addresses" ADD CONSTRAINT "store_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."store_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
