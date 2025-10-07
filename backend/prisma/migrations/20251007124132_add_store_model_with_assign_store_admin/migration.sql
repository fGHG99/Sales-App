-- CreateTable
CREATE TABLE "public"."stores" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phoneNumber" VARCHAR(20),
    "openHour" TIMESTAMP(3) NOT NULL,
    "closeHour" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addressId" UUID NOT NULL,
    "adminId" UUID,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_addressId_key" ON "public"."stores"("addressId");

-- CreateIndex
CREATE INDEX "stores_isActive_isDeleted_idx" ON "public"."stores"("isActive", "isDeleted");

-- CreateIndex
CREATE INDEX "stores_adminId_idx" ON "public"."stores"("adminId");

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
