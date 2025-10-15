-- CreateTable
CREATE TABLE "public"."delivery_fee_settings" (
    "id" UUID NOT NULL,
    "feeAmount" DECIMAL(10,0) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_fee_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_fee_settings_isActive_idx" ON "public"."delivery_fee_settings"("isActive");
